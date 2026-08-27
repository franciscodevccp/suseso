/** Alertas vigentes (RQ-17, docs/07): calculadas a demanda por el servidor. */
import { http } from '../../../services/http.js'

export function obtenerAlertas() {
  return http('GET', '/api/alertas')
}

/** Total y desglose por tipo; lo consume el badge del Sidebar cada 60 s. */
export function obtenerResumenAlertas() {
  return http('GET', '/api/alertas/resumen')
}
