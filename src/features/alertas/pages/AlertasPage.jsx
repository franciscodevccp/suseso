import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { Desplegable } from '../../../components/common/Desplegable'
import { BotonesExportacion } from '../../reportes/components/BotonesExportacion'
import { etiquetaTipo, infoSeveridad, SEVERIDADES, TIPOS_ALERTA } from '../utils/etiquetasAlertas'
import * as alertasService from '../services/alertasService'
import estilos from './AlertasPage.module.css'

const COLUMNAS_EXPORT = [
  { clave: 'severidad', etiqueta: 'Severidad' },
  { clave: 'tipo', etiqueta: 'Tipo' },
  { clave: 'titulo', etiqueta: 'Alerta' },
  { clave: 'detalle', etiqueta: 'Detalle' },
  { clave: 'fecha', etiqueta: 'Fecha' },
]

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')

/** Alertas de mantenciones, garantías, stock y solicitudes (RQ-17, docs/07). */
export function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('')

  useEffect(() => {
    let vigente = true
    alertasService.obtenerAlertas().then((resultado) => {
      if (!vigente) return
      setAlertas(resultado)
      setCargando(false)
    })
    return () => {
      vigente = false
    }
  }, [])

  const filtradas = alertas.filter(
    (alerta) =>
      (!filtroTipo || alerta.tipo === filtroTipo) &&
      (!filtroSeveridad || alerta.severidad === filtroSeveridad),
  )

  const filasExport = filtradas.map((alerta) => ({
    severidad: infoSeveridad(alerta.severidad).etiqueta,
    tipo: etiquetaTipo(alerta.tipo),
    titulo: alerta.titulo,
    detalle: alerta.detalle,
    fecha: formatearFecha(alerta.fecha),
  }))

  return (
    <div>
      <h1 className={estilos.titulo}>Alertas</h1>
      <p className={estilos.subtitulo}>
        Mantenciones, garantías, stock y solicitudes que requieren atención.
      </p>

      <div className={estilos.filtros}>
        <Desplegable
          aria-label="Filtrar por tipo"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className={estilos.filtro}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_ALERTA.map((tipo) => (
            <option key={tipo.valor} value={tipo.valor}>
              {tipo.etiqueta}
            </option>
          ))}
        </Desplegable>

        <Desplegable
          aria-label="Filtrar por severidad"
          value={filtroSeveridad}
          onChange={(e) => setFiltroSeveridad(e.target.value)}
          className={estilos.filtro}
        >
          <option value="">Todas las severidades</option>
          {SEVERIDADES.map((severidad) => (
            <option key={severidad.valor} value={severidad.valor}>
              {severidad.etiqueta}
            </option>
          ))}
        </Desplegable>
      </div>

      <BotonesExportacion
        titulo="Alertas vigentes"
        prefijoArchivo="alertas"
        columnas={COLUMNAS_EXPORT}
        filas={filasExport}
        deshabilitado={cargando || filasExport.length === 0}
      />

      {cargando ? (
        <p className={estilos.cargando}>Buscando alertas…</p>
      ) : filtradas.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensajeVacio}>No hay alertas vigentes</p>
          <p className={estilos.detalleVacio}>
            Las mantenciones próximas, garantías por vencer y quiebres de stock aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className={estilos.contenedorTabla}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Severidad</th>
                <th scope="col">Alerta</th>
                <th scope="col">Detalle</th>
                <th scope="col">Fecha</th>
                <th scope="col">Ir a</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((alerta) => (
                <tr key={`${alerta.tipo}-${alerta.entidadId}`} className={estilos.fila}>
                  <td data-etiqueta="Severidad">
                    <BadgeEstado {...infoSeveridad(alerta.severidad)} />
                  </td>
                  <td data-etiqueta="Alerta">{alerta.titulo}</td>
                  <td data-etiqueta="Detalle" className={estilos.detalle}>
                    {alerta.detalle}
                  </td>
                  <td data-etiqueta="Fecha">{formatearFecha(alerta.fecha)}</td>
                  <td data-etiqueta="Ir a">
                    <Link to={alerta.enlace} className={estilos.enlace}>
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
