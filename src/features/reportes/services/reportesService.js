/**
 * Capa de servicio REAL de reportes (docs/03): los tres generadores piden
 * al servidor la forma { columnas, filas } ya formateada; la exportación
 * PDF/Excel/CSV sigue en el navegador con los utilitarios existentes.
 */
import { http } from '../../../services/http.js'

function consulta(filtros) {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(clave, valor)
  }
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export function generarReporteInventario({ categoria = '', ubicacion = '', estado = '' } = {}) {
  return http('GET', `/api/reportes/inventario${consulta({ categoria, ubicacion, estado })}`)
}

export function generarReporteDepreciacion() {
  return http('GET', '/api/reportes/depreciacion')
}

export function generarReporteMovimientos({ desde = '', hasta = '' } = {}) {
  return http('GET', `/api/reportes/movimientos${consulta({ desde, hasta })}`)
}
