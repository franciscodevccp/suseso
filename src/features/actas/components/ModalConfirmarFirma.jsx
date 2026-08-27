import { Modal } from '../../../components/common/Modal'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './ModalConfirmarFirma.module.css'

/**
 * Confirma la firma electrónica de un acta. El estado de envío/error lo
 * maneja quien la usa (FichaActaPage), mismo patrón que los modales de
 * activos.
 */
export function ModalConfirmarFirma({ acta, usuario, onCerrar, onConfirmar, enviando, error }) {
  return (
    <Modal titulo={`Firmar electrónicamente "${acta.folio}"`} onCerrar={onCerrar}>
      {error && <Alert tipo="error">{error}</Alert>}
      <p className={estilos.descripcion}>
        Va a firmar esta acta como <strong>{usuario.nombre}</strong>. Se
        generará un sello de verificación y quedará marcada como
        "Firmada"; esta acción no se puede deshacer.
      </p>
      <p className={estilos.nota}>
        Firma electrónica representativa con fines de demostración. En
        producción se integra con un proveedor de firma electrónica
        avanzada acreditado, conforme a la Ley 19.799.
      </p>
      <div className={estilos.acciones}>
        <Button
          variante="primario"
          anchoCompleto={false}
          onClick={onConfirmar}
          disabled={enviando}
        >
          {enviando ? 'Firmando…' : 'Confirmar firma'}
        </Button>
        <Button variante="secundario" anchoCompleto={false} onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
