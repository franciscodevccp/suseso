/**
 * Activos fijos (docs/03 §Activos). Contrato idéntico al mock: mismos
 * códigos de error (NOMBRE_REQUERIDO, ACTIVO_NO_ENCONTRADO,
 * ACTIVO_DADO_DE_BAJA) y mismos textos de `detalle` en los movimientos.
 *
 * Autorización (docs/04): lectura para todos los roles con sesión — el
 * portal de autoconsulta (Funcionario) busca por folio/código y ve fichas;
 * en el listado, a Funcionario se le fuerza el filtro `responsable` a su
 * propio nombre ("Mis bienes", docs/14). Mutaciones solo Administrador y
 * Gestor de Activos.
 */
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { siguienteFolio } from '../dominio/folios.js'
import { normalizarCodigo, serializarActivo } from '../dominio/serializar.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasActivos = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

const esquemaDatos = z.object({
  nombre: z.string().default(''),
  descripcion: z.string().optional().default(''),
  categoria: z.string().min(1),
  ubicacion: z.string().min(1),
  responsable: z.string().optional().default(''),
  valor: z.coerce.number().optional().default(0),
  codigoBarras: z.string().optional().default(''),
  rfid: z.string().optional().default(''),
  // Mantención y garantía (RQ-17): fechas AAAA-MM-DD u omitidas.
  proximaMantencion: z.string().optional().default(''),
  finGarantia: z.string().optional().default(''),
})

const comoFecha = (valor) => (valor ? new Date(valor) : null)

function validarNombre(datos) {
  if (!datos.nombre?.trim()) throw new ErrorHttp('NOMBRE_REQUERIDO', 400)
}

async function activoVigente(id) {
  const activo = await db.activo.findUnique({ where: { id } })
  if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)
  if (activo.estado === 'dado_de_baja') throw new ErrorHttp('ACTIVO_DADO_DE_BAJA', 409)
  return activo
}

// --- Lecturas (rutas fijas ANTES de /:id, docs/03 §convenciones) --------

rutasActivos.get('/', autorizar(), async (req, res, next) => {
  try {
    const { texto = '', categoria = '', ubicacion = '', estado = '' } = req.query
    // Funcionario solo ve sus bienes: el filtro sale de la sesión, nunca
    // del cliente (docs/14).
    const responsable =
      req.usuario.rol === 'Funcionario' ? req.usuario.nombre : (req.query.responsable ?? '')

    const filtroTexto = String(texto).trim()
    const activos = await db.activo.findMany({
      where: {
        ...(categoria ? { categoria: String(categoria) } : {}),
        ...(ubicacion ? { ubicacion: String(ubicacion) } : {}),
        ...(estado ? { estado: String(estado) } : {}),
        ...(responsable ? { responsable: String(responsable) } : {}),
        ...(filtroTexto
          ? {
              OR: [
                { folio: { contains: filtroTexto, mode: 'insensitive' } },
                { nombre: { contains: filtroTexto, mode: 'insensitive' } },
                { descripcion: { contains: filtroTexto, mode: 'insensitive' } },
                { codigoBarras: { contains: filtroTexto, mode: 'insensitive' } },
                { rfid: { contains: filtroTexto, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { folio: 'asc' },
    })
    res.json(activos.map(serializarActivo))
  } catch (err) {
    next(err)
  }
})

rutasActivos.get('/movimientos', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const movimientos = await db.movimientoActivo.findMany({
      orderBy: { fecha: 'desc' },
      take: 5000,
    })
    res.json(movimientos)
  } catch (err) {
    next(err)
  }
})

// Escáner (docs/08): folio, código de barras o RFID exactos.
rutasActivos.get('/por-codigo/:codigo', autorizar(), async (req, res, next) => {
  try {
    const codigo = req.params.codigo.trim()
    const activo = await db.activo.findFirst({
      where: { OR: [{ folio: codigo }, { codigoBarras: codigo }, { rfid: codigo }] },
    })
    if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)
    res.json(serializarActivo(activo))
  } catch (err) {
    next(err)
  }
})

rutasActivos.get('/:id', autorizar(), async (req, res, next) => {
  try {
    const activo = await db.activo.findUnique({
      where: { id: req.params.id },
      include: { adjuntos: true },
    })
    if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)
    res.json(serializarActivo(activo))
  } catch (err) {
    next(err)
  }
})

rutasActivos.get('/:id/movimientos', autorizar(), async (req, res, next) => {
  try {
    const movimientos = await db.movimientoActivo.findMany({
      where: { activoId: req.params.id },
      orderBy: { fecha: 'desc' },
    })
    res.json(movimientos)
  } catch (err) {
    next(err)
  }
})

// --- Mutaciones (Administrador y Gestor de Activos) ---------------------

rutasActivos.post('/', autorizar(...GESTION), async (req, res, next) => {
  try {
    const datos = esquemaDatos.parse(req.body)
    validarNombre(datos)

    const creado = await db.$transaction(async (tx) => {
      const folio = await siguienteFolio(tx, 'AF')
      const activo = await tx.activo.create({
        data: {
          folio,
          codigoBarras: normalizarCodigo(datos.codigoBarras),
          rfid: normalizarCodigo(datos.rfid),
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion ?? '',
          categoria: datos.categoria,
          ubicacion: datos.ubicacion,
          responsable: datos.responsable ?? '',
          estado: 'activo',
          valor: datos.valor,
          fechaAlta: new Date(),
          proximaMantencion: comoFecha(datos.proximaMantencion),
          finGarantia: comoFecha(datos.finGarantia),
        },
      })
      await tx.movimientoActivo.create({
        data: {
          activoId: activo.id,
          tipo: 'alta',
          detalle: `Alta del activo "${activo.nombre}" (folio ${activo.folio}).`,
          usuario: req.usuario.nombre,
          usuarioId: req.usuario.id,
        },
      })
      await auditar(
        req,
        {
          modulo: 'activos',
          accion: 'alta',
          entidad: 'activo',
          entidadId: activo.id,
          entidadFolio: activo.folio,
          detalle: `Alta del activo "${activo.nombre}" (${activo.folio}).`,
        },
        tx,
      )
      return activo
    })

    res.status(201).json(serializarActivo(creado))
  } catch (err) {
    next(err)
  }
})

rutasActivos.put('/:id', autorizar(...GESTION), async (req, res, next) => {
  try {
    const datos = esquemaDatos.parse(req.body)
    validarNombre(datos)
    const activo = await activoVigente(req.params.id)

    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.activo.update({
        where: { id: activo.id },
        data: {
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion ?? '',
          categoria: datos.categoria,
          ubicacion: datos.ubicacion,
          responsable: datos.responsable ?? '',
          valor: datos.valor,
          codigoBarras: normalizarCodigo(datos.codigoBarras),
          rfid: normalizarCodigo(datos.rfid),
          proximaMantencion: comoFecha(datos.proximaMantencion),
          finGarantia: comoFecha(datos.finGarantia),
        },
      })
      await tx.movimientoActivo.create({
        data: {
          activoId: activo.id,
          tipo: 'edicion',
          detalle: 'Se actualizaron los datos del activo.',
          usuario: req.usuario.nombre,
          usuarioId: req.usuario.id,
        },
      })
      await auditar(
        req,
        {
          modulo: 'activos',
          accion: 'edicion',
          entidad: 'activo',
          entidadId: activo.id,
          entidadFolio: activo.folio,
          detalle: `Edición del activo "${fila.nombre}" (${activo.folio}).`,
        },
        tx,
      )
      return fila
    })

    res.json(serializarActivo(actualizado))
  } catch (err) {
    next(err)
  }
})

rutasActivos.post('/:id/baja', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { motivo } = z.object({ motivo: z.string().min(1) }).parse(req.body)
    const activo = await activoVigente(req.params.id)

    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.activo.update({
        where: { id: activo.id },
        data: { estado: 'dado_de_baja', fechaBaja: new Date(), motivoBaja: motivo },
      })
      await tx.movimientoActivo.create({
        data: {
          activoId: activo.id,
          tipo: 'baja',
          detalle: `Baja del activo. Motivo: ${motivo}.`,
          usuario: req.usuario.nombre,
          usuarioId: req.usuario.id,
        },
      })
      await auditar(
        req,
        {
          modulo: 'activos',
          accion: 'baja',
          entidad: 'activo',
          entidadId: activo.id,
          entidadFolio: activo.folio,
          detalle: `Baja del activo "${activo.nombre}" (${activo.folio}). Motivo: ${motivo}.`,
        },
        tx,
      )
      return fila
    })

    res.json(serializarActivo(actualizado))
  } catch (err) {
    next(err)
  }
})

rutasActivos.post('/:id/traslado', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { ubicacion, responsable, motivo } = z
      .object({
        ubicacion: z.string().optional(),
        responsable: z.string().optional(),
        motivo: z.string().optional(),
      })
      .parse(req.body)
    const activo = await activoVigente(req.params.id)

    const origen = { ubicacion: activo.ubicacion, responsable: activo.responsable }
    const destino = {
      ubicacion: ubicacion || activo.ubicacion,
      responsable: responsable || activo.responsable,
    }
    let detalle = `Traslado de "${origen.ubicacion}" (${origen.responsable || 'sin responsable'}) a "${destino.ubicacion}" (${destino.responsable || 'sin responsable'}).`
    if (motivo?.trim()) detalle += ` Motivo: ${motivo.trim()}.`

    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.activo.update({
        where: { id: activo.id },
        data: { ubicacion: destino.ubicacion, responsable: destino.responsable },
      })
      await tx.movimientoActivo.create({
        data: {
          activoId: activo.id,
          tipo: 'traslado',
          detalle,
          usuario: req.usuario.nombre,
          usuarioId: req.usuario.id,
          ubicacionAnterior: origen.ubicacion,
          ubicacionNueva: destino.ubicacion,
          responsableAnterior: origen.responsable,
          responsableNuevo: destino.responsable,
        },
      })
      await auditar(
        req,
        {
          modulo: 'activos',
          accion: 'traslado',
          entidad: 'activo',
          entidadId: activo.id,
          entidadFolio: activo.folio,
          detalle: `${detalle} (${activo.folio})`,
        },
        tx,
      )
      return fila
    })

    res.json(serializarActivo(actualizado))
  } catch (err) {
    next(err)
  }
})
