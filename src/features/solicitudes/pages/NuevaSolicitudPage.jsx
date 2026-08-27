import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import * as solicitudesService from '../services/solicitudesService'
import estilos from './NuevaSolicitudPage.module.css'

/**
 * "Nueva solicitud" del portal (docs/11): catálogo del almacén con stock
 * visible (sin costos), cantidad por ítem y observación. Si la cantidad
 * supera el stock se avisa pero no se bloquea: la aprobación decide.
 */
export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const [catalogo, setCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cantidades, setCantidades] = useState({})
  const [observacion, setObservacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    solicitudesService
      .obtenerCatalogo()
      .then((filas) => vigente && setCatalogo(filas))
      .catch(() => vigente && setError('No fue posible cargar el catálogo del almacén.'))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  const seleccionados = useMemo(
    () =>
      catalogo
        .map((item) => ({ item, cantidad: Number(cantidades[item.id] ?? 0) }))
        .filter((fila) => fila.cantidad >= 1),
    [catalogo, cantidades],
  )

  const sobreStock = seleccionados.filter((fila) => fila.cantidad > fila.item.stock)

  function cambiarCantidad(id, valor) {
    setCantidades((previas) => ({ ...previas, [id]: valor }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (seleccionados.length === 0) {
      setError('Indique la cantidad de al menos un ítem.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const creada = await solicitudesService.crearSolicitud({
        items: seleccionados.map(({ item, cantidad }) => ({ itemId: item.id, cantidad })),
        observacion: observacion.trim(),
      })
      navigate(`/autoconsulta/solicitudes/${creada.id}`, { replace: true })
    } catch {
      setError('No fue posible enviar la solicitud. Intente nuevamente.')
      setEnviando(false)
    }
  }

  return (
    <div>
      <Link to="/autoconsulta/solicitudes" className={estilos.volver}>
        ← Volver a mis solicitudes
      </Link>
      <h1 className={estilos.titulo}>Nueva solicitud</h1>
      <p className={estilos.subtitulo}>
        Indique la cantidad que necesita de cada ítem y envíe la solicitud para su aprobación.
      </p>

      {error && <Alert tipo="error">{error}</Alert>}

      {cargando ? (
        <p className={estilos.cargando}>Cargando el catálogo…</p>
      ) : (
        <form onSubmit={enviar}>
          <section className={estilos.tarjeta}>
            <h2 className={estilos.tituloSeccion}>Catálogo del almacén</h2>
            <div className={estilos.contenedorTabla}>
              <table className={estilos.tabla}>
                <thead>
                  <tr>
                    <th scope="col">Ítem</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Cantidad a solicitar</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogo.map((item) => (
                    <tr key={item.id} className={estilos.fila}>
                      <td data-etiqueta="Ítem">{item.nombre}</td>
                      <td data-etiqueta="Categoría">{item.categoria}</td>
                      <td data-etiqueta="Disponible">
                        {item.stock} {item.unidad}
                        {item.stock === 0 && <span className={estilos.sinStock}> (sin stock)</span>}
                      </td>
                      <td data-etiqueta="Cantidad">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          className={estilos.cantidad}
                          value={cantidades[item.id] ?? ''}
                          onChange={(evento) => cambiarCantidad(item.id, evento.target.value)}
                          aria-label={`Cantidad de ${item.nombre}`}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {sobreStock.length > 0 && (
            <Alert tipo="advertencia">
              {sobreStock
                .map(
                  ({ item, cantidad }) =>
                    `"${item.nombre}": solicita ${cantidad} y hay ${item.stock} disponibles`,
                )
                .join('; ')}
              . Puede enviar igual; quien apruebe decidirá.
            </Alert>
          )}

          <section className={estilos.tarjeta}>
            <label className={estilos.campoObservacion}>
              <span className={estilos.tituloSeccion}>Observación (opcional)</span>
              <textarea
                rows={3}
                value={observacion}
                onChange={(evento) => setObservacion(evento.target.value)}
                placeholder="Ej.: insumos para la oficina de partes"
              />
            </label>
          </section>

          <div className={estilos.acciones}>
            <Button tipo="submit" anchoCompleto={false} disabled={enviando || seleccionados.length === 0}>
              {enviando ? 'Enviando…' : `Enviar solicitud${seleccionados.length > 0 ? ` (${seleccionados.length} ítem${seleccionados.length > 1 ? 's' : ''})` : ''}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
