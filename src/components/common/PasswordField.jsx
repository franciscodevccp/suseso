import { useId, useState } from 'react'
import estilos from './PasswordField.module.css'
import camposTexto from './TextField.module.css'

/** Campo de clave con botón para mostrar/ocultar el texto ingresado. */
export function PasswordField({ label, error, hint, id, ...resto }) {
  const [visible, setVisible] = useState(false)
  const idGenerado = useId()
  const inputId = id ?? idGenerado
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={camposTexto.campo}>
      <label htmlFor={inputId} className={camposTexto.etiqueta}>
        {label}
      </label>
      <div className={estilos.envoltura}>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`${camposTexto.input} ${estilos.input} ${error ? camposTexto.conError : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...resto}
        />
        <button
          type="button"
          className={estilos.alternar}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {hint && (
        <p id={hintId} className={camposTexto.pista}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={camposTexto.mensajeError} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
