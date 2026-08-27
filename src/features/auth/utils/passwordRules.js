/**
 * Reexporta las reglas de clave compartidas con el servidor (docs/03).
 * La implementación vive en shared/passwordRules.js: una sola fuente de
 * verdad para la UI (previsualización) y la API (validación real).
 */
export { evaluarClave } from '../../../../shared/passwordRules.js'
