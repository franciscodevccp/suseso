/**
 * Capa de servicio REAL de actas (docs/03). El servidor ya usa los nombres
 * definitivos de docs/13 (estado/cerradaPor/fechaCierre/selloIntegridad);
 * este servicio los traduce a las claves que las vistas todavía esperan
 * (estadoFirma/firmante/fechaFirma/selloVerificacion). Cuando B2 renombre
 * la UI (D-03), esta traducción desaparece.
 */
import { ErrorApi, http } from '../../../services/http.js'

export class ActaError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ActaError'
    this.code = code
  }
}

const CODIGO_UI = { ACTA_YA_CERRADA: 'ACTA_YA_FIRMADA' }

async function llamada(ejecutar) {
  try {
    return await ejecutar()
  } catch (error) {
    if (error instanceof ErrorApi) throw new ActaError(CODIGO_UI[error.codigo] ?? error.codigo)
    throw error
  }
}

function comoActaUi(acta) {
  if (!acta) return null
  const { estado, cerradaPor, fechaCierre, selloIntegridad, ...resto } = acta
  return {
    ...resto,
    estadoFirma: estado === 'cerrada' ? 'firmada' : 'pendiente',
    firmante: cerradaPor,
    fechaFirma: fechaCierre,
    selloVerificacion: selloIntegridad,
  }
}

export async function obtenerActas() {
  const actas = await llamada(() => http('GET', '/api/actas'))
  return actas.map(comoActaUi)
}

export async function obtenerActaPorId(id) {
  // El mock devolvía null cuando no existía; se conserva ese contrato.
  try {
    return comoActaUi(await http('GET', `/api/actas/${id}`))
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) return null
    if (error instanceof ErrorApi) throw new ActaError(CODIGO_UI[error.codigo] ?? error.codigo)
    throw error
  }
}

export async function crearActa(datos) {
  return comoActaUi(await llamada(() => http('POST', '/api/actas', { cuerpo: datos })))
}

// El firmante del contrato del mock se conserva en la firma pero ya no
// viaja: quien cierra es el usuario de la sesión (docs/03).
export async function firmarActa(id) {
  return comoActaUi(await llamada(() => http('POST', `/api/actas/${id}/cerrar`)))
}
