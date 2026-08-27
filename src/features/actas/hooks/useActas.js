import { useCallback, useEffect, useState } from 'react'
import * as actasService from '../services/actasService'

/** Listado completo de actas (sin filtros/búsqueda en esta vuelta). */
export function useActas() {
  const [actas, setActas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    // setCargando(true) va dentro de un callback (no al inicio del
    // efecto) para no disparar el re-render en cascada que penaliza
    // react-hooks/set-state-in-effect — mismo patrón que useActivos.js.
    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return actasService.obtenerActas()
      })
      .then((resultado) => {
        if (!vigente) return
        setActas(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { actas, cargando, recargar }
}
