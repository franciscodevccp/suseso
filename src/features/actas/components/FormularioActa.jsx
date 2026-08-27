import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TextField } from '../../../components/common/TextField'
import { SelectField } from '../../../components/common/SelectField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './FormularioActa.module.css'
import camposTexto from '../../../components/common/TextField.module.css'

const VALORES_VACIOS = { tipo: 'recepcion', activoId: '', responsable: '', contenido: '' }

function validar(valores) {
  const errores = {}
  if (!valores.responsable.trim()) errores.responsable = 'El responsable es obligatorio.'
  if (!valores.contenido.trim()) errores.contenido = 'Describa el contenido del acta.'
  return errores
}

/** Formulario de creación de actas (recepción/entrega), sin edición posterior. */
export function FormularioActa({ activosDisponibles, enviando, error, onEnviar, onCancelar }) {
  const [valores, setValores] = useState(VALORES_VACIOS)
  const [errores, setErrores] = useState({})

  function actualizarCampo(campo, valor) {
    setValores((anterior) => ({ ...anterior, [campo]: valor }))
  }

  function manejarEnvio(evento) {
    evento.preventDefault()
    const erroresEncontrados = validar(valores)
    setErrores(erroresEncontrados)
    if (Object.keys(erroresEncontrados).length > 0) return
    onEnviar(valores)
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      {error && <Alert tipo="error">{error}</Alert>}

      <div className={estilos.grid}>
        <SelectField
          label="Tipo de acta"
          value={valores.tipo}
          onChange={(e) => actualizarCampo('tipo', e.target.value)}
        >
          <option value="recepcion">Recepción</option>
          <option value="entrega">Entrega</option>
        </SelectField>

        <TextField
          label="Responsable"
          required
          value={valores.responsable}
          onChange={(e) => actualizarCampo('responsable', e.target.value)}
          error={errores.responsable}
        />

        <div className={estilos.completo}>
          <SelectField
            label="Activo asociado (opcional)"
            value={valores.activoId}
            onChange={(e) => actualizarCampo('activoId', e.target.value)}
          >
            <option value="">Sin activo asociado</option>
            {activosDisponibles.map((activo) => (
              <option key={activo.id} value={activo.id}>
                {activo.folio} — {activo.nombre}
              </option>
            ))}
          </SelectField>
          {activosDisponibles.length === 0 && (
            <p className={estilos.aviso}>
              Aún no hay activos registrados. Puedes crear el acta sin vincularla a uno, o{' '}
              <Link to="/activos-fijos/nuevo">crear un activo primero</Link>.
            </p>
          )}
        </div>

        <div className={estilos.completo}>
          <div className={camposTexto.campo}>
            <label htmlFor="contenido-acta" className={camposTexto.etiqueta}>
              Contenido del acta
            </label>
            <textarea
              id="contenido-acta"
              className={`${camposTexto.input} ${errores.contenido ? camposTexto.conError : ''}`}
              rows={5}
              value={valores.contenido}
              onChange={(e) => actualizarCampo('contenido', e.target.value)}
              aria-invalid={Boolean(errores.contenido)}
            />
            {errores.contenido && (
              <p className={camposTexto.mensajeError} role="alert">
                {errores.contenido}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={estilos.acciones}>
        <Button tipo="submit" anchoCompleto={false} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear acta'}
        </Button>
        <Button variante="secundario" anchoCompleto={false} tipo="button" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
