/**
 * Capa de servicio SIMULADA del panel de control. Aislada del resto del
 * mock de acceso: no depende de él ni comparte almacenamiento. Hoy solo
 * devuelve ceros y arreglos vacíos porque todavía no hay activos
 * registrados; se reemplaza más adelante por llamadas a la API REST sin
 * tocar la página ni los componentes que la consumen.
 */
function retraso(ms = 450) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** KPI del encabezado del panel de control. */
export async function obtenerResumenIndicadores() {
  await retraso()
  return {
    totalActivos: 0,
    valorTotalInventariado: 0,
    alertasVigentes: 0,
    itemsBajoStockMinimo: 0,
  }
}

/** Cantidad de activos agrupados por estado (para el gráfico correspondiente). */
export async function obtenerDistribucionPorEstado() {
  await retraso()
  return []
}

/** Cantidad de activos agrupados por categoría (para el gráfico correspondiente). */
export async function obtenerActivosPorCategoria() {
  await retraso()
  return []
}

/** Últimos movimientos registrados en el sistema. */
export async function obtenerActividadReciente() {
  await retraso()
  return []
}
