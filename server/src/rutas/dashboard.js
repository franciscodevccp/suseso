/**
 * Panel de control con agregaciones reales (docs/07, RQ-16). Los KPI y
 * gráficos excluyen los activos dados de baja (composición vigente del
 * inventario); el valor libro usa la MISMA función de depreciación
 * compartida que la ficha y los reportes (shared/depreciacion.js).
 */
import { Router } from 'express'
import { calcularDepreciacion } from '../../../shared/depreciacion.js'
import { calcularAlertas } from '../dominio/alertas.js'
import { db } from '../db.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasDashboard = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

const ETIQUETA_ESTADO = {
  activo: 'Activo',
  en_reparacion: 'En reparación',
  dado_de_baja: 'Dado de baja',
  extraviado: 'Extraviado',
}

rutasDashboard.get('/resumen', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const [activos, categorias, items, alertas, solicitudesPendientes] = await Promise.all([
      db.activo.findMany({ where: { estado: { not: 'dado_de_baja' } } }),
      db.categoria.findMany(),
      db.itemAlmacen.findMany(),
      calcularAlertas(),
      db.solicitud.count({ where: { estado: 'pendiente' } }),
    ])

    const vidaUtil = new Map(categorias.map((c) => [c.nombre, c.vidaUtilAnios]))
    let valorTotalInventariado = 0
    let valorLibroTotal = 0
    for (const activo of activos) {
      const valor = Number(activo.valor)
      valorTotalInventariado += valor
      const anios = vidaUtil.get(activo.categoria)
      valorLibroTotal += anios
        ? calcularDepreciacion({ valor, fechaAlta: activo.fechaAlta, vidaUtilAnios: anios }).valorLibro
        : valor
    }

    res.json({
      totalActivos: activos.length,
      valorTotalInventariado,
      valorLibroTotal,
      alertasVigentes: alertas.length,
      itemsBajoStockMinimo: items.filter((i) => i.stock <= i.stockMinimo).length,
      solicitudesPendientes,
    })
  } catch (err) {
    next(err)
  }
})

rutasDashboard.get('/por-estado', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const grupos = await db.activo.groupBy({ by: ['estado'], _count: { _all: true } })
    res.json(
      grupos
        .map((g) => ({
          estado: g.estado,
          etiqueta: ETIQUETA_ESTADO[g.estado] ?? g.estado,
          cantidad: g._count._all,
        }))
        .sort((a, b) => b.cantidad - a.cantidad),
    )
  } catch (err) {
    next(err)
  }
})

rutasDashboard.get('/por-categoria', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const grupos = await db.activo.groupBy({
      by: ['categoria'],
      where: { estado: { not: 'dado_de_baja' } },
      _count: { _all: true },
      _sum: { valor: true },
    })
    res.json(
      grupos
        .map((g) => ({
          categoria: g.categoria,
          cantidad: g._count._all,
          valor: Number(g._sum.valor ?? 0),
        }))
        .sort((a, b) => b.cantidad - a.cantidad),
    )
  } catch (err) {
    next(err)
  }
})

rutasDashboard.get('/actividad', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const [movActivos, movAlmacen, activos, items] = await Promise.all([
      db.movimientoActivo.findMany({ orderBy: { fecha: 'desc' }, take: 10 }),
      db.movimientoAlmacen.findMany({ orderBy: { fecha: 'desc' }, take: 10 }),
      db.activo.findMany({ select: { id: true, folio: true } }),
      db.itemAlmacen.findMany({ select: { id: true, folio: true } }),
    ])
    const folioActivo = new Map(activos.map((a) => [a.id, a.folio]))
    const folioItem = new Map(items.map((i) => [i.id, i.folio]))

    const unificados = [
      ...movActivos.map((m) => ({
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        detalle: `${folioActivo.get(m.activoId) ?? ''} — ${m.detalle}`.replace(/^ — /, ''),
        usuario: m.usuario,
        enlace: `/activos-fijos/${m.activoId}`,
      })),
      ...movAlmacen.map((m) => ({
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        detalle: `${folioItem.get(m.itemId) ?? ''} — ${m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de ${m.cantidad}${m.motivo ? ` (${m.motivo})` : ''}`,
        usuario: m.usuario,
        enlace: `/almacen/${m.itemId}`,
      })),
    ]
      .sort((a, b) => b.fecha - a.fecha)
      .slice(0, 10)

    res.json(unificados)
  } catch (err) {
    next(err)
  }
})
