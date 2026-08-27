/**
 * Capa de servicio REAL del módulo de Integraciones (bloque C1):
 * - la especificación OpenAPI se lee del mismo archivo descargable
 *   (/openapi.yaml), así la página y el documento nunca divergen;
 * - "Probar" pasa por POST /api/integraciones/probar para que la API key
 *   de demostración nunca llegue al navegador (docs/14);
 * - Mercado Público consulta DATOS REALES vía el caché del servidor
 *   (docs/10: pausa de 16-20 s entre llamadas al servicio externo).
 */
import { load } from 'js-yaml'
import { ErrorApi, http } from '../../../services/http.js'

export class IntegracionError extends Error {
  constructor(code) {
    super(code)
    this.name = 'IntegracionError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new IntegracionError(error.codigo)
    throw error
  }
}

/** El yaml descargable, parseado. Se sirve estático junto al front. */
export async function obtenerEspecificacion() {
  const respuesta = await fetch('/openapi.yaml')
  if (!respuesta.ok) throw new IntegracionError('ESPECIFICACION_NO_DISPONIBLE')
  return load(await respuesta.text())
}

/** Ejecuta una llamada de prueba a /api/v1 desde el servidor. */
export function probarEndpoint({ metodo, ruta, cuerpo }) {
  return llamada(() => http('POST', '/api/integraciones/probar', { cuerpo: { metodo, ruta, cuerpo } }))
}

export function obtenerExportacionSigfe() {
  return llamada(() => http('GET', '/api/integraciones/sigfe'))
}

export function obtenerCuentasContables() {
  return llamada(() => http('GET', '/api/integraciones/cuentas-contables'))
}

export function guardarCuentasContables(cuentas) {
  return llamada(() => http('PUT', '/api/integraciones/cuentas-contables', { cuerpo: cuentas }))
}

// --- Mercado Público (datos reales, docs/10) ---------------------------

export function obtenerHistorialOrdenes() {
  return llamada(() => http('GET', '/api/mercadopublico/ordenes'))
}

/** Cache-first; si no está en caché consulta en vivo (puede tardar ~20 s). */
export function consultarOrdenCompra(codigo) {
  return llamada(() => http('GET', `/api/mercadopublico/ordenes/${encodeURIComponent(codigo)}`))
}

/** Fuerza una consulta en vivo aunque exista caché (puede tardar ~20 s). */
export function sincronizarOrdenCompra(codigo) {
  return llamada(() =>
    http('POST', `/api/mercadopublico/ordenes/${encodeURIComponent(codigo)}/sincronizar`),
  )
}

export function vincularOrdenCompra(activoId, codigo) {
  return llamada(() => http('POST', `/api/activos/${activoId}/vincular-oc`, { cuerpo: { codigo } }))
}
