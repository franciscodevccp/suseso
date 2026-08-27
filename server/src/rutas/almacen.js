/**
 * Almacén (docs/03 §Almacén). Contrato del mock: mismos códigos
 * (NOMBRE_REQUERIDO, ITEM_NO_ENCONTRADO, CANTIDAD_INVALIDA,
 * STOCK_INSUFICIENTE). El egreso es atómico: el decremento condicionado
 * a `stock >= cantidad` garantiza que nunca queda stock negativo aunque
 * lleguen dos egresos a la vez (docs/15).
 */
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { siguienteFolio } from '../dominio/folios.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasAlmacen = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

// Ids estables con el mismo patrón de ids que usaba el mock (cat-001…).
function comoCatalogo(nombres, prefijo) {
  return nombres.map((nombre, i) => ({ id: `${prefijo}-${String(i + 1).padStart(3, '0')}`, nombre }))
}

rutasAlmacen.get('/catalogos', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const fila = await db.configuracion.findUnique({ where: { clave: 'almacen_catalogos' } })
    const { categorias = [], ubicaciones = [], unidades = [] } = fila?.valor ?? {}
    res.json({
      categorias: comoCatalogo(categorias, 'cat'),
      ubicaciones: comoCatalogo(ubicaciones, 'ubi'),
      unidades: comoCatalogo(unidades, 'uni'),
    })
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.get('/items', autorizar(...PANEL), async (_req, res, next) => {
  try {
    res.json(await db.itemAlmacen.findMany({ orderBy: { folio: 'asc' } }))
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.get('/movimientos', autorizar(...PANEL), async (_req, res, next) => {
  try {
    res.json(await db.movimientoAlmacen.findMany({ orderBy: { fecha: 'desc' }, take: 5000 }))
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.get('/items/:id', autorizar(...PANEL), async (req, res, next) => {
  try {
    const item = await db.itemAlmacen.findUnique({ where: { id: req.params.id } })
    if (!item) throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404)
    res.json(item)
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.get('/items/:id/movimientos', autorizar(...PANEL), async (req, res, next) => {
  try {
    const movimientos = await db.movimientoAlmacen.findMany({
      where: { itemId: req.params.id },
      orderBy: { fecha: 'desc' },
    })
    res.json(movimientos)
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.post('/items', autorizar(...GESTION), async (req, res, next) => {
  try {
    const datos = z
      .object({
        nombre: z.string().default(''),
        categoria: z.string().min(1),
        unidad: z.string().min(1),
        stock: z.coerce.number().int().min(0).optional().default(0),
        stockMinimo: z.coerce.number().int().min(0).optional().default(0),
        ubicacion: z.string().min(1),
      })
      .parse(req.body)
    if (!datos.nombre?.trim()) throw new ErrorHttp('NOMBRE_REQUERIDO', 400)

    const creado = await db.$transaction(async (tx) => {
      const folio = await siguienteFolio(tx, 'BOD')
      const item = await tx.itemAlmacen.create({
        data: { ...datos, nombre: datos.nombre.trim(), folio },
      })
      // Igual que el mock: el stock inicial queda trazado como ingreso.
      if (item.stock > 0) {
        await tx.movimientoAlmacen.create({
          data: {
            itemId: item.id,
            tipo: 'ingreso',
            cantidad: item.stock,
            stockResultante: item.stock,
            motivo: 'Stock inicial al crear el ítem',
            usuario: req.usuario.nombre,
          },
        })
      }
      await auditar(
        req,
        {
          modulo: 'almacen',
          accion: 'alta_item',
          entidad: 'itemAlmacen',
          entidadId: item.id,
          entidadFolio: item.folio,
          detalle: `Alta del ítem "${item.nombre}" (${item.folio}) con stock inicial ${item.stock}.`,
        },
        tx,
      )
      return item
    })

    res.status(201).json(creado)
  } catch (err) {
    next(err)
  }
})

rutasAlmacen.post('/items/:id/movimientos', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { tipo, cantidad, motivo } = z
      .object({
        tipo: z.enum(['ingreso', 'egreso']),
        cantidad: z.coerce.number(),
        motivo: z.string().optional().default(''),
      })
      .parse(req.body)

    if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ErrorHttp('CANTIDAD_INVALIDA', 400)
    }

    const item = await db.$transaction(async (tx) => {
      const ajuste = await tx.itemAlmacen.updateMany({
        where: {
          id: req.params.id,
          ...(tipo === 'egreso' ? { stock: { gte: cantidad } } : {}),
        },
        data: { stock: tipo === 'ingreso' ? { increment: cantidad } : { decrement: cantidad } },
      })
      if (ajuste.count === 0) {
        const existe = await tx.itemAlmacen.findUnique({ where: { id: req.params.id } })
        throw new ErrorHttp(existe ? 'STOCK_INSUFICIENTE' : 'ITEM_NO_ENCONTRADO', existe ? 409 : 404)
      }
      const fila = await tx.itemAlmacen.findUnique({ where: { id: req.params.id } })
      await tx.movimientoAlmacen.create({
        data: {
          itemId: fila.id,
          tipo,
          cantidad,
          stockResultante: fila.stock,
          motivo: motivo?.trim() || '',
          usuario: req.usuario.nombre,
        },
      })
      await auditar(
        req,
        {
          modulo: 'almacen',
          accion: tipo,
          entidad: 'itemAlmacen',
          entidadId: fila.id,
          entidadFolio: fila.folio,
          detalle: `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de ${cantidad} en "${fila.nombre}" (${fila.folio}); stock resultante ${fila.stock}.`,
        },
        tx,
      )
      return fila
    })

    res.json(item)
  } catch (err) {
    next(err)
  }
})
