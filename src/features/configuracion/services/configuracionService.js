/** Acciones de configuración del sistema. */
import { http } from '../../../services/http.js'

/** Restaura los datos de demostración (docs/13, docs/14): solo Administrador. */
export function reiniciarDemo() {
  return http('POST', '/api/configuracion/reiniciar-demo')
}
