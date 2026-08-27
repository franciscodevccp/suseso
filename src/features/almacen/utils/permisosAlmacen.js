const ROLES_CON_GESTION = ['Administrador', 'Gestor de Activos']

export function puedeGestionarAlmacen(usuario) {
  return ROLES_CON_GESTION.includes(usuario?.rol)
}
