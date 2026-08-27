import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { TablaActas } from '../components/TablaActas'
import { useActas } from '../hooks/useActas'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActas } from '../utils/permisosActas'
import estilos from './ListadoActasPage.module.css'

/** Listado de actas de asignación y entrega de activos. */
export function ListadoActasPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { actas, cargando } = useActas()

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Actas de asignación y entrega</h1>
          <p className={estilos.subtitulo}>
            Actas de recepción y entrega de activos, con sello de integridad al cierre.
          </p>
        </div>
        {puedeGestionarActas(usuario) && (
          <Button anchoCompleto={false} onClick={() => navigate('/actas/nueva')}>
            Nueva acta
          </Button>
        )}
      </div>

      <TablaActas actas={actas} cargando={cargando} />
    </div>
  )
}
