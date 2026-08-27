/** Etiquetas visibles de los tipos y severidades de alerta (docs/07). */
export const TIPOS_ALERTA = [
  { valor: 'garantia_por_vencer', etiqueta: 'Garantía por vencer' },
  { valor: 'garantia_vencida', etiqueta: 'Garantía vencida' },
  { valor: 'mantencion_proxima', etiqueta: 'Mantención próxima' },
  { valor: 'mantencion_atrasada', etiqueta: 'Mantención atrasada' },
  { valor: 'stock_bajo_minimo', etiqueta: 'Stock bajo el mínimo' },
  { valor: 'sin_stock', etiqueta: 'Sin stock' },
  { valor: 'solicitud_pendiente', etiqueta: 'Solicitud pendiente' },
]

export const SEVERIDADES = [
  { valor: 'alta', etiqueta: 'Alta', tono: 'error' },
  { valor: 'media', etiqueta: 'Media', tono: 'advertencia' },
]

export function etiquetaTipo(valor) {
  return TIPOS_ALERTA.find((tipo) => tipo.valor === valor)?.etiqueta ?? valor
}

export function infoSeveridad(valor) {
  return SEVERIDADES.find((s) => s.valor === valor) ?? { etiqueta: valor, tono: 'neutro' }
}
