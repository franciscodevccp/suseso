import { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { TextField } from '../../../components/common/TextField'
import { SelectField } from '../../../components/common/SelectField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './ModalAccionActivo.module.css'

/**
 * Traslada un activo a otra ubicación y/o responsable, con motivo
 * opcional. Mismo patrón que ModalBajaActivo: el estado de envío/error lo
 * maneja FichaActivoPage.
 */
export function ModalTrasladoActivo({ activo, ubicaciones, onCerrar, onConfirmar, enviando, error }) {
  const [ubicacion, setUbicacion] = useState(activo.ubicacion)
  const [responsable, setResponsable] = useState(activo.responsable)
  const [motivo, setMotivo] = useState('')

  function manejarEnvio(evento) {
    evento.preventDefault()
    onConfirmar({ ubicacion, responsable, motivo: motivo.trim() })
  }

  return (
    <Modal titulo={`Trasladar "${activo.nombre}"`} onCerrar={onCerrar}>
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}

        <SelectField
          label="Nueva ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        >
          {ubicaciones.map((opcion) => (
            <option key={opcion.id} value={opcion.nombre}>
              {opcion.nombre}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Nuevo responsable"
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
        />

        <TextField
          label="Motivo del traslado (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />

        <div className={estilos.acciones}>
          <Button variante="primario" anchoCompleto={false} tipo="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Confirmar traslado'}
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
