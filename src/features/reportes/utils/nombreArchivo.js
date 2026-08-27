/** Nombre de archivo descriptivo: "reporte-inventario-2026-08-26.xlsx". */
export function generarNombreArchivo(prefijo, extension) {
  const fecha = new Date().toISOString().slice(0, 10)
  return `reporte-${prefijo}-${fecha}.${extension}`
}
