import { useId } from 'react'
import estilos from './TextField.module.css'

export function TextField({ label, error, hint, id, ...resto }) {
  const idGenerado = useId()
  const inputId = id ?? idGenerado
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={estilos.campo}>
      <label htmlFor={inputId} className={estilos.etiqueta}>
        {label}
      </label>
      <input
        id={inputId}
        className={`${estilos.input} ${error ? estilos.conError : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...resto}
      />
      {hint && (
        <p id={hintId} className={estilos.pista}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={estilos.mensajeError} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
