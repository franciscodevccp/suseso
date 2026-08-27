/** Formato de moneda CLP compartido por todo el sistema (sin decimales). */
export function formatearMoneda(valor) {
  return (valor ?? 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}
