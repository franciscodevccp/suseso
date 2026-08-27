/**
 * Capa de servicio REAL de activos fijos: mismas funciones y formas que el
 * mock que reemplaza (docs/03). Errores como ActivoError con el mismo `code`.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class ActivoError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ActivoError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new ActivoError(error.codigo)
    throw error
  }
}

export function obtenerCategorias() {
  return llamada(() => http('GET', '/api/catalogos/categorias'))
}

export function obtenerUbicaciones() {
  return llamada(() => http('GET', '/api/catalogos/ubicaciones'))
}

export function buscarActivos({ texto = '', categoria = '', ubicacion = '', estado = '', responsable = '' } = {}) {
  const filtros = new URLSearchParams()
  if (texto.trim()) filtros.set('texto', texto.trim())
  if (categoria) filtros.set('categoria', categoria)
  if (ubicacion) filtros.set('ubicacion', ubicacion)
  if (estado) filtros.set('estado', estado)
  if (responsable) filtros.set('responsable', responsable)
  const consulta = filtros.toString()
  return llamada(() => http('GET', `/api/activos${consulta ? `?${consulta}` : ''}`))
}

export async function obtenerActivoPorId(id) {
  // El mock devolvía null cuando no existía; se conserva ese contrato.
  try {
    return await http('GET', `/api/activos/${id}`)
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) return null
    if (error instanceof ErrorApi) throw new ActivoError(error.codigo)
    throw error
  }
}

export function obtenerMovimientosPorActivo(id) {
  return llamada(() => http('GET', `/api/activos/${id}/movimientos`))
}

export function obtenerTodosLosMovimientos() {
  return llamada(() => http('GET', '/api/activos/movimientos'))
}

// `usuario` sale de la sesión en el servidor; la firma del mock se conserva.
export function crearActivo({ datos }) {
  return llamada(() => http('POST', '/api/activos', { cuerpo: datos }))
}

export function actualizarActivo({ id, datos }) {
  return llamada(() => http('PUT', `/api/activos/${id}`, { cuerpo: datos }))
}

export function darDeBajaActivo({ id, motivo }) {
  return llamada(() => http('POST', `/api/activos/${id}/baja`, { cuerpo: { motivo } }))
}

export function trasladarActivo({ id, ubicacion, responsable, motivo }) {
  return llamada(() =>
    http('POST', `/api/activos/${id}/traslado`, { cuerpo: { ubicacion, responsable, motivo } }),
  )
}
