/**
 * Roles que pueden crear y firmar actas. El resto (ej. Consulta) solo
 * puede ver el listado y la ficha. Archivo propio de esta feature (no
 * compartido con permisosActivos.js): aunque hoy la lista coincide,
 * podrían divergir más adelante.
 */
const ROLES_CON_GESTION = ['Administrador', 'Gestor de Activos']

export function puedeGestionarActas(usuario) {
  return ROLES_CON_GESTION.includes(usuario?.rol)
}
