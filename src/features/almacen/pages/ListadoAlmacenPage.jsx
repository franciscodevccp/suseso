import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { CampoEscaneo } from '../../../components/common/CampoEscaneo'
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

  // Escáner (RQ-20, docs/08): en almacén se busca por folio BOD.
  async function escanear(codigo) {
    const item = items.find((fila) => fila.folio.toUpperCase() === codigo.toUpperCase())
    if (!item) return false
    navigate(`/almacen/${item.id}`)
    return true
  }

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

      <div className={estilos.escaner}>
        <CampoEscaneo
          onEscanear={escanear}
          placeholder="Escanear o escribir un folio (ej.: BOD-2026-0001) y presionar Enter"
        />
      </div>

      <TablaItems items={items} cargando={cargando} />
    </div>
  )
}
