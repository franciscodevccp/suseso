/** Editar la tabla de vida útil: solo Administrador (docs/04, D-10). */
import { esAdministrador } from '../../auth/utils/permisos'

export function puedeEditarVidaUtil(usuario) {
  return esAdministrador(usuario)
}
