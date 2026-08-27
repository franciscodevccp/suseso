import { useMemo } from 'react'
import { evaluarClave } from '../utils/passwordRules'

/** Evalúa las reglas de la clave en tiempo real conforme el usuario escribe. */
export function usePasswordRules(clave) {
  return useMemo(() => evaluarClave(clave), [clave])
}
