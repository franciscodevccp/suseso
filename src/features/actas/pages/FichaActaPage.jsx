import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { ModalConfirmarFirma } from '../components/ModalConfirmarFirma'
import { useActa } from '../hooks/useActa'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActas } from '../utils/permisosActas'
import { obtenerInfoEstadoFirma } from '../utils/estadoActa'
import { obtenerMensajeErrorActa } from '../constants/mensajesActas'
import * as actasService from '../mock/actasService.mock'
import estilos from './FichaActaPage.module.css'

const ETIQUETA_TIPO = { recepcion: 'Recepción', entrega: 'Entrega' }

const formatearFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** Agrupa el hash en bloques de 8 caracteres, para que se lea como un sello. */
const formatearSello = (sello) => sello.match(/.{1,8}/g).join(' ')

/** Ficha de un acta: sus datos, y la acción/estado de firma electrónica. */
export function FichaActaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { acta, cargando, recargar } = useActa(id)

  const [modalFirmaAbierto, setModalFirmaAbierto] = useState(false)
  const [enviandoFirma, setEnviandoFirma] = useState(false)
  const [errorFirma, setErrorFirma] = useState(null)

  if (cargando) {
    return <p className={estilos.cargando}>Cargando acta…</p>
  }

  if (!acta) {
    return (
      <div className={estilos.noEncontrada}>
        <h1>Acta no encontrada</h1>
        <p>El acta que buscas no existe.</p>
        <Link to="/actas-y-firma">Volver al listado</Link>
      </div>
    )
  }

  const puedeFirmar = puedeGestionarActas(usuario) && acta.estadoFirma === 'pendiente'

  async function confirmarFirma() {
    setErrorFirma(null)
    setEnviandoFirma(true)
    try {
      await actasService.firmarActa(id, usuario.nombre)
      setModalFirmaAbierto(false)
      recargar()
    } catch (err) {
      setErrorFirma(obtenerMensajeErrorActa(err.code))
    } finally {
      setEnviandoFirma(false)
    }
  }

  return (
    <div>
      <Button
        variante="secundario"
        anchoCompleto={false}
        className={estilos.botonVolver}
        onClick={() => navigate('/actas-y-firma')}
      >
        ← Volver al listado
      </Button>

      <header className={estilos.encabezado}>
        <div>
          <p className={estilos.folio}>{acta.folio}</p>
          <h1 className={estilos.nombre}>{ETIQUETA_TIPO[acta.tipo] ?? acta.tipo}</h1>
        </div>
        <BadgeEstado {...obtenerInfoEstadoFirma(acta.estadoFirma)} />
      </header>

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Datos del acta</h2>
        <dl className={estilos.listaDatos}>
          <div>
            <dt>Tipo</dt>
            <dd>{ETIQUETA_TIPO[acta.tipo] ?? acta.tipo}</dd>
          </div>
          <div>
            <dt>Activo asociado</dt>
            <dd>
              {acta.activoId ? (
                <Link to={`/activos-fijos/${acta.activoId}`}>
                  {acta.activoFolio} — {acta.activoNombre}
                </Link>
              ) : (
                'Sin activo asociado'
              )}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{acta.responsable}</dd>
          </div>
        </dl>
        <h2 className={estilos.tituloSeccion}>Contenido</h2>
        <p className={estilos.contenido}>{acta.contenido}</p>
      </section>

      {acta.estadoFirma === 'firmada' ? (
        <section className={estilos.tarjetaFirma}>
          <h2 className={estilos.tituloSeccion}>Firma electrónica</h2>
          <dl className={estilos.listaDatos}>
            <div>
              <dt>Firmante</dt>
              <dd>{acta.firmante}</dd>
            </div>
            <div>
              <dt>Fecha de firma</dt>
              <dd>{formatearFechaHora(acta.fechaFirma)}</dd>
            </div>
          </dl>
          <p className={estilos.etiquetaSello}>Sello de verificación</p>
          <p className={estilos.sello}>{formatearSello(acta.selloVerificacion)}</p>
          <p className={estilos.notaLey}>
            Firma electrónica representativa con fines de demostración. En
            producción se integra con un proveedor de firma electrónica
            avanzada acreditado, conforme a la Ley 19.799.
          </p>
        </section>
      ) : (
        puedeFirmar && (
          <section className={estilos.tarjetaFirma}>
            <h2 className={estilos.tituloSeccion}>Firma electrónica</h2>
            <p className={estilos.vacioChico}>Esta acta todavía no ha sido firmada.</p>
            <Button anchoCompleto={false} onClick={() => setModalFirmaAbierto(true)}>
              Firmar electrónicamente
            </Button>
          </section>
        )
      )}

      {modalFirmaAbierto && (
        <ModalConfirmarFirma
          acta={acta}
          usuario={usuario}
          onCerrar={() => {
            setModalFirmaAbierto(false)
            setErrorFirma(null)
          }}
          onConfirmar={confirmarFirma}
          enviando={enviandoFirma}
          error={errorFirma}
        />
      )}
    </div>
  )
}
