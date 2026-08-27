import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { TablaItems } from '../components/TablaItems'
import { useItems } from '../hooks/useItems'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarAlmacen } from '../utils/permisosAlmacen'
import estilos from './ListadoAlmacenPage.module.css'

/** Listado de ítems de bodega, con indicador de stock bajo mínimo. */
export function ListadoAlmacenPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { items, cargando } = useItems()

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Almacén</h1>
          <p className={estilos.subtitulo}>Control de stock e ingresos/egresos de bienes de consumo.</p>
        </div>
        {puedeGestionarAlmacen(usuario) && (
          <Button anchoCompleto={false} onClick={() => navigate('/almacen/nuevo')}>
            Nuevo item
          </Button>
        )}
      </div>

      <TablaItems items={items} cargando={cargando} />
    </div>
  )
}
