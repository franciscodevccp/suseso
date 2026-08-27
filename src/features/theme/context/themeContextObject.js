import { createContext } from 'react'

export const ThemeContext = createContext(null)

/** Las tres opciones que el usuario puede elegir (ver selector en MenuPerfil). */
export const OPCIONES_TEMA = ['claro', 'oscuro', 'automatico']
