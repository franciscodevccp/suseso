import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import { ORDEN_COMPRA_EJEMPLO } from '../constants/ordenCompraEjemplo'
import * as integracionesService from '../mock/integracionesService.mock'
import estilos from './IntegracionMercadoPublicoPage.module.css'

/** Explica la recepción de órdenes de compra desde mercadopublico.cl y su ingreso a Almacén. */
export function IntegracionMercadoPublicoPage() {
  const [resultado, setResultado] = useState(null)
  const [simulando, setSimulando] = useState(false)

  async function simularRecepcion() {
    setSimulando(true)
    const respuesta = await integracionesService.simularRecepcionOrdenCompra(ORDEN_COMPRA_EJEMPLO)
    setResultado(respuesta)
    setSimulando(false)
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>Recepción de órdenes de compra desde mercadopublico.cl.</p>

      <SubNavIntegraciones />

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Flujo de recepción</h2>
        <p className={estilos.descripcion}>
          La plataforma expone{' '}
          <code className={estilos.rutaInline}>POST /api/integracion/mercadopublico/orden-compra</code>,
          que recibe una orden de compra (OC) emitida desde mercadopublico.cl. Cada ítem de la OC se
          convierte en un ingreso de stock en el módulo de Almacén, asociado al ítem correspondiente
          por nombre y quedando registrado en su historial de movimientos.
        </p>

        <BloqueCodigo etiqueta="Ejemplo de orden de compra">
          {JSON.stringify(ORDEN_COMPRA_EJEMPLO, null, 2)}
        </BloqueCodigo>

        <Button anchoCompleto={false} onClick={simularRecepcion} disabled={simulando}>
          {simulando ? 'Simulando…' : 'Simular recepción'}
        </Button>

        {resultado && (
          <div className={estilos.resultado}>
            <BloqueCodigo etiqueta="Resultado de la simulación">
              {JSON.stringify(resultado, null, 2)}
            </BloqueCodigo>
          </div>
        )}
      </section>

      <p className={estilos.notaHonestidad}>
        "Simular recepción" solo demuestra el resultado que produciría este flujo: no escribe
        movimientos reales en Almacén ni se conecta a mercadopublico.cl. En producción esta capa se
        conecta mediante el convenio y las credenciales de interoperabilidad correspondientes.
      </p>
    </div>
  )
}
