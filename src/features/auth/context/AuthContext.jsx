import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../mock/authService.mock'
import { AuthContext } from './authContextObject'

/**
 * Estado global de sesión del módulo de acceso. Al reemplazar la capa mock
 * por una API real, solo cambia la implementación de `authService`; el
 * contrato que expone este provider permanece igual.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  const refrescarSesion = useCallback(async () => {
    const sesion = await authService.obtenerSesionActual()
    setUsuario(sesion?.usuario ?? null)
    return sesion?.usuario ?? null
  }, [])

  useEffect(() => {
    let vigente = true

    authService.obtenerSesionActual().then((sesion) => {
      if (!vigente) return
      setUsuario(sesion?.usuario ?? null)
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [])

  const login = useCallback(async (credenciales) => {
    const resultado = await authService.login(credenciales)
    setUsuario(resultado.usuario)
    return resultado
  }, [])

  const logout = useCallback(async () => {
    await authService.cerrarSesion()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      estaAutenticado: Boolean(usuario),
      cargando,
      login,
      logout,
      refrescarSesion,
    }),
    [usuario, cargando, login, logout, refrescarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
