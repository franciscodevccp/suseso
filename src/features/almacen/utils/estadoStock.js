/**
 * Estado del stock de un ítem, derivado (no es un campo persistido) a
 * partir de `stock` y `stockMinimo`. Misma forma { etiqueta, tono } que
 * estadoActivo.js, para reutilizar BadgeEstado tal cual.
 */
export function obtenerInfoStock(item) {
  if (item.stock <= 0) {
    return { etiqueta: 'Sin stock', tono: 'error' }
  }
  if (item.stock < item.stockMinimo) {
    return { etiqueta: 'Bajo mínimo', tono: 'advertencia' }
  }
  return { etiqueta: 'Normal', tono: 'exito' }
}
