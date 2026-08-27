/**
 * API pública /api/v1 (AD-01 — docs/10): REST, JSON, SOLO lectura salvo el
 * webhook de demostración. Autenticación por X-API-Key, paginación
 * `?pagina=&porPagina=` (máx. 100) y respuestas `{ datos, paginacion? }`.
 * La especificación completa vive en /openapi.yaml (descargable desde la
 * página de Integraciones y adjunta a la propuesta).
 */
import { Router } from 'express'
import { z } from 'zod'
import { calcularDepreciacion } from '../../../shared/depreciacion.js'
import { asientosDepreciacion, exportacionContable } from '../dominio/contabilidad.js'
import { serializarActivo } from '../dominio/serializar.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { exigirApiKey, limitadorV1 } from '../middleware/apiKey.js'

export const rutasV1 = Router()

rutasV1.use(limitadorV1, exigirApiKey)

const esquemaPaginacion = z.object({
  pagina: z.coerce.number().int().min(1).optional().default(1),
  porPagina: z.coerce.number().int().min(1).max(100).optional().default(100),
})

function paginar(consulta) {
  const { pagina, porPagina } = esquemaPaginacion.parse(consulta)
  return { pagina, porPagina, skip: (pagina - 1) * porPagina, take: porPagina }
}

const respuesta = (datos, paginacion) => ({ datos, ...(paginacion ? { paginacion } : {}) })

async function activoPorFolio(folio) {
  const activo = await db.activo.findUnique({ where: { folio }, include: { adjuntos: true } })
  if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)
  return activo
}

/** Adjuntos como METADATOS (docs/10): nunca el archivo por esta vía. */
function comoActivoV1(activo) {
  const { documentos, ...datos } = serializarActivo(activo)
  return {
    ...datos,
    adjuntos: (documentos ?? []).map(({ id, tipo, nombreOriginal, mime, tamano, latitud, longitud, fecha }) => ({
      id,
      tipo,
      nombreOriginal,
      mime,
      tamano,
      latitud,
      longitud,
      fecha,
    })),
  }
}

rutasV1.get('/activos', async (req, res, next) => {
  try {
    const { estado = '', categoria = '', ubicacion = '', desde = '', hasta = '' } = req.query
    const { pagina, porPagina, skip, take } = paginar(req.query)
    const where = {
      ...(estado ? { estado: String(estado) } : {}),
      ...(categoria ? { categoria: String(categoria) } : {}),
      ...(ubicacion ? { ubicacion: String(ubicacion) } : {}),
      ...(desde || hasta
        ? {
            fechaAlta: {
              ...(desde ? { gte: new Date(String(desde)) } : {}),
              ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
            },
          }
        : {}),
    }
    const [total, activos] = await Promise.all([
      db.activo.count({ where }),
      db.activo.findMany({ where, orderBy: { folio: 'asc' }, skip, take, include: { adjuntos: true } }),
    ])
    res.json(respuesta(activos.map(comoActivoV1), { pagina, porPagina, total }))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/activos/:folio', async (req, res, next) => {
  try {
    res.json(respuesta(comoActivoV1(await activoPorFolio(req.params.folio))))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/activos/:folio/depreciacion', async (req, res, next) => {
  try {
    const activo = await activoPorFolio(req.params.folio)
    const categoria = await db.categoria.findUnique({ where: { nombre: activo.categoria } })
    if (!categoria) throw new ErrorHttp('VIDA_UTIL_NO_CONFIGURADA', 409)

    const fechaCorte = req.query.fechaCorte
      ? new Date(String(req.query.fechaCorte))
      : activo.estado === 'dado_de_baja' && activo.fechaBaja
        ? activo.fechaBaja
        : undefined
    const r = calcularDepreciacion({
      valor: Number(activo.valor),
      fechaAlta: activo.fechaAlta,
      vidaUtilAnios: categoria.vidaUtilAnios,
      vidaUtilAcelerada: categoria.vidaUtilAcelerada ?? null,
      ...(fechaCorte ? { fechaCorte } : {}),
    })
    res.json(respuesta({ folio: activo.folio, vidaUtilAnios: categoria.vidaUtilAnios, ...r }))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/activos/:folio/movimientos', async (req, res, next) => {
  try {
    const activo = await activoPorFolio(req.params.folio)
    const movimientos = await db.movimientoActivo.findMany({
      where: { activoId: activo.id },
      orderBy: { fecha: 'desc' },
    })
    res.json(respuesta(movimientos))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/contabilidad/activos', async (req, res, next) => {
  try {
    const fechaCorte = req.query.fechaCorte ? new Date(String(req.query.fechaCorte)) : undefined
    res.json(respuesta(await exportacionContable(fechaCorte)))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/contabilidad/asientos', async (req, res, next) => {
  try {
    const { desde, hasta } = z
      .object({ desde: z.string().min(1), hasta: z.string().min(1) })
      .parse(req.query)
    res.json(respuesta(await asientosDepreciacion(new Date(desde), new Date(hasta))))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/almacen/items', async (req, res, next) => {
  try {
    const { pagina, porPagina, skip, take } = paginar(req.query)
    const [total, items] = await Promise.all([
      db.itemAlmacen.count(),
      db.itemAlmacen.findMany({ orderBy: { folio: 'asc' }, skip, take }),
    ])
    res.json(respuesta(items, { pagina, porPagina, total }))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/almacen/items/:folio/kardex', async (req, res, next) => {
  try {
    const item = await db.itemAlmacen.findUnique({ where: { folio: req.params.folio } })
    if (!item) throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404)
    const movimientos = await db.movimientoAlmacen.findMany({
      where: { itemId: item.id },
      orderBy: { fecha: 'asc' },
    })
    res.json(respuesta({ item, movimientos }))
  } catch (err) {
    next(err)
  }
})

rutasV1.get('/movimientos', async (req, res, next) => {
  try {
    const { desde = '', hasta = '' } = req.query
    const filtroFecha =
      desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(String(desde)) } : {}),
              ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
            },
          }
        : {}
    const [deActivos, deAlmacen] = await Promise.all([
      db.movimientoActivo.findMany({ where: filtroFecha, orderBy: { fecha: 'desc' }, take: 1000 }),
      db.movimientoAlmacen.findMany({ where: filtroFecha, orderBy: { fecha: 'desc' }, take: 1000 }),
    ])
    const datos = [
      ...deActivos.map((m) => ({ origen: 'activos', ...m })),
      ...deAlmacen.map((m) => ({ origen: 'almacen', ...m })),
    ].sort((a, b) => b.fecha - a.fecha)
    res.json(respuesta(datos))
  } catch (err) {
    next(err)
  }
})

// Único endpoint de escritura: webhook de demostración (docs/10). Escribe
// SOLO en Configuracion y demuestra la ida y vuelta sin tocar activos.
rutasV1.post('/webhooks/contabilidad', async (req, res, next) => {
  try {
    const cuerpo = z
      .object({
        referencia: z.string().min(1),
        fecha: z.string().min(1),
        asientos: z.array(z.object({}).loose()),
      })
      .parse(req.body)
    await db.configuracion.upsert({
      where: { clave: 'webhook_contabilidad_ultimo' },
      update: { valor: { ...cuerpo, recibidoEn: new Date().toISOString() } },
      create: { clave: 'webhook_contabilidad_ultimo', valor: { ...cuerpo, recibidoEn: new Date().toISOString() } },
    })
    res.status(202).json({ recibido: true, referencia: cuerpo.referencia })
  } catch (err) {
    next(err)
  }
})
