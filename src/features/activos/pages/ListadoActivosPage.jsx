import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { FiltrosActivos } from '../components/FiltrosActivos'
import { TablaActivos } from '../components/TablaActivos'
import { useActivos } from '../hooks/useActivos'
import { useCatalogosActivos } from '../hooks/useCatalogosActivos'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActivos } from '../utils/permisosActivos'
import estilos from './ListadoActivosPage.module.css'

/** Listado de activos fijos con búsqueda avanzada. */
export function ListadoActivosPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { activos, cargando, filtros, setFiltros, hayFiltrosActivos, limpiarFiltros } =
    useActivos()
  const { categorias, ubicaciones, funcionarios } = useCatalogosActivos()

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Activos fijos</h1>
          <p className={estilos.subtitulo}>
            Listado y búsqueda avanzada de los activos fijos institucionales.
          </p>
        </div>
        {puedeGestionarActivos(usuario) && (
          <Button anchoCompleto={false} onClick={() => navigate('/activos-fijos/nuevo')}>
            Nuevo activo
          </Button>
        )}
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

      <TablaActivos activos={activos} cargando={cargando} hayFiltrosActivos={hayFiltrosActivos} />
    </div>
  )
}
