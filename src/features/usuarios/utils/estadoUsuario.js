/** Mapeo estado de usuario -> { etiqueta, tono } para BadgeEstado. */
const ESTADOS = {
  activo: { etiqueta: 'Activo', tono: 'exito' },
  inactivo: { etiqueta: 'Inactivo', tono: 'neutro' },
  bloqueado: { etiqueta: 'Bloqueado', tono: 'error' },
}

export function obtenerInfoEstadoUsuario(estado) {
  return ESTADOS[estado] ?? { etiqueta: estado, tono: 'neutro' }
}
