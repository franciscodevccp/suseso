/**
 * Capa de servicio SIMULADA de Actas y Firma Electrónica. Aislada (no
 * importa activosService): el vínculo con un activo se resuelve en la UI
 * (ver features/actas/hooks/useActivosDisponibles.js) y llega ya armado
 * en `datos` al crear el acta.
 *
 * Persiste en localStorage, mismo patrón que activosService.mock.js.
 *
 * IMPORTANTE sobre la firma: `firmarActa` genera un sello de verificación
 * real (SHA-256 vía Web Crypto sobre folio+contenido+firmante+fecha), útil
 * para demostrar integridad, pero esto NO es una firma electrónica
 * avanzada legalmente válida. En producción esa firma la emite un
 * proveedor acreditado conforme a la Ley 19.799 — este mock solo
 * representa el flujo (pendiente -> firmada) para la demo.
 */
const CLAVE_ACTAS = 'sisga_actas'

export class ActaError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ActaError'
    this.code = code
  }
}

function retraso(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generarId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// --- Persistencia local ------------------------------------------------
// Forma completa del acta (folio "ACT-2026-0001"):
// { id, folio, tipo, activoId, activoFolio, activoNombre, responsable,
//   contenido, estadoFirma, firmante, fechaFirma, selloVerificacion }
function leerActas() {
  try {
    const crudo = localStorage.getItem(CLAVE_ACTAS)
    if (!crudo) {
      guardarActas([])
      return []
    }
    return JSON.parse(crudo)
  } catch {
    guardarActas([])
    return []
  }
}

function guardarActas(actas) {
  localStorage.setItem(CLAVE_ACTAS, JSON.stringify(actas))
}

/** Folio correlativo del año en curso, a partir del máximo ya usado. */
function generarFolio(actas) {
  const prefijo = `ACT-${new Date().getFullYear()}-`
  const maximo = actas.reduce((max, acta) => {
    if (!acta.folio?.startsWith(prefijo)) return max
    const numero = Number.parseInt(acta.folio.slice(prefijo.length), 10)
    return Number.isFinite(numero) && numero > max ? numero : max
  }, 0)
  return `${prefijo}${String(maximo + 1).padStart(4, '0')}`
}

/**
 * Huella de integridad sobre el contenido del acta al momento de
 * firmarla (SHA-256 real vía Web Crypto, no una firma legal). Se muestra
 * como "sello de verificación" en la ficha.
 */
async function generarSelloVerificacion({ folio, contenido, firmante, fecha }) {
  const texto = `${folio}|${contenido}|${firmante}|${fecha}`
  const datosCodificados = new TextEncoder().encode(texto)
  const buffer = await crypto.subtle.digest('SHA-256', datosCodificados)
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Listado completo, más reciente primero (el folio es correlativo, ordena solo). */
export async function obtenerActas() {
  await retraso()
  return [...leerActas()].sort((a, b) => b.folio.localeCompare(a.folio))
}

export async function obtenerActaPorId(id) {
  await retraso()
  const actas = leerActas()
  return actas.find((acta) => acta.id === id) ?? null
}

/**
 * Crea el acta en estado "pendiente". `datos` ya trae resuelto el
 * vínculo con el activo (activoId/activoFolio/activoNombre), si lo hay.
 */
export async function crearActa(datos) {
  await retraso()
  if (!datos.responsable?.trim()) {
    throw new ActaError('RESPONSABLE_REQUERIDO')
  }
  if (!datos.contenido?.trim()) {
    throw new ActaError('CONTENIDO_REQUERIDO')
  }

  const actas = leerActas()
  const nuevaActa = {
    id: generarId(),
    folio: generarFolio(actas),
    tipo: datos.tipo,
    activoId: datos.activoId ?? null,
    activoFolio: datos.activoFolio ?? null,
    activoNombre: datos.activoNombre ?? null,
    responsable: datos.responsable.trim(),
    contenido: datos.contenido.trim(),
    estadoFirma: 'pendiente',
    firmante: null,
    fechaFirma: null,
    selloVerificacion: null,
  }

  actas.push(nuevaActa)
  guardarActas(actas)

  return nuevaActa
}

/** Firma el acta: genera el sello y la marca "firmada". No se puede firmar dos veces. */
export async function firmarActa(id, firmante) {
  await retraso()
  const actas = leerActas()
  const acta = actas.find((a) => a.id === id)
  if (!acta) {
    throw new ActaError('ACTA_NO_ENCONTRADA')
  }
  if (acta.estadoFirma === 'firmada') {
    throw new ActaError('ACTA_YA_FIRMADA')
  }

  const fechaFirma = new Date().toISOString()
  acta.selloVerificacion = await generarSelloVerificacion({
    folio: acta.folio,
    contenido: acta.contenido,
    firmante,
    fecha: fechaFirma,
  })
  acta.estadoFirma = 'firmada'
  acta.firmante = firmante
  acta.fechaFirma = fechaFirma
  guardarActas(actas)

  return acta
}

/** Borra las actas de prueba, para volver al estado inicial vacío. */
export function reiniciarDatosDemo() {
  localStorage.removeItem(CLAVE_ACTAS)
}
