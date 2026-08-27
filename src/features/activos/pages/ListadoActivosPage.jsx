import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { CampoEscaneo } from '../../../components/common/CampoEscaneo'
import { FiltrosActivos } from '../components/FiltrosActivos'
import { TablaActivos } from '../components/TablaActivos'
import { useActivos } from '../hooks/useActivos'
import { useCatalogosActivos } from '../hooks/useCatalogosActivos'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActivos } from '../utils/permisosActivos'
import { obtenerInfoEstado } from '../utils/estadoActivo'
import * as activosService from '../services/activosService'
import estilos from './ListadoActivosPage.module.css'

/** Listado de activos fijos con búsqueda avanzada, escáner y etiquetas. */
export function ListadoActivosPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { activos, cargando, filtros, setFiltros, hayFiltrosActivos, limpiarFiltros } =
    useActivos()
  const { categorias, ubicaciones, funcionarios } = useCatalogosActivos()
  const puedeGestionar = puedeGestionarActivos(usuario)

  // Selección para el pliego de etiquetas (RQ-19, docs/08).
  const [seleccionados, setSeleccionados] = useState(new Set())

  function alternarSeleccion(id) {
    setSeleccionados((previos) => {
      const siguientes = new Set(previos)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  }

  // Escáner (RQ-20): folio, código de barras o RFID → ficha directa.
  async function escanear(codigo) {
    const activo = await activosService.obtenerActivoPorCodigo(codigo).catch(() => null)
    if (!activo) return false
    navigate(`/activos-fijos/${activo.id}`)
    return true
  }

  // Hoja mural por ubicación (RQ-19): PDF generado en el navegador.
  async function generarHojaMural() {
    const [{ jsPDF }, autoTable] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const pdf = new jsPDF()
    pdf.setFontSize(14)
    pdf.text('Superintendencia de Seguridad Social', 14, 16)
    pdf.setFontSize(11)
    pdf.text(`Hoja mural de activos — ${filtros.ubicacion}`, 14, 24)
    pdf.setFontSize(9)
    pdf.setTextColor(110)
    pdf.text(`Generada el ${new Date().toLocaleDateString('es-CL')} · SISGA`, 14, 30)
    pdf.setTextColor(0)
    autoTable.default(pdf, {
      startY: 36,
      head: [['Folio', 'Nombre', 'Categoría', 'Estado', 'Código']],
      body: activos.map((activo) => [
        activo.folio,
        activo.nombre,
        activo.categoria,
        obtenerInfoEstado(activo.estado).etiqueta,
        activo.codigoBarras || activo.folio,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 66, 128] },
    })
    const alto = pdf.internal.pageSize.getHeight()
    pdf.setFontSize(9)
    pdf.text(`Total: ${activos.length} activo(s) en la ubicación.`, 14, alto - 10)
    pdf.save(`hoja-mural-${filtros.ubicacion.replace(/[^\wáéíóúñ-]+/gi, '-')}.pdf`)
  }

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Activos fijos</h1>
          <p className={estilos.subtitulo}>
            Listado y búsqueda avanzada de los activos fijos institucionales.
          </p>
        </div>
        {puedeGestionar && (
          <Button anchoCompleto={false} onClick={() => navigate('/activos-fijos/nuevo')}>
            Nuevo activo
          </Button>
        )}
      </div>

      <div className={estilos.escaner}>
        <CampoEscaneo
          onEscanear={escanear}
          accionAlta={
            puedeGestionar
              ? (codigo) => navigate(`/activos-fijos/nuevo?codigo=${encodeURIComponent(codigo)}`)
              : undefined
          }
        />
      </div>

      <FiltrosActivos
        filtros={filtros}
        setFiltros={setFiltros}
        categorias={categorias}
        ubicaciones={ubicaciones}
        responsables={funcionarios}
        hayFiltrosActivos={hayFiltrosActivos}
        onLimpiarFiltros={limpiarFiltros}
      />

      {(seleccionados.size > 0 || (filtros.ubicacion && activos.length > 0)) && (
        <div className={estilos.barraAcciones}>
          {seleccionados.size > 0 && (
            <Button
              anchoCompleto={false}
              variante="secundario"
              onClick={() =>
                navigate(`/activos-fijos/etiquetas?ids=${[...seleccionados].join(',')}`)
              }
            >
              Imprimir etiquetas ({seleccionados.size})
            </Button>
          )}
          {filtros.ubicacion && activos.length > 0 && (
            <Button anchoCompleto={false} variante="secundario" onClick={generarHojaMural}>
              Hoja mural de la ubicación (PDF)
            </Button>
          )}
        </div>
      )}

      <TablaActivos
        activos={activos}
        cargando={cargando}
        hayFiltrosActivos={hayFiltrosActivos}
        seleccionables={puedeGestionar}
        seleccionados={seleccionados}
        onAlternarSeleccion={alternarSeleccion}
      />
    </div>
  )
}
