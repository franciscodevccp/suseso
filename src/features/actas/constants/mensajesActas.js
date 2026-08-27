/** Mensajes en español para los códigos de error de actasService.mock.js. */
const MENSAJES = {
  RESPONSABLE_REQUERIDO: 'El responsable es obligatorio.',
  CONTENIDO_REQUERIDO: 'Describa el contenido del acta.',
  ACTA_NO_ENCONTRADA: 'No fue posible encontrar el acta. Intente nuevamente.',
  ACTA_YA_FIRMADA: 'Esta acta ya fue firmada.',
}

export function obtenerMensajeErrorActa(codigo) {
  return MENSAJES[codigo] ?? 'Ocurrió un error inesperado. Intente nuevamente.'
}
