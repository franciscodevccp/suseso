/**
 * Capa de servicio REAL del módulo de acceso: mismas funciones, parámetros
 * y formas que el mock que reemplaza (docs/03). Los errores llegan como
 * AuthError con el mismo `code` que la UI ya mapea en mensajes.js.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class AuthError extends Error {
  constructor(code) {
    super(code)
    this.name = 'AuthError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new AuthError(error.codigo)
    throw error
  }
}

export function login({ email, password }) {
  return llamada(() => http('POST', '/api/auth/login', { cuerpo: { email, password } }))
}

/**
 * Tarjetas del login (docs/13). Devuelve null si el servidor las tiene
 * apagadas (MOSTRAR_CUENTAS_DEMO=false): el login simplemente no las pinta.
 */
export async function obtenerCuentasDemo() {
  try {
    return await http('GET', '/api/auth/cuentas-demo')
  } catch {
    return null
  }
}

export function obtenerSesionActual() {
  return llamada(() => http('GET', '/api/auth/sesion'))
}

export async function cerrarSesion() {
  await llamada(() => http('POST', '/api/auth/salir'))
  return { ok: true }
}

export function solicitarRecuperacion({ email }) {
  return llamada(() => http('POST', '/api/auth/recuperar', { cuerpo: { email } }))
}

export function restablecerClave({ token, nuevaClave }) {
  return llamada(() => http('POST', '/api/auth/restablecer', { cuerpo: { token, nuevaClave } }))
}

// El usuarioId del contrato del mock se conserva en la firma pero ya no
// viaja: el servidor usa la sesión (docs/03).
export function cambiarClaveObligatoria({ nuevaClave }) {
  return llamada(() =>
    http('POST', '/api/auth/cambiar-clave-obligatoria', { cuerpo: { nuevaClave } }),
  )
}

export function cambiarMiClave({ claveActual, nuevaClave }) {
  return llamada(() =>
    http('POST', '/api/auth/cambiar-mi-clave', { cuerpo: { claveActual, nuevaClave } }),
  )
}
