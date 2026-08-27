/**
 * Capa de servicio del módulo Usuarios (docs/04, RQ-06/07, DEMO-07).
 * Solo el Administrador llega aquí; el servidor lo vuelve a exigir.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class UsuarioError extends Error {
  constructor(code) {
    super(code)
    this.name = 'UsuarioError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new UsuarioError(error.codigo)
    throw error
  }
}

export function obtenerUsuarios() {
  return llamada(() => http('GET', '/api/usuarios'))
}

/** Devuelve { usuario, claveTemporal }: la clave se muestra UNA sola vez. */
export function crearUsuario({ nombre, email, rol }) {
  return llamada(() => http('POST', '/api/usuarios', { cuerpo: { nombre, email, rol } }))
}

export function actualizarUsuario(id, { nombre, rol }) {
  return llamada(() => http('PUT', `/api/usuarios/${id}`, { cuerpo: { nombre, rol } }))
}

export function activarUsuario(id) {
  return llamada(() => http('POST', `/api/usuarios/${id}/activar`))
}

export function desactivarUsuario(id) {
  return llamada(() => http('POST', `/api/usuarios/${id}/desactivar`))
}

export function desbloquearUsuario(id) {
  return llamada(() => http('POST', `/api/usuarios/${id}/desbloquear`))
}

/** Devuelve { usuario, claveTemporal }: la nueva clave se muestra UNA sola vez. */
export function restablecerClaveUsuario(id) {
  return llamada(() => http('POST', `/api/usuarios/${id}/restablecer-clave`))
}
