export function puedeEditarVidaUtil(usuario) {
  return usuario?.rol === 'Administrador'
}
