/** Catálogos de activos (docs/03): categorías y ubicaciones como [{id, nombre}]. */
import { Router } from 'express'
import { db } from '../db.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasCatalogos = Router()

rutasCatalogos.get('/categorias', autorizar(), async (_req, res, next) => {
  try {
    const filas = await db.categoria.findMany({ orderBy: { nombre: 'asc' } })
    res.json(filas.map(({ id, nombre }) => ({ id, nombre })))
  } catch (err) {
    next(err)
  }
})

rutasCatalogos.get('/ubicaciones', autorizar(), async (_req, res, next) => {
  try {
    const filas = await db.ubicacion.findMany({ orderBy: { nombre: 'asc' } })
    res.json(filas.map(({ id, nombre }) => ({ id, nombre })))
  } catch (err) {
    next(err)
  }
})

// Responsables (RQ-13): catálogo de funcionarios + responsables ya usados
// en activos, para el filtro del listado.
rutasCatalogos.get('/funcionarios', autorizar(), async (_req, res, next) => {
  try {
    const [funcionarios, usados] = await Promise.all([
      db.funcionario.findMany({ orderBy: { nombre: 'asc' } }),
      db.activo.findMany({
        where: { responsable: { not: '' } },
        select: { responsable: true },
        distinct: ['responsable'],
      }),
    ])
    const nombres = new Map(funcionarios.map((f) => [f.nombre, f.id]))
    for (const { responsable } of usados) {
      if (!nombres.has(responsable)) nombres.set(responsable, `resp-${nombres.size + 1}`)
    }
    res.json(
      [...nombres.entries()]
        .map(([nombre, id]) => ({ id, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    )
  } catch (err) {
    next(err)
  }
})
