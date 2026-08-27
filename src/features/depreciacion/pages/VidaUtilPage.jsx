import { useState } from 'react'
import { SubNavConfiguracion } from '../../configuracion/components/SubNavConfiguracion'
import { TablaVidaUtil } from '../components/TablaVidaUtil'
import { useTablaVidaUtil } from '../hooks/useTablaVidaUtil'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeEditarVidaUtil } from '../utils/permisosVidaUtil'
import * as vidaUtilService from '../services/vidaUtilService'
import estilos from './VidaUtilPage.module.css'

/** Configuración de vida útil por categoría, base del cálculo de depreciación. */
export function VidaUtilPage() {
  const { usuario } = useAuth()
  const { tabla, cargando, recargar } = useTablaVidaUtil()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function manejarGuardar(filas) {
    setError(null)
    setGuardando(true)
    try {
      await vidaUtilService.actualizarTablaVidaUtil(filas)
      recargar()
    } catch {
      setError('No fue posible guardar los cambios. Revise los valores e intente nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Configuración</h1>
      <p className={estilos.subtitulo}>Vida útil por categoría, base del cálculo de depreciación.</p>

      <SubNavConfiguracion />

      <div className={estilos.notaReferencial}>
        Valores referenciales según la <strong>Resolución Exenta SII N°43 de 2002</strong> (Tabla
        de vida útil de bienes físicos del activo inmovilizado). Editables por la institución.
      </div>

      {cargando ? (
        <p className={estilos.cargando}>Cargando…</p>
      ) : (
        <TablaVidaUtil
          tabla={tabla}
          puedeEditar={puedeEditarVidaUtil(usuario)}
          onGuardar={manejarGuardar}
          guardando={guardando}
          error={error}
        />
      )}
    </div>
  )
}
