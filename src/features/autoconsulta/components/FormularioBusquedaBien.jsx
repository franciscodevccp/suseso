import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import estilos from './FormularioBusquedaBien.module.css'

/** Buscador simple: folio, código de barras o RFID. */
export function FormularioBusquedaBien({ onBuscar, buscando }) {
  const [texto, setTexto] = useState('')

  function manejarEnvio(evento) {
    evento.preventDefault()
    onBuscar(texto)
  }

  return (
    <form onSubmit={manejarEnvio} className={estilos.formulario} noValidate>
      <input
        type="search"
        aria-label="Folio, código de barras o RFID del bien"
        placeholder="Ingrese folio, código de barras o RFID…"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        className={estilos.input}
      />
      <Button tipo="submit" anchoCompleto={false} disabled={buscando}>
        {buscando ? 'Buscando…' : 'Buscar'}
      </Button>
    </form>
  )
}
