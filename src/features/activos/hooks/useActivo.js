import { useCallback, useEffect, useState } from 'react'
import * as activosService from '../mock/activosService.mock'

/**
 * Trae un activo y su historial de movimientos por id, para la ficha (y
 * para precargar el formulario de edición). Expone `recargar()` para
 * volver a pedir ambos después de una acción que los cambie (edición,
 * baja, traslado) sin duplicar la lógica de carga.
 */
export function useActivo(id) {
  const [activo, setActivo] = useState(null)
  const [movimientos, setMovimientos] = useState([])
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
        return Promise.all([
          activosService.obtenerActivoPorId(id),
          activosService.obtenerMovimientosPorActivo(id),
        ])
      })
      .then(([activoObtenido, movimientosObtenidos]) => {
        if (!vigente) return
        setActivo(activoObtenido)
        setMovimientos(movimientosObtenidos)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [id, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { activo, movimientos, cargando, recargar }
}
