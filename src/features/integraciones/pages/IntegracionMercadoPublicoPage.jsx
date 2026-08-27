import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { Button } from '../../../components/common/Button'
import { Desplegable } from '../../../components/common/Desplegable'
import { formatearMoneda } from '../../../utils/formatoMoneda'
import { useAuth } from '../../auth/hooks/useAuth'
import * as activosService from '../../activos/services/activosService'
import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import * as integracionesService from '../services/integracionesService'
import estilos from './IntegracionMercadoPublicoPage.module.css'

// Mismo formato que valida el servidor (docs/10): 1002-355-SE26.
const FORMATO_CODIGO_OC = /^[0-9]{3,8}-[0-9]{1,5}-[A-Z]{2}[0-9]{2}$/

const ROLES_GESTION = ['Administrador', 'Gestor de Activos']

const MENSAJES_ERROR = {
  CODIGO_OC_INVALIDO: 'El código no tiene el formato de una orden de compra (ej.: 1002-355-SE26).',
  OC_NO_ENCONTRADA: 'Mercado Público no tiene una orden de compra con ese código.',
  MP_NO_DISPONIBLE: 'Mercado Público no respondió. Intente nuevamente en unos minutos.',
  NO_AUTORIZADO: 'Su rol no permite esta acción.',
}

const formatearFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—')
const formatearFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

/**
 * Consulta de órdenes de compra REALES de mercadopublico.cl (AD-02 —
 * docs/10): el servidor consulta la API pública con el ticket
 * institucional (que nunca llega al navegador), cachea cada orden y esta
 * pantalla trabaja contra ese caché. La consulta en vivo respeta la pausa
 * de 16-20 s que exige el servicio externo, y así se muestra.
 */
export function IntegracionMercadoPublicoPage() {
  const { usuario } = useAuth()
  const puedeGestionar = ROLES_GESTION.includes(usuario?.rol)

  const [codigo, setCodigo] = useState('')
  const [orden, setOrden] = useState(null)
  const [historial, setHistorial] = useState([])
  const [consultando, setConsultando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [activos, setActivos] = useState([])
  const [activoId, setActivoId] = useState('')
  const [vinculando, setVinculando] = useState(false)

  useEffect(() => {
    let vigente = true
    integracionesService
      .obtenerHistorialOrdenes()
      .then((filas) => vigente && setHistorial(filas))
      .catch(() => {})
    if (puedeGestionar) {
      activosService
        .buscarActivos({})
        .then((filas) => vigente && setActivos(filas.filter((a) => a.estado !== 'dado_de_baja')))
        .catch(() => {})
    }
    return () => {
      vigente = false
    }
  }, [puedeGestionar])

  function errorLegible(error) {
    return MENSAJES_ERROR[error?.code] ?? 'No fue posible completar la consulta.'
  }

  async function consultar(evento) {
    evento.preventDefault()
    const limpio = codigo.trim().toUpperCase()
    if (!FORMATO_CODIGO_OC.test(limpio)) {
      setMensaje({ tipo: 'error', texto: MENSAJES_ERROR.CODIGO_OC_INVALIDO })
      return
    }
    setConsultando(true)
    setMensaje(null)
    setOrden(null)
    try {
      const resultado = await integracionesService.consultarOrdenCompra(limpio)
      setOrden(resultado)
      setHistorial(await integracionesService.obtenerHistorialOrdenes().catch(() => historial))
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorLegible(error) })
    } finally {
      setConsultando(false)
    }
  }

  async function sincronizar() {
    setSincronizando(true)
    setMensaje(null)
    try {
      const resultado = await integracionesService.sincronizarOrdenCompra(orden.codigo)
      setOrden(resultado)
      setHistorial(await integracionesService.obtenerHistorialOrdenes().catch(() => historial))
      setMensaje({ tipo: 'exito', texto: 'Orden sincronizada desde Mercado Público.' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorLegible(error) })
    } finally {
      setSincronizando(false)
    }
  }

  async function vincular(evento) {
    evento.preventDefault()
    if (!activoId) return
    setVinculando(true)
    setMensaje(null)
    try {
      await integracionesService.vincularOrdenCompra(activoId, orden.codigo)
      const activo = activos.find((a) => a.id === activoId)
      setMensaje({
        tipo: 'exito',
        texto: `Orden ${orden.codigo} vinculada al activo ${activo?.folio ?? ''}. Queda visible en su ficha.`,
      })
      setActivoId('')
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorLegible(error) })
    } finally {
      setVinculando(false)
    }
  }

  function verDelHistorial(fila) {
    setCodigo(fila.codigo)
    setOrden({ ...fila, origen: 'cache' })
    setMensaje(null)
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>Órdenes de compra reales de mercadopublico.cl.</p>

      <SubNavIntegraciones />

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Consultar una orden de compra</h2>
        <p className={estilos.descripcion}>
          El servidor consulta la API pública de Mercado Público con el ticket institucional, guarda
          cada orden en un caché local y responde desde ahí. Si la orden no está en el caché, la
          consulta en vivo puede tardar hasta 20 segundos: es la pausa que exige el servicio
          externo entre llamadas.
        </p>

        <form className={estilos.formularioConsulta} onSubmit={consultar}>
          <input
            type="text"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="Código de la orden (ej.: 1002-355-SE26)"
            aria-label="Código de la orden de compra"
            className={estilos.entradaCodigo}
          />
          <Button type="submit" anchoCompleto={false} disabled={consultando || !codigo.trim()}>
            {consultando ? 'Consultando…' : 'Consultar'}
          </Button>
        </form>
        {consultando && (
          <p className={estilos.notaEspera}>
            Consultando… si la orden no está en el caché local, la respuesta en vivo puede tardar
            unos 20 segundos.
          </p>
        )}
      </section>

      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}

      {orden && (
        <section className={estilos.tarjeta}>
          <div className={estilos.encabezadoOrden}>
            <h2 className={estilos.tituloSeccion}>Orden {orden.codigo}</h2>
            <BadgeEstado
              etiqueta={orden.origen === 'en_vivo' ? 'Consultada en vivo' : 'Caché local'}
              tono={orden.origen === 'en_vivo' ? 'exito' : 'neutro'}
            />
          </div>

          <dl className={estilos.datosOrden}>
            <div>
              <dt>Nombre</dt>
              <dd>{orden.nombre ?? '—'}</dd>
            </div>
            <div>
              <dt>Proveedor</dt>
              <dd>{orden.proveedor ?? '—'}</dd>
            </div>
            <div>
              <dt>Estado en Mercado Público</dt>
              <dd>{orden.estado ?? '—'}</dd>
            </div>
            <div>
              <dt>Monto total</dt>
              <dd>{orden.monto == null ? '—' : formatearMoneda(orden.monto)}</dd>
            </div>
            <div>
              <dt>Fecha de creación</dt>
              <dd>{formatearFecha(orden.fecha)}</dd>
            </div>
            <div>
              <dt>Última sincronización</dt>
              <dd>{formatearFechaHora(orden.sincronizadaEn)}</dd>
            </div>
          </dl>

          {orden.items.length > 0 && (
            <div className={estilos.tablaContenedor}>
              <table className={estilos.tabla}>
                <caption className={estilos.tituloTabla}>Ítems de la orden</caption>
                <thead>
                  <tr>
                    <th>Ítem</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Precio unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.items.map((item, indice) => (
                    <tr key={indice}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad ?? '—'}</td>
                      <td>{item.unidad ?? '—'}</td>
                      <td>{item.precioUnitario == null ? '—' : formatearMoneda(item.precioUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {puedeGestionar && (
            <div className={estilos.acciones}>
              <div className={estilos.grupoAccion}>
                <p className={estilos.etiquetaAccion} id="etiqueta-vincular">
                  Vincular a un activo
                </p>
                <form className={estilos.filaVincular} onSubmit={vincular}>
                  <Desplegable
                    aria-labelledby="etiqueta-vincular"
                    value={activoId}
                    onChange={(evento) => setActivoId(evento.target.value)}
                    className={estilos.selectorActivo}
                  >
                    <option value="">Seleccione un activo…</option>
                    {activos.map((activo) => (
                      <option key={activo.id} value={activo.id}>
                        {activo.folio} — {activo.nombre}
                      </option>
                    ))}
                  </Desplegable>
                  <Button type="submit" anchoCompleto={false} disabled={!activoId || vinculando}>
                    {vinculando ? 'Vinculando…' : 'Vincular'}
                  </Button>
                </form>
              </div>

              <div className={estilos.grupoAccion}>
                <p className={estilos.etiquetaAccion}>Actualizar desde el origen</p>
                <Button
                  variante="secundario"
                  anchoCompleto={false}
                  onClick={sincronizar}
                  disabled={sincronizando}
                >
                  {sincronizando ? 'Sincronizando… (hasta 20 s)' : 'Sincronizar desde Mercado Público'}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Órdenes consultadas</h2>
        {historial.length === 0 ? (
          <p className={estilos.descripcion}>Aún no se consultan órdenes de compra.</p>
        ) : (
          <div className={estilos.tablaContenedor}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Sincronizada</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {historial.map((fila) => (
                  <tr key={fila.codigo}>
                    <td>{fila.codigo}</td>
                    <td>{fila.proveedor ?? '—'}</td>
                    <td>{fila.monto == null ? '—' : formatearMoneda(fila.monto)}</td>
                    <td>{formatearFechaHora(fila.sincronizadaEn)}</td>
                    <td>
                      <button
                        type="button"
                        className={estilos.botonVer}
                        onClick={() => verDelHistorial(fila)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className={estilos.notaHonestidad}>
        Las órdenes provienen de la API pública real de mercadopublico.cl, consultada con el ticket
        institucional de demostración. El ticket se administra en el servidor y nunca se expone al
        navegador.
      </p>
    </div>
  )
}
