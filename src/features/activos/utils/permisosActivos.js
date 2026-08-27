/**
 * Roles que pueden crear, editar, dar de baja o trasladar activos. El
 * resto (ej. Consulta) solo puede ver el listado y la ficha. Delegado en
 * el permisos.js central (docs/04).
 */
import { puedeGestionar } from '../../auth/utils/permisos'

export function puedeGestionarActivos(usuario) {
  return puedeGestionar(usuario)
}
