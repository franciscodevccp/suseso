import { useState } from 'react'
import estilos from './CampoEscaneo.module.css'

/**
 * Campo para lector de código de barras o RFID (RQ-20, docs/08): un
 * lector USB escribe como teclado y termina con Enter, así que un input
 * con autofoco basta — y se demuestra tipeando, sin lector físico.
 *
 * `onEscanear(codigo)` resuelve la búsqueda y navega; devuelve `false`
 * si el código no existe. `accionAlta` (opcional) ofrece dar de alta un
 * activo con ese código.
 */
export function CampoEscaneo({ onEscanear, accionAlta, placeholder }) {
  const [codigo, setCodigo] = useState('')
  const [noEncontrado, setNoEncontrado] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const limpio = codigo.trim()
    if (!limpio || buscando) return
    setBuscando(true)
    setNoEncontrado('')
    const encontrado = await onEscanear(limpio)
    if (!encontrado) setNoEncontrado(limpio)
    setBuscando(false)
    setCodigo('')
  }

  return (
    <div className={estilos.contenedor}>
      <form className={estilos.formulario} onSubmit={manejarEnvio}>
        <span className={estilos.icono} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 8v8M10.5 8v8M13 8v8M16.5 8v8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="text"
          className={estilos.entrada}
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value)}
          // Además del submit implícito del formulario: algunos lectores
          // emiten el Enter como tecla cruda sin submission implícita.
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') manejarEnvio(evento)
          }}
          placeholder={placeholder ?? 'Escanear o escribir código y presionar Enter'}
          aria-label="Escanear o escribir un código"
          autoFocus
        />
      </form>
      {noEncontrado && (
        <p className={estilos.noEncontrado} role="status">
          Código "{noEncontrado}" no registrado.
          {accionAlta && (
            <button type="button" className={estilos.botonAlta} onClick={() => accionAlta(noEncontrado)}>
              Dar de alta con este código
            </button>
          )}
        </p>
      )}
    </div>
  )
}
