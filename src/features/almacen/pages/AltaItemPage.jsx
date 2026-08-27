import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCatalogosAlmacen } from '../hooks/useCatalogosAlmacen'
import { FormularioItem } from '../components/FormularioItem'
import { puedeGestionarAlmacen } from '../utils/permisosAlmacen'
import { obtenerMensajeErrorAlmacen } from '../constants/mensajesAlmacen'
import * as almacenService from '../services/almacenService'
import estilos from './AltaItemPage.module.css'

/** Alta de un ítem de bodega nuevo. El folio se genera solo en el mock. */
export function AltaItemPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { categorias, ubicaciones, unidades } = useCatalogosAlmacen()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  if (!puedeGestionarAlmacen(usuario)) {
    return (
      <div className={estilos.sinPermiso}>
        <h1>No tienes permisos para esta acción</h1>
        <p>Solo los roles Administrador y Gestor de Activos pueden crear ítems de bodega.</p>
      </div>
    )
  }

  async function manejarEnvio(datos) {
    setError(null)
    setEnviando(true)
    try {
      await almacenService.crearItem({ datos, usuario: usuario.nombre })
      navigate('/almacen')
    } catch (err) {
      setError(obtenerMensajeErrorAlmacen(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Nuevo ítem</h1>
      <p className={estilos.subtitulo}>El folio se asigna automáticamente al guardar.</p>

      <div className={estilos.tarjeta}>
        <FormularioItem
          categorias={categorias}
          ubicaciones={ubicaciones}
          unidades={unidades}
          enviando={enviando}
          error={error}
          onEnviar={manejarEnvio}
          onCancelar={() => navigate('/almacen')}
        />
      </div>
    </div>
  )
}
