import { Link } from 'react-router-dom'
import { formatearMoneda } from '../../../utils/formatoMoneda'
import { useVidaUtilCategoria } from '../hooks/useVidaUtilCategoria'
import { calcularDepreciacion } from '../utils/calculoDepreciacion'
import estilos from './BloqueDepreciacion.module.css'

const formatearFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—')

/**
 * Bloque de depreciación (método lineal) para la ficha de un activo.
 * Reutiliza `activo`/`movimientos` ya cargados por FichaActivoPage — no
 * vuelve a pedirlos.
 */
export function BloqueDepreciacion({ activo, movimientos }) {
  const { vidaUtilAnios, cargando } = useVidaUtilCategoria(activo.categoria)

  if (cargando) {
    return (
      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Depreciación</h2>
        <p className={estilos.mensaje}>Calculando…</p>
      </section>
    )
  }

  if (!activo.valor) {
    return (
      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Depreciación</h2>
        <p className={estilos.mensaje}>
          Este activo no tiene un valor de adquisición registrado, por lo que no es posible calcular
          su depreciación.
        </p>
      </section>
    )
  }

  if (!vidaUtilAnios) {
    return (
      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Depreciación</h2>
        <p className={estilos.mensaje}>
          La categoría "{activo.categoria}" no tiene una vida útil configurada.{' '}
          <Link to="/configuracion/vida-util">Configúrela aquí</Link> para calcular la depreciación.
        </p>
      </section>
    )
  }

  const movimientoBaja = movimientos.find((movimiento) => movimiento.tipo === 'baja')
  const fechaCorte =
    activo.estado === 'dado_de_baja' && movimientoBaja ? movimientoBaja.fecha : undefined

  const resultado = calcularDepreciacion({
    valor: activo.valor,
    fechaAlta: activo.fechaAlta,
    vidaUtilAnios,
    fechaCorte,
  })

  const filaResaltada = Math.min(resultado.aniosTranscurridos, vidaUtilAnios)

  return (
    <section className={estilos.tarjeta}>
      <h2 className={estilos.tituloSeccion}>Depreciación (método lineal)</h2>

      {activo.estado === 'dado_de_baja' && movimientoBaja && (
        <p className={estilos.notaBaja}>
          La depreciación se detuvo el {formatearFecha(movimientoBaja.fecha)} al darse de baja el
          activo.
        </p>
      )}

      <dl className={estilos.resumen}>
        <div>
          <dt>Valor de adquisición</dt>
          <dd>{formatearMoneda(activo.valor)}</dd>
        </div>
        <div>
          <dt>Vida útil aplicada</dt>
          <dd>{vidaUtilAnios} años</dd>
        </div>
        <div>
          <dt>Depreciación anual</dt>
          <dd>{formatearMoneda(resultado.depreciacionAnual)}</dd>
        </div>
        <div>
          <dt>Depreciación acumulada</dt>
          <dd>{formatearMoneda(resultado.depreciacionAcumulada)}</dd>
        </div>
      </dl>

      <div className={estilos.valorLibroDestacado}>
        <p className={estilos.etiquetaValorLibro}>Valor libro actual</p>
        <p className={estilos.valorLibro}>{formatearMoneda(resultado.valorLibro)}</p>
      </div>

      <h3 className={estilos.tituloEvolucion}>Evolución año a año</h3>
      <div className={estilos.contenedorTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Año</th>
              <th scope="col">Depreciación del año</th>
              <th scope="col">Depreciación acumulada</th>
              <th scope="col">Valor libro</th>
            </tr>
          </thead>
          <tbody>
            {resultado.tablaEvolucion.map((fila) => (
              <tr
                key={fila.anio}
                className={fila.anio === filaResaltada ? estilos.filaActual : undefined}
              >
                <td>{fila.anio}</td>
                <td>{formatearMoneda(fila.depreciacionDelAnio)}</td>
                <td>{formatearMoneda(fila.depreciacionAcumulada)}</td>
                <td>{formatearMoneda(fila.valorLibro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={estilos.notaReferencial}>
        Cálculo referencial (método lineal), según la vida útil configurada para la categoría "
        {activo.categoria}". Ajuste la vida útil en{' '}
        <Link to="/configuracion/vida-util">Configuración</Link> según la normativa vigente de su
        organismo.
      </p>
    </section>
  )
}
