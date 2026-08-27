import { useEffect, useState } from 'react'
import * as dashboardService from '../services/dashboardService'

/** Orquesta las llamadas mock del panel de control en paralelo. */
export function useDashboardResumen() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    Promise.all([
      dashboardService.obtenerResumenIndicadores(),
      dashboardService.obtenerDistribucionPorEstado(),
      dashboardService.obtenerActivosPorCategoria(),
      dashboardService.obtenerActividadReciente(),
    ]).then(([indicadores, distribucionEstado, activosPorCategoria, actividadReciente]) => {
      if (!vigente) return
      setDatos({ indicadores, distribucionEstado, activosPorCategoria, actividadReciente })
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [])

  return { datos, cargando }
}
