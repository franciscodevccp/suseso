/**
 * Estados de un acta y cómo se representan (etiqueta + tono), mismo
 * patrón que estadoActivo.js. Fuente única para el badge de la tabla y
 * de la ficha.
 */
export const ESTADOS_ACTA = [
  { valor: 'pendiente', etiqueta: 'Pendiente', tono: 'advertencia' },
  { valor: 'cerrada', etiqueta: 'Cerrada', tono: 'exito' },
]

export function obtenerInfoEstadoActa(valor) {
  return ESTADOS_ACTA.find((estado) => estado.valor === valor) ?? ESTADOS_ACTA[0]
}
