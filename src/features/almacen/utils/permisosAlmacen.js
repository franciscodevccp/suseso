/** Gestión de almacén: delegado en el permisos.js central (docs/04, D-11). */
import { puedeGestionar } from '../../auth/utils/permisos'

export function puedeGestionarAlmacen(usuario) {
  return puedeGestionar(usuario)
}
