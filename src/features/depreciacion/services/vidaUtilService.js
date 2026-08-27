/**
 * Capa de servicio REAL de la tabla de vida útil (docs/03, docs/09).
 * Mismas funciones que el mock; `obtenerVidaUtilPorCategoria` se resuelve
 * en el front desde la tabla completa, como prescribe docs/03.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class VidaUtilError extends Error {
  constructor(code) {
    super(code)
    this.name = 'VidaUtilError'
    this.code = code
  }
}

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new VidaUtilError(error.codigo)
    throw error
  }
}

export function obtenerTablaVidaUtil() {
  return llamada(() => http('GET', '/api/configuracion/vida-util'))
}

/** Vida útil (años) de una categoría, o null si no está configurada. */
export async function obtenerVidaUtilPorCategoria(categoria) {
  const tabla = await obtenerTablaVidaUtil()
  return tabla.find((fila) => fila.categoria === categoria)?.vidaUtilAnios ?? null
}

/** Reemplaza la tabla completa (se edita como un solo formulario). */
export function actualizarTablaVidaUtil(filas) {
  return llamada(() =>
    http('PUT', '/api/configuracion/vida-util', {
      cuerpo: filas.map(({ categoria, vidaUtilAnios }) => ({ categoria, vidaUtilAnios })),
    }),
  )
}
