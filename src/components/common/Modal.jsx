import { useEffect, useId, useRef } from 'react'
import estilos from './Modal.module.css'

/**
 * Overlay + diálogo genérico para acciones cancelables (a diferencia de
 * SessionExpiryModal, que es intencionalmente "forzado" y no se cierra
 * con click afuera/Escape por ser de seguridad). Cierra con click en el
 * fondo o tecla Escape, y enfoca el diálogo al abrir.
 */
export function Modal({ titulo, onCerrar, children }) {
  const idTitulo = useId()
  const dialogoRef = useRef(null)

  useEffect(() => {
    dialogoRef.current?.focus()

    function manejarTecla(evento) {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [onCerrar])

  return (
    <div
      className={estilos.fondo}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div
        className={estilos.dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={dialogoRef}
        tabIndex={-1}
      >
        <h2 id={idTitulo} className={estilos.titulo}>
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  )
}
