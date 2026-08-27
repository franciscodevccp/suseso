import ExcelJS from 'exceljs'
import { descargarBlob } from './descargarArchivo'

const INSTITUCION = 'Superintendencia de Seguridad Social'
const TIPO_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Genera un .xlsx real (con exceljs) con el mismo encabezado institucional
 * y las mismas columnas/filas que el resto de las exportaciones.
 */
export async function descargarExcel(nombreArchivo, { titulo, columnas, filas }) {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Reporte')

  hoja.addRow([INSTITUCION]).font = { bold: true, size: 12 }
  hoja.addRow([titulo]).font = { bold: true }
  hoja.addRow([
    `Generado el ${new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}`,
  ])
  hoja.addRow([])

  hoja.addRow(columnas.map((columna) => columna.etiqueta)).font = { bold: true }
  filas.forEach((fila) => {
    hoja.addRow(columnas.map((columna) => fila[columna.clave]))
  })

  hoja.columns = columnas.map(() => ({ width: 24 }))

  const buffer = await libro.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: TIPO_MIME_XLSX })
  descargarBlob(blob, nombreArchivo)
}
