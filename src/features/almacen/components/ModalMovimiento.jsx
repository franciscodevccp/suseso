import { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { TextField } from '../../../components/common/TextField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './ModalMovimiento.module.css'

const TITULOS = { ingreso: 'Registrar ingreso', egreso: 'Registrar egreso' }

/**
 * Un único modal para registrar tanto ingresos como egresos, según `tipo`.
 * Para egreso valida en cliente que no supere el stock disponible (el mock
 * vuelve a validarlo igual, como resguardo). El estado de envío/error lo
 * maneja quien lo usa (FichaItemPage), mismo patrón que ModalBajaActivo.
 */
export function ModalMovimiento({ item, tipo, onCerrar, onConfirmar, enviando, error }) {
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erroresCampo, setErroresCampo] = useState({})

  function manejarEnvio(evento) {
    evento.preventDefault()
    const cantidadNumero = Number(cantidad)
    const errores = {}

    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
      errores.cantidad = 'Ingrese una cantidad válida, mayor a 0.'
    } else if (tipo === 'egreso' && cantidadNumero > item.stock) {
      errores.cantidad = `No puede egresar más de lo disponible (${item.stock} ${item.unidad}).`
    }
    if (!motivo.trim()) {
      errores.motivo = 'Indique el motivo del movimiento.'
    }

    setErroresCampo(errores)
    if (Object.keys(errores).length > 0) return
    onConfirmar({ cantidad: cantidadNumero, motivo: motivo.trim() })
  }

  return (
    <Modal titulo={`${TITULOS[tipo]} · ${item.nombre}`} onCerrar={onCerrar}>
      {tipo === 'egreso' && (
        <p className={estilos.descripcion}>
          Stock disponible: {item.stock} {item.unidad}
        </p>
      )}
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}
        <TextField
          label="Cantidad"
          type="number"
          min="1"
          step="1"
          required
          autoFocus
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          error={erroresCampo.cantidad}
        />
        <TextField
          label="Motivo"
          required
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={erroresCampo.motivo}
        />
        <div className={estilos.acciones}>
          <Button variante="primario" anchoCompleto={false} tipo="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Confirmar'}
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
