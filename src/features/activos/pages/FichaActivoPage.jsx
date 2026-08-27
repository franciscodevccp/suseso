import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { HistorialMovimientos } from '../components/HistorialMovimientos'
import { ModalBajaActivo } from '../components/ModalBajaActivo'
import { ModalTrasladoActivo } from '../components/ModalTrasladoActivo'
import { BloqueDepreciacion } from '../../depreciacion/components/BloqueDepreciacion'
import { useActivo } from '../hooks/useActivo'
import { useCatalogosActivos } from '../hooks/useCatalogosActivos'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarActivos } from '../utils/permisosActivos'
import { obtenerInfoEstado } from '../utils/estadoActivo'
import { obtenerMensajeErrorActivo } from '../constants/mensajesActivos'
import { formatearMoneda } from '../../../utils/formatoMoneda'
import * as activosService from '../services/activosService'
import estilos from './FichaActivoPage.module.css'

const formatearFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—')

function IconoFoto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 16l-5.5-5-4 4-2-2L3 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Ficha de detalle de un activo fijo: todos sus datos + historial de movimientos. */
export function FichaActivoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { activo, movimientos, cargando, recargar } = useActivo(id)
  const { ubicaciones } = useCatalogosActivos()

  const [modalAbierto, setModalAbierto] = useState(null) // null | 'baja' | 'traslado'
  const [enviandoAccion, setEnviandoAccion] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)

  if (cargando) {
    return <p className={estilos.cargando}>Cargando ficha…</p>
  }

  if (!activo) {
    return (
      <div className={estilos.noEncontrado}>
        <h1>Activo no encontrado</h1>
        <p>El activo que buscas no existe o fue eliminado.</p>
        <Link to="/activos-fijos">Volver al listado</Link>
      </div>
    )
  }

  const puedeGestionar = puedeGestionarActivos(usuario) && activo.estado !== 'dado_de_baja'

  function cerrarModal() {
    setModalAbierto(null)
    setErrorAccion(null)
  }

  async function confirmarBaja(motivo) {
    setErrorAccion(null)
    setEnviandoAccion(true)
    try {
      await activosService.darDeBajaActivo({ id, motivo, usuario: usuario.nombre })
      setModalAbierto(null)
      recargar()
    } catch (err) {
      setErrorAccion(obtenerMensajeErrorActivo(err.code))
    } finally {
      setEnviandoAccion(false)
    }
  }

  async function confirmarTraslado({ ubicacion, responsable, motivo }) {
    setErrorAccion(null)
    setEnviandoAccion(true)
    try {
      await activosService.trasladarActivo({ id, ubicacion, responsable, motivo, usuario: usuario.nombre })
      setModalAbierto(null)
      recargar()
    } catch (err) {
      setErrorAccion(obtenerMensajeErrorActivo(err.code))
    } finally {
      setEnviandoAccion(false)
    }
  }

  return (
    <div>
      <Button
        variante="secundario"
        anchoCompleto={false}
        className={estilos.botonVolver}
        onClick={() => navigate('/activos-fijos')}
      >
        ← Volver al listado
      </Button>

      <header className={estilos.encabezado}>
        <div className={estilos.foto} aria-hidden="true">
          {activo.foto ? <img src={activo.foto} alt="" /> : <IconoFoto />}
        </div>
        <div className={estilos.infoEncabezado}>
          <p className={estilos.folio}>{activo.folio}</p>
          <h1 className={estilos.nombre}>{activo.nombre}</h1>
        </div>
        <BadgeEstado {...obtenerInfoEstado(activo.estado)} />
      </header>

      {puedeGestionar && (
        <div className={estilos.acciones}>
          <Button
            variante="secundario"
            anchoCompleto={false}
            onClick={() => navigate(`/activos-fijos/${id}/editar`)}
          >
            Editar
          </Button>
          <Button variante="secundario" anchoCompleto={false} onClick={() => setModalAbierto('traslado')}>
            Trasladar
          </Button>
          <Button variante="secundario" anchoCompleto={false} onClick={() => setModalAbierto('baja')}>
            Dar de baja
          </Button>
        </div>
      )}

      <div className={estilos.grid}>
        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Datos generales</h2>
          <dl className={estilos.listaDatos}>
            <div>
              <dt>Descripción</dt>
              <dd>{activo.descripcion || '—'}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{activo.categoria}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{activo.ubicacion}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{activo.responsable}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{formatearMoneda(activo.valor)}</dd>
            </div>
            <div>
              <dt>Fecha de alta</dt>
              <dd>{formatearFecha(activo.fechaAlta)}</dd>
            </div>
            <div>
              <dt>Próxima mantención</dt>
              <dd>{activo.proximaMantencion ? formatearFecha(activo.proximaMantencion) : '—'}</dd>
            </div>
            <div>
              <dt>Fin de la garantía</dt>
              <dd>{activo.finGarantia ? formatearFecha(activo.finGarantia) : '—'}</dd>
            </div>
          </dl>
        </section>

        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Identificación</h2>
          <dl className={estilos.listaDatos}>
            <div>
              <dt>Código de barras</dt>
              <dd>{activo.codigoBarras || '—'}</dd>
            </div>
            <div>
              <dt>RFID</dt>
              <dd>{activo.rfid || '—'}</dd>
            </div>
          </dl>

          <h2 className={estilos.tituloSeccion}>Documentos</h2>
          {activo.documentos?.length > 0 ? (
            <ul className={estilos.listaDocumentos}>
              {activo.documentos.map((documento) => (
                <li key={documento.id}>{documento.nombre}</li>
              ))}
            </ul>
          ) : (
            <p className={estilos.vacioChico}>Sin documentos asociados aún.</p>
          )}
        </section>
      </div>

      <BloqueDepreciacion activo={activo} movimientos={movimientos} />

      <HistorialMovimientos movimientos={movimientos} />

      {/* El historial es lo que le pasó al bien; la auditoría, quién hizo
          qué en el sistema (docs/05): son dos cosas distintas. */}
      <p>
        <Link to={`/auditoria?folio=${activo.folio}`}>Ver este activo en la auditoría</Link>
      </p>

      {modalAbierto === 'baja' && (
        <ModalBajaActivo
          activo={activo}
          onCerrar={cerrarModal}
          onConfirmar={confirmarBaja}
          enviando={enviandoAccion}
          error={errorAccion}
        />
      )}

      {modalAbierto === 'traslado' && (
        <ModalTrasladoActivo
          activo={activo}
          ubicaciones={ubicaciones}
          onCerrar={cerrarModal}
          onConfirmar={confirmarTraslado}
          enviando={enviandoAccion}
          error={errorAccion}
        />
      )}
    </div>
  )
}
