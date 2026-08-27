/**
 * Capa de servicio REAL del panel de control (docs/03, docs/07): mismas
 * cuatro funciones que el mock, ahora con agregaciones de la BD.
 */
import { http } from '../../../services/http.js'

const formatearFechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

export function obtenerResumenIndicadores() {
  return http('GET', '/api/dashboard/resumen')
}

export function obtenerDistribucionPorEstado() {
  return http('GET', '/api/dashboard/por-estado')
}

export function obtenerActivosPorCategoria() {
  return http('GET', '/api/dashboard/por-categoria')
}

/** Últimos movimientos en la forma { id, descripcion, fecha } que pinta RecentActivity. */
export async function obtenerActividadReciente() {
  const movimientos = await http('GET', '/api/dashboard/actividad')
  return movimientos.map((m) => ({
    id: m.id,
    descripcion: `${m.detalle} · ${m.usuario}`,
    fecha: formatearFechaHora(m.fecha),
  }))
}
