import { useCallback, useEffect, useState } from 'react'
import * as almacenService from '../services/almacenService'

/**
 * Trae un ítem y su historial de movimientos por id, para la ficha.
 * Expone `recargar()` para volver a pedir ambos tras un ingreso/egreso.
 */
export function useItem(id) {
  const [item, setItem] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return Promise.all([
          almacenService.obtenerItemPorId(id),
          almacenService.obtenerMovimientosPorItem(id),
        ])
      })
      .then(([itemObtenido, movimientosObtenidos]) => {
        if (!vigente) return
        setItem(itemObtenido)
        setMovimientos(movimientosObtenidos)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [id, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { item, movimientos, cargando, recargar }
}
