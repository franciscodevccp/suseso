import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { Alert } from '../../../components/common/Alert'
import { ModalCerrarActa } from '../components/ModalCerrarActa'
import { useActa } from '../hooks/useActa'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActas } from '../utils/permisosActas'
import { obtenerInfoEstadoActa } from '../utils/estadoActa'
import { obtenerMensajeErrorActa } from '../constants/mensajesActas'
import * as actasService from '../services/actasService'
import estilos from './FichaActaPage.module.css'

const ETIQUETA_TIPO = { recepcion: 'Recepción', entrega: 'Entrega' }

const formatearFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** Agrupa el hash en bloques de 8 caracteres, para que se lea como un sello. */
const formatearSello = (sello) => sello.match(/.{1,8}/g).join(' ')

/** Ficha de un acta: sus datos, el cierre y el sello de integridad. */
export function FichaActaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { acta, cargando, recargar } = useActa(id)

  const [modalCierreAbierto, setModalCierreAbierto] = useState(false)
  const [enviandoCierre, setEnviandoCierre] = useState(false)
  const [errorCierre, setErrorCierre] = useState(null)
  const [verificacion, setVerificacion] = useState(null) // { valido: boolean }
  const [verificando, setVerificando] = useState(false)

  if (cargando) {
    return <p className={estilos.cargando}>Cargando acta…</p>
  }

  if (!acta) {
    return (
      <div className={estilos.noEncontrada}>
        <h1>Acta no encontrada</h1>
        <p>El acta que buscas no existe.</p>
        <Link to="/actas">Volver al listado</Link>
      </div>
    )
  }

  const puedeCerrar = puedeGestionarActas(usuario) && acta.estado === 'pendiente'

  async function confirmarCierre() {
    setErrorCierre(null)
    setEnviandoCierre(true)
    try {
      await actasService.cerrarActa(id)
      setModalCierreAbierto(false)
      recargar()
    } catch (err) {
      setErrorCierre(obtenerMensajeErrorActa(err.code))
    } finally {
      setEnviandoCierre(false)
    }
  }

  async function verificarIntegridad() {
    setVerificando(true)
    setVerificacion(null)
    try {
      setVerificacion(await actasService.verificarIntegridad(id))
    } catch {
      setVerificacion({ valido: false })
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div>
      <Button
        variante="secundario"
        anchoCompleto={false}
        className={estilos.botonVolver}
        onClick={() => navigate('/actas')}
      >
        ← Volver al listado
      </Button>

      <header className={estilos.encabezado}>
        <div>
          <p className={estilos.folio}>{acta.folio}</p>
          <h1 className={estilos.nombre}>{ETIQUETA_TIPO[acta.tipo] ?? acta.tipo}</h1>
        </div>
        <BadgeEstado {...obtenerInfoEstadoActa(acta.estado)} />
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

      {acta.estado === 'cerrada' ? (
        <section className={estilos.tarjetaFirma}>
          <h2 className={estilos.tituloSeccion}>Sello de integridad</h2>
          <dl className={estilos.listaDatos}>
            <div>
              <dt>Cerrada por</dt>
              <dd>{acta.cerradaPor}</dd>
            </div>
            <div>
              <dt>Fecha de cierre</dt>
              <dd>{formatearFechaHora(acta.fechaCierre)}</dd>
            </div>
          </dl>
          <p className={estilos.etiquetaSello}>Sello de integridad (SHA-256)</p>
          <p className={estilos.sello}>{formatearSello(acta.selloIntegridad)}</p>

          {verificacion &&
            (verificacion.valido ? (
              <Alert tipo="exito">
                Integridad verificada: el contenido no fue modificado desde el cierre.
              </Alert>
            ) : (
              <Alert tipo="error">
                El sello no coincide: el contenido pudo ser modificado después del cierre.
              </Alert>
            ))}

          <Button
            variante="secundario"
            anchoCompleto={false}
            onClick={verificarIntegridad}
            disabled={verificando}
          >
            {verificando ? 'Verificando…' : 'Verificar integridad'}
          </Button>

          <p className={estilos.notaLey}>
            El sello permite comprobar que el contenido del acta no cambió desde su cierre.
          </p>
        </section>
      ) : (
        puedeCerrar && (
          <section className={estilos.tarjetaFirma}>
            <h2 className={estilos.tituloSeccion}>Cierre del acta</h2>
            <p className={estilos.vacioChico}>
              Esta acta está pendiente. Al cerrarla se genera su sello de integridad.
            </p>
            <Button anchoCompleto={false} onClick={() => setModalCierreAbierto(true)}>
              Cerrar acta
            </Button>
          </section>
        )
      )}

      {modalCierreAbierto && (
        <ModalCerrarActa
          acta={acta}
          usuario={usuario}
          onCerrar={() => {
            setModalCierreAbierto(false)
            setErrorCierre(null)
          }}
          onConfirmar={confirmarCierre}
          enviando={enviandoCierre}
          error={errorCierre}
        />
      )}
    </div>
  )
}
