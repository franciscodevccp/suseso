/**
 * Ruta de aterrizaje por defecto según el rol del usuario. El rol
 * Funcionario no tiene acceso al panel administrativo (ver
 * RutaAdministrativa.jsx), así que su "inicio" es el portal de
 * autoconsulta.
 */
export function obtenerRutaInicio(usuario) {
  return usuario?.rol === 'Funcionario' ? '/autoconsulta' : '/inicio'
}
