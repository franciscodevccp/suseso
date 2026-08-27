/**
 * Reglas de clave del sistema, COMPARTIDAS entre el front (validación en
 * vivo de la UI) y el servidor (validación real, docs/14). Mínimo 8
 * caracteres, mayúscula, minúscula, número y símbolo.
 *
 * Movida desde src/features/auth/utils/passwordRules.js (docs/03); ese
 * archivo ahora reexporta desde aquí para no tocar las vistas.
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
