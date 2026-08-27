/**
 * Roles que pueden crear y cerrar actas. El resto (ej. Consulta) solo
 * puede ver el listado y la ficha. Delegado en el permisos.js central
 * (docs/04).
 */
import { puedeGestionar } from '../../auth/utils/permisos'

export function puedeGestionarActas(usuario) {
  return puedeGestionar(usuario)
}
