import { useState } from 'react'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import { Button } from '../../../components/common/Button'
import * as integracionesService from '../services/integracionesService'
import estilos from './TarjetaEndpoint.module.css'

const TONO_POR_METODO = { GET: 'exito', POST: 'advertencia' }
const NOMBRE_EN = { path: 'ruta', query: 'query' }

/**
 * Documentación de un endpoint de /api/v1, generada desde /openapi.yaml.
 * "Probar" ejecuta la llamada real a través del servidor (docs/14: la
 * API key de demostración nunca viaja al navegador).
 */
export function TarjetaEndpoint({ endpoint }) {
  const [resultado, setResultado] = useState(null)
  const [probando, setProbando] = useState(false)

  async function probar() {
    setProbando(true)
    try {
      const respuesta = await integracionesService.probarEndpoint({
        metodo: endpoint.metodo,
        ruta: endpoint.rutaEjemplo,
        ...(endpoint.cuerpoEjemplo ? { cuerpo: endpoint.cuerpoEjemplo } : {}),
      })
      setResultado(respuesta)
    } catch {
      setResultado({ status: 'error', cuerpo: { mensaje: 'No fue posible ejecutar la llamada.' } })
    } finally {
      setProbando(false)
    }
  }

  return (
    <section id={endpoint.id} className={estilos.tarjeta}>
      <div className={estilos.encabezado}>
        <BadgeEstado etiqueta={endpoint.metodo} tono={TONO_POR_METODO[endpoint.metodo] ?? 'neutro'} />
        <code className={estilos.ruta}>{endpoint.ruta}</code>
      </div>

      <p className={estilos.descripcion}>{endpoint.descripcion || endpoint.resumen}</p>

      {endpoint.parametros.length > 0 && (
        <dl className={estilos.formato}>
          {endpoint.parametros.map((parametro) => (
            <div key={`${parametro.en}-${parametro.nombre}`}>
              <dt>
                <code>{parametro.nombre}</code> ({NOMBRE_EN[parametro.en] ?? parametro.en}
                {parametro.requerido ? ', obligatorio' : ''})
              </dt>
              <dd>{parametro.tipo}</dd>
            </div>
          ))}
        </dl>
      )}

      {endpoint.cuerpoEjemplo && (
        <BloqueCodigo etiqueta="Ejemplo de solicitud">
          {JSON.stringify(endpoint.cuerpoEjemplo, null, 2)}
        </BloqueCodigo>
      )}

      <div className={estilos.probar}>
        <Button anchoCompleto={false} variante="secundario" onClick={probar} disabled={probando}>
          {probando ? 'Probando…' : `Probar ${endpoint.metodo} ${endpoint.rutaEjemplo}`}
        </Button>
      </div>

      {resultado && (
        <BloqueCodigo etiqueta={`Respuesta real (HTTP ${resultado.status})`}>
          {JSON.stringify(resultado.cuerpo, null, 2)}
        </BloqueCodigo>
      )}
    </section>
  )
}
