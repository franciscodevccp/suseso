/**
 * Mapeo entre el enum Rol de la BD y el texto visible que la UI ya usa
 * en permisos y pantallas (docs/03: el usuario viaja con rol visible).
 */
export const ROL_VISIBLE = {
  ADMINISTRADOR: 'Administrador',
  GESTOR: 'Gestor de Activos',
  CONSULTA: 'Consulta',
  FUNCIONARIO: 'Funcionario',
}

export const ROL_ENUM = Object.fromEntries(
  Object.entries(ROL_VISIBLE).map(([enumBd, visible]) => [visible, enumBd]),
)

/** Forma pública del usuario: la misma que devolvía el mock (sin clave). */
export function usuarioPublico(usuario) {
  const { id, nombre, email, rol, estado, claveTemporal, fechaUltimoCambioClave } = usuario
  return { id, nombre, email, rol: ROL_VISIBLE[rol], estado, claveTemporal, fechaUltimoCambioClave }
}
