import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCatalogosActivos } from '../hooks/useCatalogosActivos'
import { FormularioActivo } from '../components/FormularioActivo'
import { puedeGestionarActivos } from '../utils/permisosActivos'
import { obtenerMensajeErrorActivo } from '../constants/mensajesActivos'
import * as activosService from '../services/activosService'
import estilos from './AltaActivoPage.module.css'

/** Alta de un activo nuevo. El folio se genera solo en el mock. */
export function AltaActivoPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { categorias, ubicaciones } = useCatalogosActivos()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  // El escáner puede llegar con un código no registrado (RQ-20, docs/08).
  const [parametros] = useSearchParams()
  const codigoEscaneado = parametros.get('codigo') ?? ''

  if (!puedeGestionarActivos(usuario)) {
    return (
      <div className={estilos.sinPermiso}>
        <h1>No tienes permisos para esta acción</h1>
        <p>Solo los roles Administrador y Gestor de Activos pueden crear activos.</p>
      </div>
    )
  }

  async function manejarEnvio(datos) {
    setError(null)
    setEnviando(true)
    try {
      await activosService.crearActivo({ datos, usuario: usuario.nombre })
      navigate('/activos-fijos')
    } catch (err) {
      setError(obtenerMensajeErrorActivo(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Nuevo activo</h1>
      <p className={estilos.subtitulo}>
        El folio se asigna automáticamente al guardar.
      </p>

      <div className={estilos.tarjeta}>
        <FormularioActivo
          {...(codigoEscaneado ? { valoresIniciales: { codigoBarras: codigoEscaneado } } : {})}
          categorias={categorias}
          ubicaciones={ubicaciones}
          enviando={enviando}
          error={error}
          textoBoton="Crear activo"
          onEnviar={manejarEnvio}
          onCancelar={() => navigate('/activos-fijos')}
        />
      </div>
    </div>
  )
}
