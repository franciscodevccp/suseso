import { useEffect, useState } from 'react'
import * as activosService from '../../activos/mock/activosService.mock'

/**
 * Activos elegibles para vincular a un acta (todos menos los dados de
 * baja). Cruza a la capa mock de activos desde la UI de actas — el mock
 * de actas en sí no depende de activosService.
 */
export function useActivosDisponibles() {
  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    activosService.buscarActivos().then((todos) => {
      if (!vigente) return
      setActivos(todos.filter((activo) => activo.estado !== 'dado_de_baja'))
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [])

  return { activos, cargando }
}
