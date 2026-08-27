/**
 * Depreciación por método lineal MENSUAL (docs/09, D-06): la regla que
 * usa el sector público chileno para bienes patrimoniales, con valor
 * residual de $1 (convención de bien totalmente depreciado). Función
 * pura, compartida por el front (ficha del activo), el servidor
 * (reportes, panel) y la futura API contable.
 *
 * - `cuotaMensual = (valor − valorResidual) / (vidaUtilAnios × 12)`
 * - `mesesTranscurridos`: desde el mes de adquisición INCLUSIVE hasta el
 *   mes de la fecha de corte, con tope en la vida útil.
 * - `tablaEvolucion` es ANUAL (año 1..N) para la ficha y el reporte.
 * - Si se entrega `vidaUtilAcelerada` (tabla SII), devuelve además el
 *   cálculo acelerado con la misma fórmula.
 * - El redondeo a pesos enteros es responsabilidad de quien muestra
 *   (formatoMoneda.js); aquí se calcula con decimales.
 */

/** Meses entre el mes de `fechaAlta` (inclusive) y el mes de `fechaCorte`. */
function calcularMesesTranscurridos(fechaAlta, fechaCorte) {
  const alta = new Date(fechaAlta)
  const corte = new Date(fechaCorte)
  const meses =
    (corte.getFullYear() - alta.getFullYear()) * 12 + (corte.getMonth() - alta.getMonth()) + 1
  return Math.max(0, meses)
}

function calcularLinea({ valor, valorResidual, vidaUtilAnios, mesesDisponibles }) {
  const vidaUtilMeses = vidaUtilAnios * 12
  const cuotaMensual = (valor - valorResidual) / vidaUtilMeses
  const mesesTranscurridos = Math.min(mesesDisponibles, vidaUtilMeses)
  const depreciacionAcumulada = cuotaMensual * mesesTranscurridos
  const valorLibro = Math.max(valorResidual, valor - depreciacionAcumulada)

  return {
    cuotaMensual,
    mesesTranscurridos,
    depreciacionAcumulada,
    valorLibro,
    vidaUtilRestanteMeses: vidaUtilMeses - mesesTranscurridos,
  }
}

/**
 * @param {{valor:number, fechaAlta:string|Date, vidaUtilAnios:number,
 *          valorResidual?:number, fechaCorte?:string|Date,
 *          vidaUtilAcelerada?:number|null}} parametros
 */
export function calcularDepreciacion({
  valor,
  fechaAlta,
  vidaUtilAnios,
  valorResidual = 1,
  fechaCorte = new Date(),
  vidaUtilAcelerada = null,
}) {
  const mesesDisponibles = calcularMesesTranscurridos(fechaAlta, fechaCorte)
  const normal = calcularLinea({ valor, valorResidual, vidaUtilAnios, mesesDisponibles })

  // Tabla anual: depreciación de cada año, acumulada y valor libro al
  // cierre (año completo, sin importar la fecha de corte).
  const tablaEvolucion = []
  let acumuladaAnterior = 0
  const depreciable = Math.max(0, valor - valorResidual)
  for (let anio = 1; anio <= vidaUtilAnios; anio++) {
    const acumuladaAlAnio = Math.min(normal.cuotaMensual * anio * 12, depreciable)
    tablaEvolucion.push({
      anio,
      depreciacionDelAnio: acumuladaAlAnio - acumuladaAnterior,
      depreciacionAcumulada: acumuladaAlAnio,
      valorLibro: Math.max(valorResidual, valor - acumuladaAlAnio),
    })
    acumuladaAnterior = acumuladaAlAnio
  }

  return {
    ...normal,
    // Compatibilidad con los consumidores existentes (docs/09).
    depreciacionAnual: normal.cuotaMensual * 12,
    aniosTranscurridos: Math.floor(normal.mesesTranscurridos / 12),
    tablaEvolucion,
    ...(vidaUtilAcelerada
      ? {
          acelerada: calcularLinea({
            valor,
            valorResidual,
            vidaUtilAnios: vidaUtilAcelerada,
            mesesDisponibles,
          }),
        }
      : {}),
  }
}
