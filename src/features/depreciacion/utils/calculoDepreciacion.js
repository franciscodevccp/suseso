/**
 * Depreciación por método lineal (línea recta), el que usa el sector
 * público chileno para bienes patrimoniales. Funciones puras, sin mocks
 * ni React — pensadas para reutilizarse tal cual en un futuro reporte de
 * depreciación, además del bloque en la ficha del activo.
 */

/**
 * Años completos transcurridos entre `fechaAlta` y `fechaCorte`, contando
 * el aniversario cumplido (no solo la diferencia de año calendario).
 */
function calcularAniosTranscurridos(fechaAlta, fechaCorte) {
  const alta = new Date(fechaAlta)
  const corte = new Date(fechaCorte)
  let anios = corte.getFullYear() - alta.getFullYear()

  const aunNoCumpleAniversario =
    corte.getMonth() < alta.getMonth() ||
    (corte.getMonth() === alta.getMonth() && corte.getDate() < alta.getDate())
  if (aunNoCumpleAniversario) anios -= 1

  return Math.max(0, anios)
}

/**
 * Calcula la depreciación lineal de un activo.
 *
 * @param {number} valor - valor de adquisición.
 * @param {string|Date} fechaAlta - fecha de alta del activo.
 * @param {number} vidaUtilAnios - vida útil en años (entero > 0).
 * @param {number} [valorResidual=0] - valor mínimo al que puede llegar
 *   el valor libro (piso). Parámetro de la función, no un dato
 *   persistido: queda listo para conectarse a una configuración global
 *   si se pide más adelante.
 * @param {string|Date} [fechaCorte] - fecha hasta la que se calcula
 *   (hoy por defecto; la fecha de baja si el activo está dado de baja).
 */
export function calcularDepreciacion({
  valor,
  fechaAlta,
  vidaUtilAnios,
  valorResidual = 0,
  fechaCorte = new Date(),
}) {
  const depreciacionAnual = valor / vidaUtilAnios
  const depreciacionMaxima = Math.max(0, valor - valorResidual)
  const aniosTranscurridos = calcularAniosTranscurridos(fechaAlta, fechaCorte)
  const depreciacionAcumulada = Math.min(depreciacionAnual * aniosTranscurridos, depreciacionMaxima)
  const valorLibro = Math.max(valorResidual, valor - depreciacionAcumulada)

  const tablaEvolucion = []
  let acumuladaAnterior = 0
  for (let anio = 1; anio <= vidaUtilAnios; anio++) {
    const acumuladaAlAnio = Math.min(depreciacionAnual * anio, depreciacionMaxima)
    tablaEvolucion.push({
      anio,
      depreciacionDelAnio: acumuladaAlAnio - acumuladaAnterior,
      depreciacionAcumulada: acumuladaAlAnio,
      valorLibro: Math.max(valorResidual, valor - acumuladaAlAnio),
    })
    acumuladaAnterior = acumuladaAlAnio
  }

  return { depreciacionAnual, aniosTranscurridos, depreciacionAcumulada, valorLibro, tablaEvolucion }
}
