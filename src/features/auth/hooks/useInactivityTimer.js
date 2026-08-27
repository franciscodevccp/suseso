import { useEffect, useRef } from 'react'

const EVENTOS_ACTIVIDAD = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
const TIEMPO_INACTIVIDAD_MS = 20 * 60 * 1000
const TIEMPO_AVISO_PREVIO_MS = 60 * 1000

/**
 * Cierra la sesión tras 20 min sin interacción del usuario, avisando 1 min
 * antes mediante `onAvisoPrevio` (para mostrar un modal con cuenta
 * regresiva). Solo corre mientras `activo` es verdadero.
 */
export function useInactivityTimer({ activo, onAvisoPrevio, onExpirar }) {
  const timeoutAvisoRef = useRef(null)
  const timeoutExpiracionRef = useRef(null)
  const onAvisoPrevioRef = useRef(onAvisoPrevio)
  const onExpirarRef = useRef(onExpirar)

  useEffect(() => {
    onAvisoPrevioRef.current = onAvisoPrevio
    onExpirarRef.current = onExpirar
  }, [onAvisoPrevio, onExpirar])

  useEffect(() => {
    if (!activo) return undefined

    function reiniciarTemporizadores() {
      clearTimeout(timeoutAvisoRef.current)
      clearTimeout(timeoutExpiracionRef.current)

      timeoutAvisoRef.current = setTimeout(() => {
        onAvisoPrevioRef.current?.()
      }, TIEMPO_INACTIVIDAD_MS - TIEMPO_AVISO_PREVIO_MS)

      timeoutExpiracionRef.current = setTimeout(() => {
        onExpirarRef.current?.()
      }, TIEMPO_INACTIVIDAD_MS)
    }

    reiniciarTemporizadores()
    EVENTOS_ACTIVIDAD.forEach((evento) =>
      window.addEventListener(evento, reiniciarTemporizadores),
    )

    return () => {
      clearTimeout(timeoutAvisoRef.current)
      clearTimeout(timeoutExpiracionRef.current)
      EVENTOS_ACTIVIDAD.forEach((evento) =>
        window.removeEventListener(evento, reiniciarTemporizadores),
      )
    }
  }, [activo])
}
