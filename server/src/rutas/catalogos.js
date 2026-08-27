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
