import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Modal } from '../../../components/common/Modal'
import { useAuth } from '../../auth/hooks/useAuth'
import { esAdministrador } from '../../auth/utils/permisos'
import { SubNavConfiguracion } from '../components/SubNavConfiguracion'
import * as configuracionService from '../services/configuracionService'
import estilos from './ReiniciarDemoPage.module.css'

/**
 * Configuración → Reiniciar demo (docs/13, docs/14): restaura el seed en
 * segundos para que la comisión siempre encuentre orden. Solo
 * Administrador y con confirmación; al terminar, todas las sesiones
 * quedan cerradas (los datos, cuentas incluidas, vuelven a nacer).
 */
export function ReiniciarDemoPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  const [reiniciando, setReiniciando] = useState(false)
  const [error, setError] = useState(null)

  if (!esAdministrador(usuario)) {
    return (
      <div>
        <h1 className={estilos.titulo}>Configuración</h1>
        <SubNavConfiguracion />
        <p>Solo el rol Administrador puede reiniciar los datos de demostración.</p>
      </div>
    )
  }

  async function reiniciar() {
    setReiniciando(true)
    setError(null)
    try {
      await configuracionService.reiniciarDemo()
      // El reseed elimina también al usuario actual: la sesión termina.
      navigate('/login', {
        state: {
          mensaje: 'Datos de demostración restaurados. Inicie sesión nuevamente.',
        },
      })
    } catch {
      setError('No fue posible reiniciar los datos. Intente nuevamente.')
      setReiniciando(false)
      setConfirmando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Configuración</h1>
      <p className={estilos.subtitulo}>Restaurar los datos de demostración a su estado inicial.</p>

      <SubNavConfiguracion />

      {error && <Alert tipo="error">{error}</Alert>}

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Reiniciar datos de demostración</h2>
        <p>
          Elimina todos los registros creados durante la evaluación (activos, ítems, actas,
          usuarios adicionales y bitácora) y vuelve a dejar el sistema con sus datos iniciales.
        </p>
        <ul className={estilos.consecuencias}>
          <li>Las 4 cuentas de demostración se restauran con su clave única.</li>
          <li>Todas las sesiones activas se cierran, incluida la suya.</li>
          <li>La acción queda registrada en la auditoría y no se puede deshacer.</li>
        </ul>
        <Button anchoCompleto={false} onClick={() => setConfirmando(true)}>
          Reiniciar datos de demostración
        </Button>
      </section>

      {confirmando && (
        <Modal titulo="¿Reiniciar los datos de demostración?" onCerrar={() => setConfirmando(false)}>
          <p>
            Se eliminará todo lo creado durante la evaluación y su sesión se cerrará. Esta acción
            no se puede deshacer.
          </p>
          <div className={estilos.acciones}>
            <Button anchoCompleto={false} onClick={reiniciar} disabled={reiniciando}>
              {reiniciando ? 'Reiniciando…' : 'Sí, reiniciar'}
            </Button>
            <Button
              variante="secundario"
              anchoCompleto={false}
              onClick={() => setConfirmando(false)}
              disabled={reiniciando}
            >
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
