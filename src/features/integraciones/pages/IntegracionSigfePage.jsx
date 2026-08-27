import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import * as integracionesService from '../mock/integracionesService.mock'
import estilos from './IntegracionSigfePage.module.css'

/** Explica la integración contable con SIGFE y demuestra el JSON de exportación. */
export function IntegracionSigfePage() {
  const [exportacion, setExportacion] = useState(null)
  const [generando, setGenerando] = useState(false)

  async function generarExportacion() {
    setGenerando(true)
    const resultado = await integracionesService.obtenerExportacionSigfe()
    setExportacion(resultado)
    setGenerando(false)
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>Integración contable con SIGFE.</p>

      <SubNavIntegraciones />

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Flujo de exportación</h2>
        <p className={estilos.descripcion}>
          La plataforma expone <code className={estilos.rutaInline}>GET /api/integracion/sigfe/activos</code>,
          que entrega los activos fijos vigentes en el formato contable requerido por SIGFE (folio,
          nombre, valor contable, estado y fecha). En producción, SIGFE consulta este endpoint de
          forma periódica o bajo demanda para sincronizar el estado contable de los bienes de la
          institución.
        </p>
        <ol className={estilos.pasos}>
          <li>SIGFE solicita el endpoint con sus credenciales de convenio.</li>
          <li>La plataforma arma el JSON a partir de los activos vigentes.</li>
          <li>SIGFE recibe y concilia los registros con su propia contabilidad.</li>
        </ol>

        <Button anchoCompleto={false} onClick={generarExportacion} disabled={generando}>
          {generando ? 'Generando…' : 'Generar exportación'}
        </Button>

        {exportacion && (
          <div className={estilos.resultado}>
            <BloqueCodigo etiqueta="Exportación generada a partir de los activos actuales">
              {JSON.stringify(exportacion, null, 2)}
            </BloqueCodigo>
          </div>
        )}
      </section>

      <p className={estilos.notaHonestidad}>
        Esta exportación se genera con los activos de prueba de esta aplicación, para demostrar el
        formato de datos. En este entorno de demostración no hay una conexión real a SIGFE; en
        producción esta capa se conecta mediante el convenio y las credenciales correspondientes.
      </p>
    </div>
  )
}
