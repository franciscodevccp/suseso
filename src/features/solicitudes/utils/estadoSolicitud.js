/** Mapeo estado → { etiqueta, tono } para BadgeEstado (docs/11). */
const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', tono: 'advertencia' },
  aprobada: { etiqueta: 'Aprobada', tono: 'exito' },
  rechazada: { etiqueta: 'Rechazada', tono: 'error' },
  entregada: { etiqueta: 'Entregada', tono: 'neutro' },
}

export function obtenerInfoEstadoSolicitud(estado) {
  return ESTADOS[estado] ?? { etiqueta: estado, tono: 'neutro' }
}
