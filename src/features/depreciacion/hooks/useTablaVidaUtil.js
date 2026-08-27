import { useCallback, useEffect, useState } from 'react'
import * as vidaUtilService from '../mock/vidaUtilService.mock'

/** Tabla completa de vida útil por categoría, para la página de configuración. */
export function useTablaVidaUtil() {
  const [tabla, setTabla] = useState([])
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    // Ver el comentario equivalente en useActivos.js: setCargando(true)
    // va dentro de un callback para no llamarlo de forma síncrona en el
    // cuerpo del efecto.
    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return vidaUtilService.obtenerTablaVidaUtil()
      })
      .then((resultado) => {
        if (!vigente) return
        setTabla(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { tabla, cargando, recargar }
}
