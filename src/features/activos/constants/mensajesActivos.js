/** Mensajes en español para los códigos de error del servicio de activos. */
const MENSAJES = {
  NOMBRE_REQUERIDO: 'El nombre del activo es obligatorio.',
  ACTIVO_NO_ENCONTRADO: 'No fue posible encontrar el activo. Intente nuevamente.',
  ACTIVO_DADO_DE_BAJA: 'Este activo está dado de baja y no admite esta acción.',
}

export function obtenerMensajeErrorActivo(codigo) {
  return MENSAJES[codigo] ?? 'Ocurrió un error inesperado. Intente nuevamente.'
}
