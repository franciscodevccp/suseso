import { useCallback, useEffect, useMemo, useState } from 'react'
import { OPCIONES_TEMA, ThemeContext } from './themeContextObject'

const CLAVE_ALMACENAMIENTO = 'sisga_tema'

function leerPreferenciaGuardada() {
  const guardada = localStorage.getItem(CLAVE_ALMACENAMIENTO)
  return OPCIONES_TEMA.includes(guardada) ? guardada : 'automatico'
}

function prefiereOscuroElSistema() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Resuelve la preferencia (claro/oscuro/automático) al valor concreto que
 * necesita el CSS. Misma lógica que el script inline de index.html — ese
 * script solo cubre el primer pintado; de ahí en adelante este contexto
 * manda (incluyendo reaccionar en vivo si cambia el tema del sistema
 * mientras la preferencia es "automático").
 */
function resolverEsOscuro(preferencia) {
  return preferencia === 'oscuro' || (preferencia === 'automatico' && prefiereOscuroElSistema())
}

function aplicarAlDocumento(preferencia) {
  document.documentElement.setAttribute('data-tema', resolverEsOscuro(preferencia) ? 'oscuro' : 'claro')
}

/** Provee y persiste la preferencia de tema de toda la aplicación. */
export function ThemeProvider({ children }) {
  const [preferencia, setPreferencia] = useState(leerPreferenciaGuardada)

  useEffect(() => {
    aplicarAlDocumento(preferencia)
    localStorage.setItem(CLAVE_ALMACENAMIENTO, preferencia)
  }, [preferencia])

  // Si la preferencia es "automático", reacciona en tiempo real si el
  // usuario cambia el tema de su sistema operativo sin recargar la app.
  useEffect(() => {
    if (preferencia !== 'automatico') return undefined

    const medios = window.matchMedia('(prefers-color-scheme: dark)')
    function manejarCambio() {
      aplicarAlDocumento('automatico')
    }

    medios.addEventListener('change', manejarCambio)
    return () => medios.removeEventListener('change', manejarCambio)
  }, [preferencia])

  const establecerPreferencia = useCallback((nuevaPreferencia) => {
    setPreferencia(nuevaPreferencia)
  }, [])

  const valor = useMemo(
    () => ({ preferencia, establecerPreferencia }),
    [preferencia, establecerPreferencia],
  )

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}
