import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/common/Button'
import estilos from './SessionExpiryModal.module.css'

const SEGUNDOS_AVISO = 60

/** Modal de aviso mostrado 1 minuto antes de expirar la sesión por inactividad. */
export function SessionExpiryModal({ onContinuar, onCerrarSesion }) {
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_AVISO)
  const botonContinuarRef = useRef(null)

  useEffect(() => {
    botonContinuarRef.current?.focus()

    const intervalo = setInterval(() => {
      setSegundosRestantes((segundos) => {
        if (segundos <= 1) {
          clearInterval(intervalo)
          onCerrarSesion()
          return 0
        }
        return segundos - 1
      })
    }, 1000)

    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={estilos.fondo}>
      <div
        className={estilos.dialogo}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-expiracion-sesion"
        aria-describedby="descripcion-expiracion-sesion"
      >
        <h2 id="titulo-expiracion-sesion" className={estilos.titulo}>
          Su sesión está por expirar
        </h2>
        <p id="descripcion-expiracion-sesion" className={estilos.descripcion}>
          Por inactividad, su sesión se cerrará en{' '}
          <strong>{segundosRestantes} segundos</strong>. ¿Desea continuar
          conectado?
        </p>
        <div className={estilos.acciones}>
          <Button
            ref={botonContinuarRef}
            variante="primario"
            onClick={onContinuar}
          >
            Continuar sesión
          </Button>
          <Button variante="secundario" onClick={onCerrarSesion}>
            Cerrar sesión ahora
          </Button>
        </div>
      </div>
    </div>
  )
}
