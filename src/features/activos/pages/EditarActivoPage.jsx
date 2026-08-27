import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActivo } from '../hooks/useActivo'
import { useCatalogosActivos } from '../hooks/useCatalogosActivos'
import { FormularioActivo } from '../components/FormularioActivo'
import { puedeGestionarActivos } from '../utils/permisosActivos'
import { obtenerMensajeErrorActivo } from '../constants/mensajesActivos'
import * as activosService from '../services/activosService'
import estilos from './AltaActivoPage.module.css'

/** Edición de un activo existente. No disponible si ya está dado de baja. */
export function EditarActivoPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { activo, cargando } = useActivo(id)
  const { categorias, ubicaciones } = useCatalogosActivos()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  if (cargando) {
    return <p className={estilos.subtitulo}>Cargando activo…</p>
  }

  if (!activo) {
    return (
      <div className={estilos.sinPermiso}>
        <h1>Activo no encontrado</h1>
        <p>El activo que buscas no existe o fue eliminado.</p>
        <Link to="/activos-fijos">Volver al listado</Link>
      </div>
    )
  }

  if (!puedeGestionarActivos(usuario)) {
    return (
      <div className={estilos.sinPermiso}>
        <h1>No tienes permisos para esta acción</h1>
        <p>Solo los roles Administrador y Gestor de Activos pueden editar activos.</p>
      </div>
    )
  }

  if (activo.estado === 'dado_de_baja') {
    return (
      <div className={estilos.sinPermiso}>
        <h1>Activo dado de baja</h1>
        <p>Un activo dado de baja no se puede editar, solo consultar.</p>
        <Link to={`/activos-fijos/${id}`}>Volver a la ficha</Link>
      </div>
    )
  }

  async function manejarEnvio(datos) {
    setError(null)
    setEnviando(true)
    try {
      await activosService.actualizarActivo({ id, datos, usuario: usuario.nombre })
      navigate(`/activos-fijos/${id}`)
    } catch (err) {
      setError(obtenerMensajeErrorActivo(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Editar activo</h1>
      <p className={estilos.subtitulo}>
        {activo.folio} — {activo.nombre}
      </p>

      <div className={estilos.tarjeta}>
        <FormularioActivo
          valoresIniciales={{
            nombre: activo.nombre,
            descripcion: activo.descripcion,
            categoria: activo.categoria,
            ubicacion: activo.ubicacion,
            responsable: activo.responsable,
            valor: String(activo.valor ?? ''),
            codigoBarras: activo.codigoBarras,
            rfid: activo.rfid,
          }}
          categorias={categorias}
          ubicaciones={ubicaciones}
          enviando={enviando}
          error={error}
          textoBoton="Guardar cambios"
          onEnviar={manejarEnvio}
          onCancelar={() => navigate(`/activos-fijos/${id}`)}
        />
      </div>
    </div>
  )
}
