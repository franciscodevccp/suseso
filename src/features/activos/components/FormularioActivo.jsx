import { useState } from 'react'
import { CampoFecha } from '../../../components/common/CampoFecha'
import { TextField } from '../../../components/common/TextField'
import { SelectField } from '../../../components/common/SelectField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './FormularioActivo.module.css'
import camposTexto from '../../../components/common/TextField.module.css'

const VALORES_VACIOS = {
  nombre: '',
  descripcion: '',
  categoria: '',
  ubicacion: '',
  responsable: '',
  valor: '',
  codigoBarras: '',
  rfid: '',
  proximaMantencion: '',
  finGarantia: '',
}

function validar(valores) {
  const errores = {}
  if (!valores.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!valores.categoria) errores.categoria = 'Seleccione una categoría.'
  if (!valores.ubicacion) errores.ubicacion = 'Seleccione una ubicación.'
  if (valores.valor !== '' && (Number.isNaN(Number(valores.valor)) || Number(valores.valor) < 0)) {
    errores.valor = 'Ingrese un valor numérico válido (0 o más).'
  }
  return errores
}

/**
 * Formulario compartido por alta y edición de activos. El folio no se
 * pide: se genera solo en el mock al crear. `valoresIniciales` se toma
 * como estado inicial una sola vez — quien use este formulario para
 * editar debe esperar a que el activo ya esté cargado antes de montarlo.
 */
export function FormularioActivo({
  valoresIniciales = VALORES_VACIOS,
  categorias,
  ubicaciones,
  enviando,
  error,
  textoBoton,
  onEnviar,
  onCancelar,
}) {
  const [valores, setValores] = useState(valoresIniciales)
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

        <div className={estilos.completo}>
          <div className={camposTexto.campo}>
            <label htmlFor="descripcion-activo" className={camposTexto.etiqueta}>
              Descripción
            </label>
            <textarea
              id="descripcion-activo"
              className={camposTexto.input}
              rows={3}
              value={valores.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            />
          </div>
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

        <TextField
          label="Responsable"
          value={valores.responsable}
          onChange={(e) => actualizarCampo('responsable', e.target.value)}
        />

        <TextField
          label="Valor (CLP)"
          type="number"
          min="0"
          step="1"
          value={valores.valor}
          onChange={(e) => actualizarCampo('valor', e.target.value)}
          error={errores.valor}
        />

        <TextField
          label="Código de barras"
          value={valores.codigoBarras}
          onChange={(e) => actualizarCampo('codigoBarras', e.target.value)}
        />

        <TextField
          label="RFID"
          value={valores.rfid}
          onChange={(e) => actualizarCampo('rfid', e.target.value)}
        />

        {/* Mantención y garantía (RQ-17, docs/07): alimentan las alertas. */}
        <div className={camposTexto.campo}>
          <label htmlFor="proxima-mantencion" className={camposTexto.etiqueta}>
            Próxima mantención (opcional)
          </label>
          <CampoFecha
            id="proxima-mantencion"
            placeholder="Sin mantención programada"
            value={valores.proximaMantencion}
            onChange={(e) => actualizarCampo('proximaMantencion', e.target.value)}
            className={camposTexto.input}
          />
        </div>

        <div className={camposTexto.campo}>
          <label htmlFor="fin-garantia" className={camposTexto.etiqueta}>
            Fin de la garantía (opcional)
          </label>
          <CampoFecha
            id="fin-garantia"
            placeholder="Sin garantía registrada"
            value={valores.finGarantia}
            onChange={(e) => actualizarCampo('finGarantia', e.target.value)}
            className={camposTexto.input}
          />
        </div>
      </div>

      <div className={estilos.acciones}>
        <Button tipo="submit" anchoCompleto={false} disabled={enviando}>
          {enviando ? 'Guardando…' : textoBoton}
        </Button>
        <Button variante="secundario" anchoCompleto={false} tipo="button" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
