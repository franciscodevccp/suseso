import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { descargarCsv } from '../utils/exportarCsv'
import { descargarExcel } from '../utils/exportarExcel'
import { descargarPdf } from '../utils/exportarPdf'
import { generarNombreArchivo } from '../utils/nombreArchivo'
import estilos from './BotonesExportacion.module.css'

/**
 * Botones de descarga PDF/Excel/CSV para el reporte actualmente en
 * pantalla. Si se entrega `obtenerReporte` (async), los datos se piden al
 * momento de exportar — lo usa Auditoría para bajar el filtro completo
 * (hasta 5.000 filas) aunque la tabla esté paginada.
 */
export function BotonesExportacion({ titulo, prefijoArchivo, columnas, filas, deshabilitado, obtenerReporte }) {
  const [exportando, setExportando] = useState(false)

  async function exportar(formato, accion) {
    setExportando(true)
    try {
      const reporte = obtenerReporte ? await obtenerReporte() : { titulo, columnas, filas }
      await accion(generarNombreArchivo(prefijoArchivo, formato), { titulo, ...reporte })
    } finally {
      setExportando(false)
    }
  }

  const sinDatos = deshabilitado || exportando

  return (
    <div className={estilos.contenedor}>
      <Button
        variante="secundario"
        anchoCompleto={false}
        disabled={sinDatos}
        onClick={() => exportar('pdf', (nombre, datos) => Promise.resolve(descargarPdf(nombre, datos)))}
      >
        Descargar PDF
      </Button>
      <Button
        variante="secundario"
        anchoCompleto={false}
        disabled={sinDatos}
        onClick={() => exportar('xlsx', descargarExcel)}
      >
        Descargar Excel
      </Button>
      <Button
        variante="secundario"
        anchoCompleto={false}
        disabled={sinDatos}
        onClick={() => exportar('csv', (nombre, datos) => Promise.resolve(descargarCsv(nombre, datos)))}
      >
        Descargar CSV
      </Button>
    </div>
  )
}
