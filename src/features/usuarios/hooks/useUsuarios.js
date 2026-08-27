import { useCallback, useEffect, useState } from 'react'
import * as usuariosService from '../services/usuariosService'

/** Listado del módulo Usuarios, con recargar() tras cada acción. */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return usuariosService.obtenerUsuarios()
      })
      .then((resultado) => {
        if (!vigente) return
        setUsuarios(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { usuarios, cargando, recargar }
}
