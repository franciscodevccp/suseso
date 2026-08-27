import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { CampoArchivo } from '../../../components/common/CampoArchivo'
import { Desplegable } from '../../../components/common/Desplegable'
import { SubNavConfiguracion } from '../components/SubNavConfiguracion'
import * as configuracionService from '../services/configuracionService'
import estilos from './ImportarPlanillaPage.module.css'

const ETIQUETA_DESTINO = {
  codigoBarras: 'Código de barras',
  nombre: 'Nombre del bien',
  descripcion: 'Descripción',
  ubicacion: 'Ubicación',
  categoria: 'Categoría',
  valor: 'Valor contable',
  fechaAlta: 'Fecha de alta',
  responsable: 'Responsable',
  numero_serie: 'Número de serie (campo personalizado)',
  ignorar: 'No importar esta columna',
}

/**
 * Configuración → Importar planilla (RQ-24, criterio B.3 — docs/12):
 * tres pasos: subir la planilla "Vista General", revisar el mapeo y la
 * validación, y confirmar la importación con reporte descargable.
 */
export function ImportarPlanillaPage() {
  const [archivo, setArchivo] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [previsualizacion, setPrevisualizacion] = useState(null)
  const [mapeo, setMapeo] = useState({})
  const [confirmando, setConfirmando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  async function analizar() {
    if (!archivo) return
    setAnalizando(true)
    setError('')
    try {
      const respuesta = await configuracionService.previsualizarImportacion(archivo)
      setPrevisualizacion(respuesta)
      setMapeo(respuesta.mapeoSugerido)
    } catch {
      setError('No fue posible analizar la planilla. Verifique que sea un archivo .xlsx válido.')
    } finally {
      setAnalizando(false)
    }
  }

  async function confirmar() {
    setConfirmando(true)
    setError('')
    try {
      const respuesta = await configuracionService.confirmarImportacion({
        idPrevisualizacion: previsualizacion.idPrevisualizacion,
        mapeo,
      })
      setResultado(respuesta)
    } catch (err) {
      setError(
        err?.codigo === 'PREVISUALIZACION_EXPIRADA' || err?.code === 'PREVISUALIZACION_EXPIRADA'
          ? 'La previsualización expiró (30 minutos): vuelva a subir la planilla.'
          : 'No fue posible completar la importación.',
      )
    } finally {
      setConfirmando(false)
    }
  }

  function reiniciar() {
    setArchivo(null)
    setPrevisualizacion(null)
    setMapeo({})
    setResultado(null)
    setError('')
  }

  const paso = resultado ? 3 : previsualizacion ? 2 : 1

  return (
    <div>
      <h1 className={estilos.titulo}>Configuración</h1>
      <p className={estilos.subtitulo}>
        Importar la planilla "Vista General" para la carga inicial de activos.
      </p>

      <SubNavConfiguracion />

      <ol className={estilos.pasos} aria-label="Pasos de la importación">
        {['Subir la planilla', 'Revisar mapeo y validación', 'Resultado'].map((etiqueta, i) => (
          <li key={etiqueta} className={paso === i + 1 ? estilos.pasoActivo : estilos.paso}>
            {i + 1}. {etiqueta}
          </li>
        ))}
      </ol>

      {error && <Alert tipo="error">{error}</Alert>}

      {paso === 1 && (
        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Planilla Excel (.xlsx, hasta 20 MB)</h2>
          <p className={estilos.descripcion}>
            La primera fila debe traer los encabezados (código, nombre, ubicación, valor…). El
            sistema propone el mapeo de columnas y usted lo confirma en el paso siguiente.
          </p>
          <div className={estilos.filaSubir}>
            <CampoArchivo
              archivo={archivo}
              accept=".xlsx"
              aria-label="Planilla Vista General"
              onSeleccionar={setArchivo}
            />
            <Button anchoCompleto={false} onClick={analizar} disabled={!archivo || analizando}>
              {analizando ? 'Analizando…' : 'Analizar planilla'}
            </Button>
          </div>
        </section>
      )}

      {paso === 2 && (
        <>
          <section className={estilos.tarjeta}>
            <h2 className={estilos.tituloSeccion}>
              Mapeo de columnas — {previsualizacion.totalFilas.toLocaleString('es-CL')} filas
            </h2>
            <div className={estilos.mapeo}>
              {previsualizacion.columnas.map((columna) => (
                <label key={columna} className={estilos.filaMapeo}>
                  <span className={estilos.nombreColumna}>{columna}</span>
                  <Desplegable
                    value={mapeo[columna] ?? 'ignorar'}
                    onChange={(evento) => setMapeo((previo) => ({ ...previo, [columna]: evento.target.value }))}
                    aria-label={`Destino de la columna ${columna}`}
                    className={estilos.selectorDestino}
                  >
                    {Object.entries(ETIQUETA_DESTINO).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </Desplegable>
                </label>
              ))}
            </div>
          </section>

          <section className={estilos.tarjeta}>
            <h2 className={estilos.tituloSeccion}>Validación</h2>
            <ul className={estilos.resumen}>
              <li>
                <strong>{previsualizacion.validacion.validas.toLocaleString('es-CL')}</strong> filas listas para importar
              </li>
              <li>
                <strong>{previsualizacion.validacion.conObservaciones}</strong> con observaciones (se importan igual)
              </li>
              <li>
                <strong>{previsualizacion.validacion.errores.length}</strong> observaciones y errores detallados
              </li>
              {previsualizacion.ubicacionesNuevas.length > 0 && (
                <li>
                  Se crearán {previsualizacion.ubicacionesNuevas.length} ubicación(es) nueva(s)
                </li>
              )}
              {previsualizacion.categoriasNuevas.length > 0 && (
                <li>Se crearán {previsualizacion.categoriasNuevas.length} categoría(s) nueva(s)</li>
              )}
            </ul>
            {previsualizacion.validacion.errores.length > 0 && (
              <div className={estilos.errores}>
                {previsualizacion.validacion.errores.slice(0, 50).map((fila, i) => (
                  <p key={i}>
                    Fila {fila.fila} ({fila.columna}): {fila.motivo}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className={estilos.tarjeta}>
            <h2 className={estilos.tituloSeccion}>Muestra (primeras filas)</h2>
            <div className={estilos.contenedorMuestra}>
              <table className={estilos.muestra}>
                <thead>
                  <tr>
                    {previsualizacion.columnas.map((columna) => (
                      <th key={columna}>{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previsualizacion.muestra.slice(0, 8).map((fila, i) => (
                    <tr key={i}>
                      {fila.map((celda, j) => (
                        <td key={j}>{celda}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className={estilos.acciones}>
            <Button variante="secundario" anchoCompleto={false} onClick={reiniciar}>
              Volver a empezar
            </Button>
            <Button anchoCompleto={false} onClick={confirmar} disabled={confirmando}>
              {confirmando ? 'Importando…' : `Confirmar importación (${previsualizacion.validacion.validas.toLocaleString('es-CL')} filas)`}
            </Button>
          </div>
        </>
      )}

      {paso === 3 && (
        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Importación completada</h2>
          <ul className={estilos.resumen}>
            <li>
              <strong>{resultado.creados.toLocaleString('es-CL')}</strong> activos creados con folio correlativo
            </li>
            <li>
              <strong>{resultado.omitidos}</strong> filas omitidas
            </li>
            <li>
              Duración: <strong>{(resultado.duracionMs / 1000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} s</strong>
            </li>
          </ul>
          <div className={estilos.acciones}>
            <a className={estilos.enlaceReporte} href={resultado.reporteUrl} download>
              Descargar reporte (Excel)
            </a>
            <Link to="/activos-fijos" className={estilos.enlaceReporte}>
              Ver activos (los importados quedan al final, con folios correlativos)
            </Link>
            <Button variante="secundario" anchoCompleto={false} onClick={reiniciar}>
              Importar otra planilla
            </Button>
          </div>
        </section>
      )}

      <p className={estilos.nota}>
        La demostración se restaura con "Reiniciar demo": una importación de prueba no deja rastros
        permanentes.
      </p>
    </div>
  )
}
