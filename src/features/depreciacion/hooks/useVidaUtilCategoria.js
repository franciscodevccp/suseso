import { useEffect, useState } from 'react'
import * as vidaUtilService from '../services/vidaUtilService'

/** Vida útil (años) configurada para una categoría puntual, o null si no existe. */
export function useVidaUtilCategoria(categoria) {
  const [vidaUtilAnios, setVidaUtilAnios] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return vidaUtilService.obtenerVidaUtilPorCategoria(categoria)
      })
      .then((resultado) => {
        if (!vigente) return
        setVidaUtilAnios(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [categoria])

  return { vidaUtilAnios, cargando }
}
