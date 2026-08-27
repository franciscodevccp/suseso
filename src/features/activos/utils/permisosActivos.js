/**
 * Roles que pueden crear, editar, dar de baja o trasladar activos. El resto
 * (ej. Consulta) solo puede ver el listado y la ficha.
 */
const ROLES_CON_GESTION = ['Administrador', 'Gestor de Activos']

export function puedeGestionarActivos(usuario) {
  return ROLES_CON_GESTION.includes(usuario?.rol)
}
