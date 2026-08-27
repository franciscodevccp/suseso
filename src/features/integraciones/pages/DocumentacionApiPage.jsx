import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import { TarjetaEndpoint } from '../components/TarjetaEndpoint'
import { ENDPOINTS_API } from '../constants/endpointsApi'
import estilos from './DocumentacionApiPage.module.css'

/** Especificación técnica de la API expuesta por la plataforma. */
export function DocumentacionApiPage() {
  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>
        Documentación técnica de los endpoints que la plataforma expone para su integración con
        sistemas externos.
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
            <dd>JSON (UTF-8)</dd>
          </div>
          <div>
            <dt>Autenticación</dt>
            <dd>Token Bearer (OAuth2 client credentials), entregado en el convenio de interoperabilidad</dd>
          </div>
          <div>
            <dt>Contrato SOAP</dt>
            <dd>Disponible como equivalente (WSDL) para sistemas que lo requieran</dd>
          </div>
        </dl>
      </section>

      <nav className={estilos.indice} aria-label="Índice de endpoints">
        <p className={estilos.indiceTitulo}>Endpoints documentados</p>
        <ul>
          {ENDPOINTS_API.map((endpoint) => (
            <li key={endpoint.id}>
              <a href={`#${endpoint.id}`}>
                {endpoint.metodo} {endpoint.ruta}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {ENDPOINTS_API.map((endpoint) => (
        <TarjetaEndpoint key={endpoint.id} endpoint={endpoint} />
      ))}

      <p className={estilos.notaHonestidad}>
        Esta sección describe el contrato técnico de la API y demuestra el formato de datos con
        información de prueba de esta aplicación. En este entorno de demostración los endpoints no
        están conectados a un servidor ni a sistemas externos reales; en producción esta capa se
        conecta a SIGFE y mercadopublico.cl mediante los convenios y credenciales de
        interoperabilidad correspondientes.
      </p>
    </div>
  )
}
