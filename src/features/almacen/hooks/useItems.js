import { useCallback, useEffect, useState } from 'react'
import * as almacenService from '../mock/almacenService.mock'

/** Listado completo de ítems de bodega (sin filtros). */
export function useItems() {
  const [items, setItems] = useState([])
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
        return almacenService.obtenerItems()
      })
      .then((resultado) => {
        if (!vigente) return
        setItems(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { items, cargando, recargar }
}
