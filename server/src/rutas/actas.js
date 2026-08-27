/**
 * Actas (docs/03). El schema ya usa los nombres definitivos de docs/13
 * (estado/cerradaPor/fechaCierre/selloIntegridad); mientras la UI no se
 * renombre (B2), el SERVICIO del front mapea a las claves que las vistas
 * esperan (estadoFirma/firmante/fechaFirma/selloVerificacion).
 *
 * El sello se calcula EN EL SERVIDOR con el mismo formato que usaba el
 * mock — SHA-256 de `folio|contenido|usuario|fechaISO` — para que la
 * verificación de integridad (B2) recalcule y compare.
 */
import { createHash } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { siguienteFolio } from '../dominio/folios.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasActas = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

rutasActas.get('/', autorizar(...PANEL), async (_req, res, next) => {
  try {
    // Más reciente primero: el folio es correlativo, ordena solo (mock).
    res.json(await db.acta.findMany({ orderBy: { folio: 'desc' } }))
  } catch (err) {
    next(err)
  }
})

rutasActas.get('/:id', autorizar(...PANEL), async (req, res, next) => {
  try {
    const acta = await db.acta.findUnique({ where: { id: req.params.id } })
    if (!acta) throw new ErrorHttp('ACTA_NO_ENCONTRADA', 404)
    res.json(acta)
  } catch (err) {
    next(err)
  }
})

rutasActas.post('/', autorizar(...GESTION), async (req, res, next) => {
  try {
    const datos = z
      .object({
        tipo: z.string().min(1),
        activoId: z.string().nullish(),
        activoFolio: z.string().nullish(),
        activoNombre: z.string().nullish(),
        responsable: z.string().default(''),
        contenido: z.string().default(''),
      })
      .parse(req.body)
    if (!datos.responsable?.trim()) throw new ErrorHttp('RESPONSABLE_REQUERIDO', 400)
    if (!datos.contenido?.trim()) throw new ErrorHttp('CONTENIDO_REQUERIDO', 400)

    const creada = await db.$transaction(async (tx) => {
      const folio = await siguienteFolio(tx, 'ACT')
      const acta = await tx.acta.create({
        data: {
          folio,
          tipo: datos.tipo,
          activoId: datos.activoId ?? null,
          activoFolio: datos.activoFolio ?? null,
          activoNombre: datos.activoNombre ?? null,
          responsable: datos.responsable.trim(),
          contenido: datos.contenido.trim(),
          creadaPor: req.usuario.nombre,
        },
      })
      await auditar(
        req,
        {
          modulo: 'actas',
          accion: 'creacion',
          entidad: 'acta',
          entidadId: acta.id,
          entidadFolio: acta.folio,
          detalle: `Creación del acta ${acta.folio} (${acta.tipo}) para ${acta.responsable}.`,
        },
        tx,
      )
      return acta
    })

    res.status(201).json(creada)
  } catch (err) {
    next(err)
  }
})

// Verificación de integridad (docs/13): recalcula el sello con los datos
// guardados y lo compara con el emitido al cierre.
rutasActas.get('/:id/verificar', autorizar(...PANEL), async (req, res, next) => {
  try {
    const acta = await db.acta.findUnique({ where: { id: req.params.id } })
    if (!acta) throw new ErrorHttp('ACTA_NO_ENCONTRADA', 404)
    if (acta.estado !== 'cerrada' || !acta.selloIntegridad) {
      throw new ErrorHttp('ACTA_NO_CERRADA', 409)
    }
    const recalculado = createHash('sha256')
      .update(`${acta.folio}|${acta.contenido}|${acta.cerradaPor}|${acta.fechaCierre.toISOString()}`)
      .digest('hex')
    res.json({ valido: recalculado === acta.selloIntegridad })
  } catch (err) {
    next(err)
  }
})

rutasActas.post('/:id/cerrar', autorizar(...GESTION), async (req, res, next) => {
  try {
    const acta = await db.acta.findUnique({ where: { id: req.params.id } })
    if (!acta) throw new ErrorHttp('ACTA_NO_ENCONTRADA', 404)
    if (acta.estado === 'cerrada') throw new ErrorHttp('ACTA_YA_CERRADA', 409)

    const fechaCierre = new Date()
    const sello = createHash('sha256')
      .update(`${acta.folio}|${acta.contenido}|${req.usuario.nombre}|${fechaCierre.toISOString()}`)
      .digest('hex')

    const cerrada = await db.$transaction(async (tx) => {
      const fila = await tx.acta.update({
        where: { id: acta.id },
        data: {
          estado: 'cerrada',
          cerradaPor: req.usuario.nombre,
          fechaCierre,
          selloIntegridad: sello,
        },
      })
      await auditar(
        req,
        {
          modulo: 'actas',
          accion: 'cierre',
          entidad: 'acta',
          entidadId: acta.id,
          entidadFolio: acta.folio,
          detalle: `Cierre del acta ${acta.folio} con sello de integridad.`,
        },
        tx,
      )
      return fila
    })

    res.json(cerrada)
  } catch (err) {
    next(err)
  }
})
