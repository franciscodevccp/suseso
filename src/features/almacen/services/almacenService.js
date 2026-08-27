/**
 * Capa de servicio REAL del almacén: mismas funciones y formas que el mock
 * (docs/03). Los tres catálogos salen de UNA llamada cacheada a
 * /api/almacen/catalogos.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class AlmacenError extends Error {
  constructor(code) {
    super(code)
    this.name = 'AlmacenError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new AlmacenError(error.codigo)
    throw error
  }
}

let catalogosEnCurso = null
function obtenerCatalogos() {
  catalogosEnCurso ??= llamada(() => http('GET', '/api/almacen/catalogos')).catch((error) => {
    catalogosEnCurso = null
    throw error
  })
  return catalogosEnCurso
}

export function obtenerCategorias() {
  return obtenerCatalogos().then((c) => c.categorias)
}

export function obtenerUbicaciones() {
  return obtenerCatalogos().then((c) => c.ubicaciones)
}

export function obtenerUnidades() {
  return obtenerCatalogos().then((c) => c.unidades)
}

export function obtenerItems() {
  return llamada(() => http('GET', '/api/almacen/items'))
}

export async function obtenerItemPorId(id) {
  // El mock devolvía null cuando no existía; se conserva ese contrato.
  try {
    return await http('GET', `/api/almacen/items/${id}`)
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) return null
    if (error instanceof ErrorApi) throw new AlmacenError(error.codigo)
    throw error
  }
}

export function obtenerMovimientosPorItem(id) {
  return llamada(() => http('GET', `/api/almacen/items/${id}/movimientos`))
}

export function obtenerTodosLosMovimientos() {
  return llamada(() => http('GET', '/api/almacen/movimientos'))
}

// `usuario` sale de la sesión en el servidor; la firma del mock se conserva.
export function crearItem({ datos }) {
  return llamada(() => http('POST', '/api/almacen/items', { cuerpo: datos }))
}

export function registrarMovimiento(itemId, { tipo, cantidad, motivo }) {
  return llamada(() =>
    http('POST', `/api/almacen/items/${itemId}/movimientos`, { cuerpo: { tipo, cantidad, motivo } }),
  )
}
