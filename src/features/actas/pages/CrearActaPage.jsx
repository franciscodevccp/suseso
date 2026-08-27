import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActivosDisponibles } from '../hooks/useActivosDisponibles'
import { FormularioActa } from '../components/FormularioActa'
import { puedeGestionarActas } from '../utils/permisosActas'
import { obtenerMensajeErrorActa } from '../constants/mensajesActas'
import * as actasService from '../services/actasService'
import estilos from './CrearActaPage.module.css'

/** Creación de una nueva acta (recepción/entrega). Nace en estado "pendiente". */
export function CrearActaPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { activos: activosDisponibles } = useActivosDisponibles()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  if (!puedeGestionarActas(usuario)) {
    return (
      <div className={estilos.sinPermiso}>
        <h1>No tienes permisos para esta acción</h1>
        <p>Solo los roles Administrador y Gestor de Activos pueden crear actas.</p>
      </div>
    )
  }

  async function manejarEnvio(valores) {
    setError(null)
    setEnviando(true)
    try {
      const activoSeleccionado = activosDisponibles.find((activo) => activo.id === valores.activoId)
      await actasService.crearActa({
        tipo: valores.tipo,
        responsable: valores.responsable,
        contenido: valores.contenido,
        activoId: activoSeleccionado?.id ?? null,
        activoFolio: activoSeleccionado?.folio ?? null,
        activoNombre: activoSeleccionado?.nombre ?? null,
      })
      navigate('/actas')
    } catch (err) {
      setError(obtenerMensajeErrorActa(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Nueva acta</h1>
      <p className={estilos.subtitulo}>El folio se asigna automáticamente al guardar.</p>

      <div className={estilos.tarjeta}>
        <FormularioActa
          activosDisponibles={activosDisponibles}
          enviando={enviando}
          error={error}
          onEnviar={manejarEnvio}
          onCancelar={() => navigate('/actas')}
        />
      </div>
    </div>
  )
}
