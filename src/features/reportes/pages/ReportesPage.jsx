import { useEffect, useState } from 'react'
import { SelectorTipoReporte } from '../components/SelectorTipoReporte'
import { FiltrosInventario } from '../components/FiltrosInventario'
import { FiltrosMovimientos } from '../components/FiltrosMovimientos'
import { TablaVistaPrevia } from '../components/TablaVistaPrevia'
import { BotonesExportacion } from '../components/BotonesExportacion'
import { TIPOS_REPORTE } from '../constants/tiposReporte'
import { useCatalogosActivos } from '../../activos/hooks/useCatalogosActivos'
import * as reportesService from '../services/reportesService'
import estilos from './ReportesPage.module.css'

const FILTROS_INVENTARIO_INICIALES = { categoria: '', ubicacion: '', estado: '' }
const FILTROS_MOVIMIENTOS_INICIALES = { desde: '', hasta: '' }

/** Reportes con vista previa y descarga en PDF, Excel y CSV. */
export function ReportesPage() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('inventario')
  const [filtrosInventario, setFiltrosInventario] = useState(FILTROS_INVENTARIO_INICIALES)
  const [filtrosMovimientos, setFiltrosMovimientos] = useState(FILTROS_MOVIMIENTOS_INICIALES)
  const [reporte, setReporte] = useState({ columnas: [], filas: [] })
  const [cargando, setCargando] = useState(true)
  const { categorias, ubicaciones } = useCatalogosActivos()

  useEffect(() => {
    let vigente = true

    // Ver el comentario equivalente en useActivos.js: setCargando(true)
    // va dentro de un callback para no llamarlo de forma síncrona en el
    // cuerpo del efecto.
    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        if (tipoSeleccionado === 'inventario') {
          return reportesService.generarReporteInventario(filtrosInventario)
        }
        if (tipoSeleccionado === 'depreciacion') {
          return reportesService.generarReporteDepreciacion()
        }
        return reportesService.generarReporteMovimientos(filtrosMovimientos)
      })
      .then((resultado) => {
        if (!vigente) return
        setReporte(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [tipoSeleccionado, filtrosInventario, filtrosMovimientos])

  const tituloReporte = TIPOS_REPORTE.find((tipo) => tipo.id === tipoSeleccionado).etiqueta

  return (
    <div>
      <h1 className={estilos.titulo}>Reportes</h1>
      <p className={estilos.subtitulo}>Vista previa y exportación en PDF, Excel y CSV.</p>

      <SelectorTipoReporte tipoSeleccionado={tipoSeleccionado} onCambiar={setTipoSeleccionado} />

      {tipoSeleccionado === 'inventario' && (
        <FiltrosInventario
          filtros={filtrosInventario}
          setFiltros={setFiltrosInventario}
          categorias={categorias}
          ubicaciones={ubicaciones}
        />
      )}
      {tipoSeleccionado === 'movimientos' && (
        <FiltrosMovimientos filtros={filtrosMovimientos} setFiltros={setFiltrosMovimientos} />
      )}

      <BotonesExportacion
        titulo={tituloReporte}
        prefijoArchivo={tipoSeleccionado}
        columnas={reporte.columnas}
        filas={reporte.filas}
        deshabilitado={cargando || reporte.filas.length === 0}
      />

      <TablaVistaPrevia columnas={reporte.columnas} filas={reporte.filas} cargando={cargando} />
    </div>
  )
}
