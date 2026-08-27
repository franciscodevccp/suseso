/**
 * Estados de firma de un acta y cómo se representan (etiqueta + tono),
 * mismo patrón que estadoActivo.js. Fuente única para el badge de la
 * tabla y de la ficha.
 */
export const ESTADOS_FIRMA = [
  { valor: 'pendiente', etiqueta: 'Pendiente', tono: 'advertencia' },
  { valor: 'firmada', etiqueta: 'Firmada', tono: 'exito' },
]

export function obtenerInfoEstadoFirma(valor) {
  return ESTADOS_FIRMA.find((estado) => estado.valor === valor) ?? ESTADOS_FIRMA[0]
}
