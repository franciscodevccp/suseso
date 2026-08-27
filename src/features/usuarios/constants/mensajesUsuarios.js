/** Mensajes en español para los códigos de error del servicio de usuarios. */
const MENSAJES = {
  CORREO_EN_USO: 'Ya existe un usuario con ese correo.',
  CUENTA_DEMO: 'Las cuentas de demostración no se pueden modificar.',
  ULTIMO_ADMINISTRADOR: 'No es posible: quedaría el sistema sin un Administrador activo.',
  USUARIO_NO_ENCONTRADO: 'No fue posible encontrar el usuario. Intente nuevamente.',
  VALIDACION: 'Revise los datos ingresados e intente nuevamente.',
}

export function obtenerMensajeErrorUsuario(codigo) {
  return MENSAJES[codigo] ?? 'Ocurrió un error inesperado. Intente nuevamente.'
}
