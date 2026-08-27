import { Modal } from '../../../components/common/Modal'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './ModalCerrarActa.module.css'

/**
 * Confirma el cierre de un acta (docs/13, D-03). El estado de envío y el
 * error los maneja quien lo usa (FichaActaPage), mismo patrón que los
 * modales de activos.
 */
export function ModalCerrarActa({ acta, usuario, onCerrar, onConfirmar, enviando, error }) {
  return (
    <Modal titulo={`Cerrar acta ${acta.folio}`} onCerrar={onCerrar}>
      {error && <Alert tipo="error">{error}</Alert>}
      <p className={estilos.descripcion}>
        Va a cerrar esta acta como <strong>{usuario.nombre}</strong>. Al cerrar el acta se genera
        un sello de integridad (SHA-256) que permite verificar que su contenido no fue modificado.
        Esta acción no se puede deshacer.
      </p>
      <div className={estilos.acciones}>
        <Button variante="primario" anchoCompleto={false} onClick={onConfirmar} disabled={enviando}>
          {enviando ? 'Cerrando…' : 'Cerrar acta'}
        </Button>
        <Button variante="secundario" anchoCompleto={false} onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
