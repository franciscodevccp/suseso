import { useEffect, useState } from 'react'
import * as activosService from '../../activos/services/activosService'
import { useAuth } from '../../auth/hooks/useAuth'

/** Activos cuyo responsable es el usuario en sesión ("Mis bienes"). */
export function useMisBienes() {
  const { usuario } = useAuth()
  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    activosService.buscarActivos({ responsable: usuario.nombre }).then((resultado) => {
      if (!vigente) return
      setActivos(resultado)
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [usuario.nombre])

  return { activos, cargando }
}
