/**
 * Diccionario de mensajes del sistema en español (voz institucional),
 * mapeados desde los códigos de error que devuelve la capa de servicio.
 * Mantener aquí el copy separa "qué reglas se rompieron" (mock) de
 * "cómo se le comunica al usuario" (vista).
 */
export const MENSAJES_ERROR = {
  CREDENCIALES_INVALIDAS:
    'El correo electrónico o la contraseña ingresados no son válidos. Verifique e intente nuevamente.',
  CUENTA_BLOQUEADA:
    'Su cuenta ha sido bloqueada tras 5 intentos fallidos. Recupere su contraseña para continuar.',
  CUENTA_INACTIVA:
    'Su cuenta se encuentra inactiva. Contacte al administrador del sistema para reactivarla.',
  TOKEN_INVALIDO:
    'El enlace de restablecimiento no es válido. Solicite uno nuevo.',
  TOKEN_EXPIRADO:
    'El enlace de restablecimiento ha expirado. Solicite uno nuevo.',
  CLAVE_NO_CUMPLE_REQUISITOS:
    'La nueva contraseña no cumple con los requisitos mínimos de seguridad.',
  CLAVE_ACTUAL_INCORRECTA:
    'La contraseña actual ingresada es incorrecta.',
  CLAVE_IGUAL_A_ACTUAL:
    'La nueva contraseña debe ser distinta a la contraseña actual.',
  USUARIO_NO_ENCONTRADO:
    'No fue posible completar la solicitud. Intente nuevamente más tarde.',
  SESION_NO_ENCONTRADA:
    'No hay una sesión activa. Inicie sesión para continuar.',
  ERROR_DESCONOCIDO:
    'Ocurrió un error inesperado. Intente nuevamente más tarde.',
}

export function obtenerMensajeError(codigo) {
  return MENSAJES_ERROR[codigo] ?? MENSAJES_ERROR.ERROR_DESCONOCIDO
}
