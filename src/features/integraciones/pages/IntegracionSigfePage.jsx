import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import { Button } from '../../../components/common/Button'
import { useAuth } from '../../auth/hooks/useAuth'
import { SubNavIntegraciones } from '../components/SubNavIntegraciones'
import * as integracionesService from '../services/integracionesService'
import estilos from './IntegracionSigfePage.module.css'

/**
 * Integración contable con SIGFE (AD-02), sobre datos reales: la
 * exportación sale de los activos de la base y las cuentas contables por
 * categoría son editables por el Administrador (registro T-05: plan de
 * cuentas genérico y referencial mientras la institución no entregue el
 * propio).
 */
export function IntegracionSigfePage() {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  const [exportacion, setExportacion] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [cuentas, setCuentas] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    let vigente = true
    integracionesService
      .obtenerCuentasContables()
      .then((datos) => vigente && setCuentas(datos))
      .catch(() => vigente && setMensaje({ tipo: 'error', texto: 'No fue posible cargar las cuentas contables.' }))
    return () => {
      vigente = false
    }
  }, [])

  async function generarExportacion() {
    setGenerando(true)
    setMensaje(null)
    try {
      setExportacion(await integracionesService.obtenerExportacionSigfe())
    } catch {
      setMensaje({ tipo: 'error', texto: 'No fue posible generar la exportación.' })
    } finally {
      setGenerando(false)
    }
  }

  async function guardarCuentas(evento) {
    evento.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      setCuentas(await integracionesService.guardarCuentasContables(cuentas))
      setMensaje({ tipo: 'exito', texto: 'Cuentas contables guardadas.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No fue posible guardar las cuentas contables.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Integraciones</h1>
      <p className={estilos.subtitulo}>Integración contable con SIGFE.</p>

      <SubNavIntegraciones />

      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Flujo de exportación</h2>
        <p className={estilos.descripcion}>
          La plataforma expone{' '}
          <code className={estilos.rutaInline}>GET /api/v1/contabilidad/activos</code> (exportación
          valorizada con cuenta contable, depreciación acumulada y valor libro) y{' '}
          <code className={estilos.rutaInline}>GET /api/v1/contabilidad/asientos</code> (asientos de
          depreciación mensual por categoría), autenticados con{' '}
          <code className={estilos.rutaInline}>X-API-Key</code>. La confirmación de ida y vuelta se
          demuestra con <code className={estilos.rutaInline}>POST /api/v1/webhooks/contabilidad</code>.
        </p>
        <ol className={estilos.pasos}>
          <li>SIGFE solicita la exportación con sus credenciales de convenio.</li>
          <li>La plataforma arma el JSON con los activos vigentes y sus cuentas contables.</li>
          <li>SIGFE concilia y confirma la carga mediante el webhook.</li>
        </ol>

        <Button anchoCompleto={false} onClick={generarExportacion} disabled={generando}>
          {generando ? 'Generando…' : 'Generar exportación'}
        </Button>

        {exportacion && (
          <div className={estilos.resultado}>
            <BloqueCodigo etiqueta="Exportación generada con los activos actuales de la base">
              {JSON.stringify(exportacion, null, 2)}
            </BloqueCodigo>
          </div>
        )}
      </section>

      {cuentas && (
        <section className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Cuentas contables por categoría</h2>
          <p className={estilos.descripcion}>
            Plan de cuentas genérico y referencial; se reemplaza por el plan institucional al
            momento de la implantación.
            {esAdministrador ? ' Como Administrador, puede editarlo aquí.' : ''}
          </p>
          <form onSubmit={guardarCuentas}>
            <div className={estilos.cuentas}>
              {Object.entries(cuentas).map(([categoria, cuenta]) => (
                <label key={categoria} className={estilos.cuenta}>
                  <span>{categoria}</span>
                  <input
                    type="text"
                    value={cuenta}
                    disabled={!esAdministrador}
                    onChange={(evento) =>
                      setCuentas((previas) => ({ ...previas, [categoria]: evento.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
            {esAdministrador && (
              <Button type="submit" anchoCompleto={false} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cuentas'}
              </Button>
            )}
          </form>
        </section>
      )}

      <p className={estilos.notaHonestidad}>
        La exportación se genera con los activos reales de esta base de demostración. La conexión a
        SIGFE en producción se establece mediante el convenio y las credenciales de
        interoperabilidad correspondientes.
      </p>
    </div>
  )
}
