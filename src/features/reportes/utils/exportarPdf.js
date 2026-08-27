import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const INSTITUCION = 'Superintendencia de Seguridad Social'
const AZUL_OSCURO_INSTITUCIONAL = [6, 33, 77]

/** Genera un PDF con tabla, encabezado institucional y pie con numeración de páginas. */
export function descargarPdf(nombreArchivo, { titulo, columnas, filas }) {
  const orientacion = columnas.length > 5 ? 'landscape' : 'portrait'
  const doc = new jsPDF({ orientation: orientacion })

  doc.setFontSize(14)
  doc.text(INSTITUCION, 14, 16)
  doc.setFontSize(11)
  doc.text(titulo, 14, 23)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(
    `Generado el ${new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}`,
    14,
    29,
  )

  autoTable(doc, {
    startY: 34,
    head: [columnas.map((columna) => columna.etiqueta)],
    body: filas.map((fila) => columnas.map((columna) => String(fila[columna.clave] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: AZUL_OSCURO_INSTITUCIONAL },
  })

  // La numeración se agrega en un segundo paso, después de que autoTable ya
  // paginó toda la tabla: hacerlo dentro de un callback por página (ej.
  // didDrawPage) da un total de páginas incorrecto en tablas de más de una
  // página, porque en ese momento todavía no se sabe cuántas habrá en total.
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      doc.internal.pageSize.getWidth() - 32,
      doc.internal.pageSize.getHeight() - 10,
    )
  }

  doc.save(nombreArchivo)
}
