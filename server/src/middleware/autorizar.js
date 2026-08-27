/**
 * Autorización por rol EN EL SERVIDOR (docs/04, docs/14): la UI esconde,
 * el servidor niega. Se usa con los nombres visibles de rol, los mismos
 * de la matriz de permisos: autorizar('Administrador', 'Gestor de Activos').
 * Sin argumentos: basta cualquier sesión válida.
 */
import { ErrorHttp } from '../http/errores.js'

export function autorizar(...roles) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(new ErrorHttp('NO_AUTENTICADO', 401, 'Debe iniciar sesión.'))
    }
    if (roles.length > 0 && !roles.includes(req.usuario.rol)) {
      return next(new ErrorHttp('NO_AUTORIZADO', 403, 'No tiene permiso para esta acción.'))
    }
    next()
  }
}
