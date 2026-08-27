import { useEffect, useState } from 'react'
import * as alertasService from '../services/alertasService'

/**
 * Total de alertas vigentes para el badge del Sidebar, refrescado cada
 * 60 segundos (docs/07). `habilitado` evita consultas para el rol
 * Funcionario, que no ve el módulo.
 */
export function useResumenAlertas(habilitado) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!habilitado) return undefined
    let vigente = true

    function consultar() {
      alertasService
        .obtenerResumenAlertas()
        .then((resumen) => {
          if (vigente) setTotal(resumen.total)
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

  return { total }
}
