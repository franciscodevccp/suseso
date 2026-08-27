import estilos from './PasswordRequirements.module.css'

const REQUISITOS = [
  { clave: 'longitudMinima', texto: 'Mínimo 8 caracteres' },
  { clave: 'tieneMayuscula', texto: 'Una letra mayúscula' },
  { clave: 'tieneMinuscula', texto: 'Una letra minúscula' },
  { clave: 'tieneNumero', texto: 'Un número' },
  { clave: 'tieneSimbolo', texto: 'Un símbolo (ej. !@#$%)' },
]

/** Checklist de requisitos de clave, actualizado en tiempo real. */
export function PasswordRequirements({ reglas }) {
  return (
    <ul className={estilos.lista} aria-live="polite">
      {REQUISITOS.map(({ clave, texto }) => {
        const cumplido = reglas[clave]
        return (
          <li
            key={clave}
            className={`${estilos.item} ${cumplido ? estilos.cumplido : ''}`}
          >
            <span className={estilos.icono} aria-hidden="true">
              {cumplido ? '✓' : '•'}
            </span>
            <span>
              {texto}
              <span className={estilos.soloLector}>
                {cumplido ? ' (cumplido)' : ' (pendiente)'}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
