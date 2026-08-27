/** Mensajes en español para los códigos de error del servicio de almacén. */
const MENSAJES = {
  NOMBRE_REQUERIDO: 'El nombre del ítem es obligatorio.',
  ITEM_NO_ENCONTRADO: 'No fue posible encontrar el ítem. Intente nuevamente.',
  CANTIDAD_INVALIDA: 'Ingrese una cantidad válida, mayor a 0.',
  STOCK_INSUFICIENTE: 'No hay stock suficiente para este egreso.',
}

export function obtenerMensajeErrorAlmacen(codigo) {
  return MENSAJES[codigo] ?? 'Ocurrió un error inesperado. Intente nuevamente.'
}
