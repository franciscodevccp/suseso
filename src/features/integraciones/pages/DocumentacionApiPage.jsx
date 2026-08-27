import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import { TarjetaEndpoint } from '../components/TarjetaEndpoint'
import * as integracionesService from '../services/integracionesService'
import { extraerEndpoints } from '../utils/especificacion'
import estilos from './DocumentacionApiPage.module.css'

/**
 * Documentación de la API pública /api/v1 (AD-01). Se genera desde
 * /openapi.yaml — el mismo archivo que se descarga — así la página y la
 * especificación nunca cuentan historias distintas.
 */
export function DocumentacionApiPage() {
  const [especificacion, setEspecificacion] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true
    integracionesService
      .obtenerEspecificacion()
      .then((spec) => vigente && setEspecificacion(spec))
      .catch(() => vigente && setError(true))
    return () => {
      vigente = false
    }
  }, [])

  const endpoints = especificacion ? extraerEndpoints(especificacion) : []

  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>
        Documentación de la API pública que la plataforma expone para su integración con sistemas
        externos.
      </p>

      <SubNavIntegraciones />

      <section className={estilos.tarjetaProtocolo}>
        <h2 className={estilos.tituloSeccion}>Protocolo y formato de datos</h2>
        <dl className={estilos.formato}>
          <div>
            <dt>Protocolo</dt>
            <dd>REST sobre HTTPS</dd>
          </div>
          <div>
            <dt>Formato de datos</dt>
            <dd>JSON (UTF-8), respuestas con la forma {'{ datos, paginacion? }'}</dd>
          </div>
          <div>
            <dt>Autenticación</dt>
            <dd>
              Cabecera <code className={estilos.codigoInline}>X-API-Key</code>, entregada en el
              convenio de interoperabilidad
            </dd>
          </div>
          <div>
            <dt>Límite de consultas</dt>
            <dd>60 por minuto; listados paginados de hasta 100 registros</dd>
          </div>
          <div>
            <dt>Especificación</dt>
            <dd>
              <a className={estilos.enlaceDescarga} href="/openapi.yaml" download="sisga-openapi.yaml">
                Descargar OpenAPI 3.1 (openapi.yaml)
              </a>
            </dd>
          </div>
        </dl>
      </section>

      {error && <Alert tipo="error">No fue posible cargar la especificación de la API.</Alert>}

      {especificacion && (
        <>
          <nav className={estilos.indice} aria-label="Índice de endpoints">
            <p className={estilos.indiceTitulo}>Endpoints documentados</p>
            <ul>
              {endpoints.map((endpoint) => (
                <li key={endpoint.id}>
                  <a href={`#${endpoint.id}`}>
                    {endpoint.metodo} {endpoint.ruta}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {endpoints.map((endpoint) => (
            <TarjetaEndpoint key={endpoint.id} endpoint={endpoint} />
          ))}
        </>
      )}

      <p className={estilos.notaHonestidad}>
        Esta API está operativa en este mismo entorno de demostración: el botón "Probar" de cada
        endpoint ejecuta la llamada real contra este servidor, autenticada con la llave de
        demostración (que se administra en el servidor y nunca se expone al navegador). En
        producción, las llaves se entregan mediante el convenio de interoperabilidad
        correspondiente.
      </p>
    </div>
  )
}
