import { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { TextField } from '../../../components/common/TextField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './ModalAccionActivo.module.css'

/**
 * Pide el motivo y confirma la baja de un activo (no lo borra, cambia su
 * estado). El estado de envío/error lo maneja quien la usa (FichaActivoPage),
 * mismo patrón que FormularioActivo.
 */
export function ModalBajaActivo({ activo, onCerrar, onConfirmar, enviando, error }) {
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState(null)

  function manejarEnvio(evento) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErrorMotivo('Indique el motivo de la baja.')
      return
    }
    setErrorMotivo(null)
    onConfirmar(motivo.trim())
  }

  return (
    <Modal titulo={`Dar de baja "${activo.nombre}"`} onCerrar={onCerrar}>
      <p className={estilos.descripcion}>
        El activo pasará a estado "Dado de baja" y quedará solo para
        consulta. Esta acción queda registrada en su historial.
      </p>
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}
        <TextField
          label="Motivo de la baja"
          required
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={errorMotivo}
        />
        <div className={estilos.acciones}>
          <Button variante="primario" anchoCompleto={false} tipo="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Confirmar baja'}
          </Button>
          <Button
            variante="secundario"
            anchoCompleto={false}
            tipo="button"
            onClick={onCerrar}
            disabled={enviando}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
