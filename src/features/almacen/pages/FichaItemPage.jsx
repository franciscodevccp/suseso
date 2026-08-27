import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { HistorialMovimientosAlmacen } from '../components/HistorialMovimientosAlmacen'
import { ModalMovimiento } from '../components/ModalMovimiento'
import { useItem } from '../hooks/useItem'
import { useAuth } from '../../auth/hooks/useAuth'
import { puedeGestionarAlmacen } from '../utils/permisosAlmacen'
import { obtenerInfoStock } from '../utils/estadoStock'
import { obtenerMensajeErrorAlmacen } from '../constants/mensajesAlmacen'
import * as almacenService from '../services/almacenService'
import { SolicitudesDelItem } from '../components/SolicitudesDelItem'
import estilos from './FichaItemPage.module.css'

/** Ficha de detalle de un ítem de bodega: stock actual + historial de movimientos. */
export function FichaItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { item, movimientos, cargando, recargar } = useItem(id)

  const [modalAbierto, setModalAbierto] = useState(null) // null | 'ingreso' | 'egreso'
  const [enviandoAccion, setEnviandoAccion] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)

  if (cargando) {
    return <p className={estilos.cargando}>Cargando ficha…</p>
  }

  if (!item) {
    return (
      <div className={estilos.noEncontrado}>
        <h1>Ítem no encontrado</h1>
        <p>El ítem que buscas no existe o fue eliminado.</p>
        <Link to="/almacen">Volver al listado</Link>
      </div>
    )
  }

  const puedeGestionar = puedeGestionarAlmacen(usuario)

  function cerrarModal() {
    setModalAbierto(null)
    setErrorAccion(null)
  }

  async function confirmarMovimiento({ cantidad, motivo }) {
    setErrorAccion(null)
    setEnviandoAccion(true)
    try {
      await almacenService.registrarMovimiento(id, {
        tipo: modalAbierto,
        cantidad,
        motivo,
        usuario: usuario.nombre,
      })
      setModalAbierto(null)
      recargar()
    } catch (err) {
      setErrorAccion(obtenerMensajeErrorAlmacen(err.code))
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
        onClick={() => navigate('/almacen')}
      >
        ← Volver al listado
      </Button>

      <header className={estilos.encabezado}>
        <div className={estilos.infoEncabezado}>
          <p className={estilos.folio}>{item.folio}</p>
          <h1 className={estilos.nombre}>{item.nombre}</h1>
        </div>
        <BadgeEstado {...obtenerInfoStock(item)} />
      </header>

      {puedeGestionar && (
        <div className={estilos.acciones}>
          <Button variante="secundario" anchoCompleto={false} onClick={() => setModalAbierto('ingreso')}>
            Registrar ingreso
          </Button>
          <Button variante="secundario" anchoCompleto={false} onClick={() => setModalAbierto('egreso')}>
            Registrar egreso
          </Button>
        </div>
      )}

      <div className={estilos.grid}>
        <section className={estilos.tarjetaStock}>
          <p className={estilos.etiquetaStock}>Stock actual</p>
          <p className={estilos.valorStock}>
            {item.stock} <span className={estilos.unidadStock}>{item.unidad}</span>
          </p>
          <p className={estilos.referenciaMinimo}>
            Stock mínimo: {item.stockMinimo} {item.unidad}
          </p>
        </section>

        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Datos generales</h2>
          <dl className={estilos.listaDatos}>
            <div>
              <dt>Categoría</dt>
              <dd>{item.categoria}</dd>
            </div>
            <div>
              <dt>Unidad</dt>
              <dd>{item.unidad}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{item.ubicacion}</dd>
            </div>
          </dl>
        </section>
      </div>

      <HistorialMovimientosAlmacen movimientos={movimientos} unidad={item.unidad} />

      {/* Solicitudes del portal que incluyen este ítem (docs/11). */}
      <SolicitudesDelItem itemId={id} />

      {modalAbierto && (
        <ModalMovimiento
          item={item}
          tipo={modalAbierto}
          onCerrar={cerrarModal}
          onConfirmar={confirmarMovimiento}
          enviando={enviandoAccion}
          error={errorAccion}
        />
      )}
    </div>
  )
}
