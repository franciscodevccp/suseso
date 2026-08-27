/**
 * Solicitudes de insumos (AD-03 — docs/11). El solicitante solo ve las
 * propias (filtro por sesión en el servidor); la bandeja es del panel.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class SolicitudError extends Error {
  constructor(code, mensaje) {
    super(mensaje || code)
    this.name = 'SolicitudError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new SolicitudError(error.codigo, error.message)
    throw error
  }
}

/** Catálogo del almacén para pedir (stock visible, sin datos del panel). */
export function obtenerCatalogo() {
  return llamada(() => http('GET', '/api/solicitudes/catalogo'))
}

export function crearSolicitud({ items, observacion }) {
  return llamada(() => http('POST', '/api/solicitudes', { cuerpo: { items, observacion } }))
}

export function obtenerMisSolicitudes() {
  return llamada(() => http('GET', '/api/solicitudes/mias'))
}

export function obtenerSolicitudes({ estado = '', itemId = '' } = {}) {
  const filtros = new URLSearchParams()
  if (estado) filtros.set('estado', estado)
  if (itemId) filtros.set('itemId', itemId)
  const consulta = filtros.toString()
  return llamada(() => http('GET', `/api/solicitudes${consulta ? `?${consulta}` : ''}`))
}

export function obtenerResumenSolicitudes() {
  return llamada(() => http('GET', '/api/solicitudes/resumen'))
}

export async function obtenerSolicitudPorId(id) {
  try {
    return await http('GET', `/api/solicitudes/${id}`)
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) return null
    if (error instanceof ErrorApi) throw new SolicitudError(error.codigo, error.message)
    throw error
  }
}

export function aprobarSolicitud(id, observacion = '') {
  return llamada(() => http('POST', `/api/solicitudes/${id}/aprobar`, { cuerpo: { observacion } }))
}

export function rechazarSolicitud(id, observacion) {
  return llamada(() => http('POST', `/api/solicitudes/${id}/rechazar`, { cuerpo: { observacion } }))
}

export function entregarSolicitud(id) {
  return llamada(() => http('POST', `/api/solicitudes/${id}/entregar`))
}
