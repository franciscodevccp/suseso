/**
 * Reglas de clave del sistema, compartidas entre la validación en tiempo
 * real de la UI (usePasswordRules) y la revalidación de la capa mock.
 * Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
 */
const SIMBOLOS = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

export function evaluarClave(clave = '') {
  const longitudMinima = clave.length >= 8
  const tieneMayuscula = /[A-ZÁÉÍÓÚÑ]/.test(clave)
  const tieneMinuscula = /[a-záéíóúñ]/.test(clave)
  const tieneNumero = /[0-9]/.test(clave)
  const tieneSimbolo = SIMBOLOS.test(clave)

  return {
    longitudMinima,
    tieneMayuscula,
    tieneMinuscula,
    tieneNumero,
    tieneSimbolo,
    esValida:
      longitudMinima && tieneMayuscula && tieneMinuscula && tieneNumero && tieneSimbolo,
  }
}
