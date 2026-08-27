/**
 * Reexporta el cálculo de depreciación compartido con el servidor
 * (docs/09): una sola implementación para la ficha, los reportes y la
 * futura API contable. En B2 la implementación de shared/ pasa a la regla
 * lineal MENSUAL con residual $1 sin tocar a ningún consumidor.
 */
export { calcularDepreciacion } from '../../../../shared/depreciacion.js'
