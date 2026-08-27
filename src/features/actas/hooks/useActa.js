import { useCallback, useEffect, useState } from 'react'
import * as actasService from '../services/actasService'

/** Trae un acta por id, para la ficha. Expone recargar() (usado tras el cierre). */
export function useActa(id) {
  const [acta, setActa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return actasService.obtenerActaPorId(id)
      })
      .then((actaObtenida) => {
        if (!vigente) return
        setActa(actaObtenida)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [id, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { acta, cargando, recargar }
}
