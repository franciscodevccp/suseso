import { useState } from 'react'
import { TextField } from '../../../components/common/TextField'
import { SelectField } from '../../../components/common/SelectField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './FormularioItem.module.css'

const VALORES_VACIOS = {
  nombre: '',
  categoria: '',
  unidad: '',
  stock: '0',
  stockMinimo: '0',
  ubicacion: '',
}

function validar(valores) {
  const errores = {}
  if (!valores.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!valores.categoria) errores.categoria = 'Seleccione una categoría.'
  if (!valores.unidad) errores.unidad = 'Seleccione una unidad.'
  if (!valores.ubicacion) errores.ubicacion = 'Seleccione una ubicación.'
  if (Number.isNaN(Number(valores.stock)) || Number(valores.stock) < 0) {
    errores.stock = 'Ingrese un stock inicial válido (0 o más).'
  }
  if (Number.isNaN(Number(valores.stockMinimo)) || Number(valores.stockMinimo) < 0) {
    errores.stockMinimo = 'Ingrese un stock mínimo válido (0 o más).'
  }
  return errores
}

/** Formulario de alta de un ítem de bodega. El folio no se pide: se genera solo en el mock. */
export function FormularioItem({ categorias, ubicaciones, unidades, enviando, error, onEnviar, onCancelar }) {
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
        <div className={estilos.completo}>
          <TextField
            label="Nombre"
            required
            autoFocus
            value={valores.nombre}
            onChange={(e) => actualizarCampo('nombre', e.target.value)}
            error={errores.nombre}
          />
        </div>

        <SelectField
          label="Categoría"
          required
          value={valores.categoria}
          onChange={(e) => actualizarCampo('categoria', e.target.value)}
          error={errores.categoria}
        >
          <option value="">Seleccione una categoría</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.nombre}>
              {categoria.nombre}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Unidad"
          required
          value={valores.unidad}
          onChange={(e) => actualizarCampo('unidad', e.target.value)}
          error={errores.unidad}
        >
          <option value="">Seleccione una unidad</option>
          {unidades.map((unidad) => (
            <option key={unidad.id} value={unidad.nombre}>
              {unidad.nombre}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Stock inicial"
          type="number"
          min="0"
          step="1"
          value={valores.stock}
          onChange={(e) => actualizarCampo('stock', e.target.value)}
          error={errores.stock}
        />

        <TextField
          label="Stock mínimo"
          type="number"
          min="0"
          step="1"
          value={valores.stockMinimo}
          onChange={(e) => actualizarCampo('stockMinimo', e.target.value)}
          error={errores.stockMinimo}
          hint="Umbral bajo el cual se mostrará la alerta de reposición."
        />

        <SelectField
          label="Ubicación"
          required
          value={valores.ubicacion}
          onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
          error={errores.ubicacion}
        >
          <option value="">Seleccione una ubicación</option>
          {ubicaciones.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.nombre}>
              {ubicacion.nombre}
            </option>
          ))}
        </SelectField>
      </div>

      <div className={estilos.acciones}>
        <Button tipo="submit" anchoCompleto={false} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear ítem'}
        </Button>
        <Button variante="secundario" anchoCompleto={false} tipo="button" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
