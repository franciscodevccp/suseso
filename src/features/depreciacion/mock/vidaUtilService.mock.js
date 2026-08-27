/**
 * Capa de servicio SIMULADA de la tabla de vida útil por categoría, usada
 * para el cálculo de depreciación. Persiste en localStorage (mismo
 * patrón que activosService.mock.js).
 *
 * Los nombres de categoría deben calzar EXACTAMENTE con los de
 * `CATEGORIAS` en activosService.mock.js (mayúsculas y tildes incluidas)
 * para que el cruce activo -> vida útil funcione. Como las categorías de
 * activos hoy son estáticas (sin UI para crear nuevas), esta duplicación
 * de nombres como strings es una simplificación aceptable.
 */
const CLAVE_VIDA_UTIL = 'sisga_vida_util'

export class VidaUtilError extends Error {
  constructor(code) {
    super(code)
    this.name = 'VidaUtilError'
    this.code = code
  }
}

function retraso(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Datos de prueba -------------------------------------------------------
// Valores REFERENCIALES, no cifras oficiales verificadas: deben ajustarse
// a la normativa vigente (decreto o tabla del organismo) antes de usarse
// como base contable definitiva. Ver nota en VidaUtilPage.
function vidaUtilSemilla() {
  return [
    { categoria: 'Mobiliario', vidaUtilAnios: 7 },
    { categoria: 'Equipos computacionales', vidaUtilAnios: 6 },
    { categoria: 'Vehículos', vidaUtilAnios: 7 },
    { categoria: 'Maquinaria', vidaUtilAnios: 15 },
    { categoria: 'Equipos audiovisuales', vidaUtilAnios: 6 },
    { categoria: 'Herramientas', vidaUtilAnios: 8 },
  ]
}

// --- Persistencia local ------------------------------------------------
function leerVidaUtil() {
  try {
    const crudo = localStorage.getItem(CLAVE_VIDA_UTIL)
    if (!crudo) {
      const semilla = vidaUtilSemilla()
      guardarVidaUtil(semilla)
      return semilla
    }
    return JSON.parse(crudo)
  } catch {
    const semilla = vidaUtilSemilla()
    guardarVidaUtil(semilla)
    return semilla
  }
}

function guardarVidaUtil(tabla) {
  localStorage.setItem(CLAVE_VIDA_UTIL, JSON.stringify(tabla))
}

export async function obtenerTablaVidaUtil() {
  await retraso()
  return leerVidaUtil()
}

/** Vida útil (años) de una categoría, o null si no está configurada. */
export async function obtenerVidaUtilPorCategoria(categoria) {
  await retraso()
  const tabla = leerVidaUtil()
  return tabla.find((fila) => fila.categoria === categoria)?.vidaUtilAnios ?? null
}

/** Reemplaza la tabla completa (se edita como un solo formulario). */
export async function actualizarTablaVidaUtil(filas) {
  await retraso()
  for (const fila of filas) {
    if (!Number.isInteger(fila.vidaUtilAnios) || fila.vidaUtilAnios <= 0) {
      throw new VidaUtilError('VALOR_INVALIDO')
    }
  }
  guardarVidaUtil(filas)
  return filas
}

/** Borra la tabla de prueba, para volver a los defaults referenciales. */
export function reiniciarDatosDemo() {
  localStorage.removeItem(CLAVE_VIDA_UTIL)
}
