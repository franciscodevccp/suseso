import { useEffect, useState } from 'react'
import * as solicitudesService from '../services/solicitudesService'

/**
 * Solicitudes pendientes para el badge del Sidebar (docs/11), refrescado
 * cada 60 s como el de alertas. `habilitado` evita consultas para el rol
 * Funcionario, que no ve la bandeja.
 */
export function useResumenSolicitudes(habilitado) {
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    if (!habilitado) return undefined
    let vigente = true

    function consultar() {
      solicitudesService
        .obtenerResumenSolicitudes()
        .then((resumen) => {
          if (vigente) setPendientes(resumen.pendientes)
        })
        .catch(() => {
          // El badge nunca rompe la navegación: en error se queda como está.
        })
    }

    consultar()
    const idIntervalo = setInterval(consultar, 60_000)
    return () => {
      vigente = false
      clearInterval(idIntervalo)
    }
  }, [habilitado])

  return { pendientes }
}
