import { useContext } from 'react'
import { ThemeContext } from '../context/themeContextObject'

export function useTema() {
  const contexto = useContext(ThemeContext)
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de un <ThemeProvider>')
  }
  return contexto
}
