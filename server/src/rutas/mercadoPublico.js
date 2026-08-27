/**
 * Órdenes de compra de Mercado Público (AD-02 — docs/10): consulta con
 * caché, sincronización forzada y el historial que alimenta la pantalla.
 */
import { Router } from 'express'
import { obtenerOrdenCompra, serializarOrden, sincronizarOrdenCompra } from '../dominio/mp.js'
import { db } from '../db.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasMercadoPublico = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

// Historial de OC consultadas (tabla de la pantalla, docs/10).
rutasMercadoPublico.get('/ordenes', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const filas = await db.ordenCompraMP.findMany({ orderBy: { sincronizadaEn: 'desc' } })
    res.json(filas.map(serializarOrden))
  } catch (err) {
    next(err)
  }
})

rutasMercadoPublico.get('/ordenes/:codigo', autorizar(...PANEL), async (req, res, next) => {
  try {
    res.json(await obtenerOrdenCompra(req.params.codigo.trim().toUpperCase()))
  } catch (err) {
    next(err)
  }
})

// Fuerza la consulta en vivo ("spinner honesto", docs/10).
rutasMercadoPublico.post('/ordenes/:codigo/sincronizar', autorizar(...GESTION), async (req, res, next) => {
  try {
    const orden = await sincronizarOrdenCompra(req.params.codigo.trim().toUpperCase())
    await auditar(req, {
      modulo: 'activos',
      accion: 'oc_sincronizada',
      detalle: `Orden de compra ${orden.codigo} sincronizada desde Mercado Público.`,
    })
    res.json(orden)
  } catch (err) {
    next(err)
  }
})
