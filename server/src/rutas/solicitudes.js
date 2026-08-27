/**
 * Solicitudes de insumos del portal de autoconsulta (AD-03 — docs/11).
 * Flujo: el Funcionario crea → Gestor/Administrador aprueba o rechaza
 * (observación obligatoria al rechazar) → al marcar Entregada se generan
 * los egresos de almacén EN LA MISMA transacción; si falta stock, la
 * entrega falla completa con STOCK_INSUFICIENTE y el detalle del ítem.
 *
 * El solicitante solo ve las propias: el filtro sale de la sesión, nunca
 * de un parámetro (docs/14).
 */
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { siguienteFolio } from '../dominio/folios.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasSolicitudes = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

const esquemaCrear = z.object({
  items: z
    .array(z.object({ itemId: z.string().min(1), cantidad: z.coerce.number().int().min(1) }))
    .min(1),
  observacion: z.string().optional().default(''),
})

const conItems = { items: true }

function serializar(solicitud) {
  return solicitud
}

async function solicitudExistente(id) {
  const solicitud = await db.solicitud.findUnique({ where: { id }, include: conItems })
  if (!solicitud) throw new ErrorHttp('SOLICITUD_NO_ENCONTRADA', 404)
  return solicitud
}

// --- Portal -------------------------------------------------------------

// Cualquier rol con sesión puede solicitar (el Funcionario es el caso típico).
rutasSolicitudes.post('/', autorizar(), async (req, res, next) => {
  try {
    const datos = esquemaCrear.parse(req.body)

    const ids = datos.items.map((item) => item.itemId)
    const existentes = await db.itemAlmacen.findMany({ where: { id: { in: ids } } })
    const porId = new Map(existentes.map((item) => [item.id, item]))
    for (const item of datos.items) {
      if (!porId.has(item.itemId)) throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404)
    }

    const creada = await db.$transaction(async (tx) => {
      const folio = await siguienteFolio(tx, 'SOL')
      const solicitud = await tx.solicitud.create({
        data: {
          folio,
          solicitanteId: req.usuario.id,
          solicitanteNombre: req.usuario.nombre,
          observacion: datos.observacion,
          items: {
            create: datos.items.map((item) => ({
              itemId: item.itemId,
              itemNombre: porId.get(item.itemId).nombre,
              cantidad: item.cantidad,
            })),
          },
        },
        include: conItems,
      })
      await auditar(
        req,
        {
          modulo: 'solicitudes',
          accion: 'creacion',
          entidad: 'solicitud',
          entidadId: solicitud.id,
          entidadFolio: solicitud.folio,
          detalle: `Solicitud ${solicitud.folio} creada con ${solicitud.items.length} ítem(es).`,
        },
        tx,
      )
      return solicitud
    })

    res.status(201).json(serializar(creada))
  } catch (err) {
    next(err)
  }
})

// Catálogo para "Nueva solicitud" (docs/11): stock visible, sin datos del
// panel. Disponible para cualquier rol con sesión — el listado completo
// del almacén sigue siendo solo del panel.
rutasSolicitudes.get('/catalogo', autorizar(), async (_req, res, next) => {
  try {
    const filas = await db.itemAlmacen.findMany({ orderBy: { nombre: 'asc' } })
    res.json(
      filas.map((item) => ({
        id: item.id,
        folio: item.folio,
        nombre: item.nombre,
        categoria: item.categoria,
        unidad: item.unidad,
        stock: item.stock,
        ubicacion: item.ubicacion,
      })),
    )
  } catch (err) {
    next(err)
  }
})

rutasSolicitudes.get('/mias', autorizar(), async (req, res, next) => {
  try {
    const filas = await db.solicitud.findMany({
      where: { solicitanteId: req.usuario.id },
      include: conItems,
      orderBy: { fecha: 'desc' },
    })
    res.json(filas.map(serializar))
  } catch (err) {
    next(err)
  }
})

// --- Panel --------------------------------------------------------------

rutasSolicitudes.get('/', autorizar(...PANEL), async (req, res, next) => {
  try {
    const { estado = '', itemId = '' } = req.query
    const filtro = {}
    if (estado) filtro.estado = String(estado)
    if (itemId) filtro.items = { some: { itemId: String(itemId) } }
    const filas = await db.solicitud.findMany({
      where: filtro,
      include: conItems,
      orderBy: { fecha: 'desc' },
    })
    res.json(filas.map(serializar))
  } catch (err) {
    next(err)
  }
})

// Badge del Sidebar: cuenta de pendientes.
rutasSolicitudes.get('/resumen', autorizar(...PANEL), async (_req, res, next) => {
  try {
    res.json({ pendientes: await db.solicitud.count({ where: { estado: 'pendiente' } }) })
  } catch (err) {
    next(err)
  }
})

// Dueño o panel: el solicitante solo ve las propias (docs/14).
rutasSolicitudes.get('/:id', autorizar(), async (req, res, next) => {
  try {
    const solicitud = await solicitudExistente(req.params.id)
    const esPanel = PANEL.includes(req.usuario.rol)
    if (!esPanel && solicitud.solicitanteId !== req.usuario.id) {
      throw new ErrorHttp('SOLICITUD_NO_ENCONTRADA', 404)
    }
    res.json(serializar(solicitud))
  } catch (err) {
    next(err)
  }
})

rutasSolicitudes.post('/:id/aprobar', autorizar(...GESTION), async (req, res, next) => {
  try {
    const solicitud = await solicitudExistente(req.params.id)
    if (solicitud.estado !== 'pendiente') throw new ErrorHttp('SOLICITUD_YA_RESUELTA', 409)
    const observacion = String(req.body?.observacion ?? '')

    const aprobada = await db.$transaction(async (tx) => {
      const fila = await tx.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: 'aprobada',
          observacionResolucion: observacion,
          resueltaPor: req.usuario.nombre,
          fechaResolucion: new Date(),
        },
        include: conItems,
      })
      await auditar(
        req,
        {
          modulo: 'solicitudes',
          accion: 'aprobacion',
          entidad: 'solicitud',
          entidadId: solicitud.id,
          entidadFolio: solicitud.folio,
          detalle: `Solicitud ${solicitud.folio} aprobada.`,
        },
        tx,
      )
      return fila
    })
    res.json(serializar(aprobada))
  } catch (err) {
    next(err)
  }
})

rutasSolicitudes.post('/:id/rechazar', autorizar(...GESTION), async (req, res, next) => {
  try {
    const solicitud = await solicitudExistente(req.params.id)
    if (solicitud.estado !== 'pendiente') throw new ErrorHttp('SOLICITUD_YA_RESUELTA', 409)
    const observacion = String(req.body?.observacion ?? '').trim()
    if (!observacion) throw new ErrorHttp('OBSERVACION_REQUERIDA', 400)

    const rechazada = await db.$transaction(async (tx) => {
      const fila = await tx.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: 'rechazada',
          observacionResolucion: observacion,
          resueltaPor: req.usuario.nombre,
          fechaResolucion: new Date(),
        },
        include: conItems,
      })
      await auditar(
        req,
        {
          modulo: 'solicitudes',
          accion: 'rechazo',
          entidad: 'solicitud',
          entidadId: solicitud.id,
          entidadFolio: solicitud.folio,
          detalle: `Solicitud ${solicitud.folio} rechazada: ${observacion}`,
        },
        tx,
      )
      return fila
    })
    res.json(serializar(rechazada))
  } catch (err) {
    next(err)
  }
})

// Entrega: SOLO aprobadas; egresos y estado en la MISMA transacción.
rutasSolicitudes.post('/:id/entregar', autorizar(...GESTION), async (req, res, next) => {
  try {
    const solicitud = await solicitudExistente(req.params.id)
    if (solicitud.estado !== 'aprobada') throw new ErrorHttp('SOLICITUD_NO_APROBADA', 409)

    const entregada = await db.$transaction(async (tx) => {
      for (const item of solicitud.items) {
        const fila = await tx.itemAlmacen.findUnique({ where: { id: item.itemId } })
        if (!fila) {
          throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404, `El ítem "${item.itemNombre}" ya no existe en el almacén.`)
        }
        if (fila.stock < item.cantidad) {
          // La entrega falla COMPLETA: la transacción revierte lo hecho.
          throw new ErrorHttp(
            'STOCK_INSUFICIENTE',
            409,
            `Stock insuficiente de "${fila.nombre}": disponibles ${fila.stock}, solicitados ${item.cantidad}.`,
          )
        }
        const stockResultante = fila.stock - item.cantidad
        await tx.itemAlmacen.update({
          where: { id: fila.id },
          data: { stock: stockResultante },
        })
        await tx.movimientoAlmacen.create({
          data: {
            itemId: fila.id,
            tipo: 'egreso',
            cantidad: item.cantidad,
            stockResultante,
            motivo: `Entrega solicitud ${solicitud.folio}`,
            usuario: req.usuario.nombre,
            solicitudId: solicitud.id,
          },
        })
      }

      const fila = await tx.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: 'entregada',
          resueltaPor: req.usuario.nombre,
          fechaResolucion: new Date(),
        },
        include: conItems,
      })
      await auditar(
        req,
        {
          modulo: 'solicitudes',
          accion: 'entrega',
          entidad: 'solicitud',
          entidadId: solicitud.id,
          entidadFolio: solicitud.folio,
          detalle: `Solicitud ${solicitud.folio} entregada; egresos de almacén generados.`,
        },
        tx,
      )
      return fila
    })
    res.json(serializar(entregada))
  } catch (err) {
    next(err)
  }
})
