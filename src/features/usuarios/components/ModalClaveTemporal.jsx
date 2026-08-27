import { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { Button } from '../../../components/common/Button'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import estilos from './ModalUsuario.module.css'

/**
 * Muestra la clave temporal recién generada, UNA sola vez (docs/04): el
 * servidor no la guarda en texto y no hay forma de volver a verla — si se
 * pierde, se restablece de nuevo. En el primer ingreso el sistema exige
 * cambiarla.
 */
export function ModalClaveTemporal({ usuario, claveTemporal, onCerrar }) {
  const [copiada, setCopiada] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(claveTemporal)
      setCopiada(true)
    } catch {
      setCopiada(false)
    }
  }

  return (
    <Modal titulo={`Clave temporal de ${usuario.nombre}`} onCerrar={onCerrar}>
      <p>
        Entregue esta clave junto con el correo <strong>{usuario.email}</strong>. Se muestra una
        sola vez; en el primer ingreso el sistema pedirá cambiarla.
      </p>
      <BloqueCodigo>{claveTemporal}</BloqueCodigo>
      <div className={estilos.acciones}>
        <Button variante="primario" anchoCompleto={false} tipo="button" onClick={copiar}>
          {copiada ? 'Copiada ✓' : 'Copiar clave'}
        </Button>
        <Button variante="secundario" anchoCompleto={false} tipo="button" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
