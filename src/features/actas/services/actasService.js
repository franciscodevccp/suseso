/**
 * Capa de servicio de actas (docs/03, docs/13): desde el renombre D-03 la
 * UI usa el mismo vocabulario que el servidor (estado, cerradaPor,
 * fechaCierre, selloIntegridad), sin traducciones intermedias.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class ActaError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ActaError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new ActaError(error.codigo)
    throw error
  }
}

export function obtenerActas() {
  return llamada(() => http('GET', '/api/actas'))
}

export async function obtenerActaPorId(id) {
  // Devuelve null cuando no existe (contrato histórico de la ficha).
  try {
    return await http('GET', `/api/actas/${id}`)
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) return null
    if (error instanceof ErrorApi) throw new ActaError(error.codigo)
    throw error
  }
}

export function crearActa(datos) {
  return llamada(() => http('POST', '/api/actas', { cuerpo: datos }))
}

/** Cierra el acta: el servidor calcula el sello con el usuario de la sesión. */
export function cerrarActa(id) {
  return llamada(() => http('POST', `/api/actas/${id}/cerrar`))
}

/** Recalcula el sello en el servidor y lo compara con el guardado. */
export function verificarIntegridad(id) {
  return llamada(() => http('GET', `/api/actas/${id}/verificar`))
}
