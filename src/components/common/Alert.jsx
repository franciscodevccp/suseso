import estilos from './Alert.module.css'

/** Mensaje del sistema (error/éxito/advertencia), anunciado por lectores de pantalla. */
export function Alert({ tipo = 'error', children }) {
  return (
    <div
      className={`${estilos.alerta} ${estilos[tipo]}`}
      role="alert"
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  )
}
