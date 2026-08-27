import { useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { CampoArchivo } from '../../../components/common/CampoArchivo'
import { Desplegable } from '../../../components/common/Desplegable'
import * as activosService from '../services/activosService'
import estilos from './SeccionAdjuntos.module.css'

const ETIQUETA_TIPO = {
  foto: 'Foto',
  pdf: 'Documento PDF',
  orden_compra: 'Orden de compra',
  garantia: 'Garantía',
  otro: 'Otro',
}

const MENSAJES_ERROR = {
  TIPO_NO_PERMITIDO: 'Solo se aceptan imágenes (JPG, PNG, WebP) o PDF.',
  ARCHIVO_MUY_GRANDE: 'El archivo supera los 10 MB.',
  ARCHIVO_REQUERIDO: 'Seleccione un archivo.',
}

const formatearTamano = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')

const enlaceMapa = ({ latitud, longitud }) =>
  `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`

/**
 * Adjuntos del activo (RQ-12) con georreferencia (RQ-22, docs/06):
 * galería de fotos con "Ver en mapa", documentos descargables y el
 * formulario de subida con "Usar mi ubicación".
 */
export function SeccionAdjuntos({ activo, puedeGestionar, onCambio }) {
  const adjuntos = activo.documentos ?? []
  const fotos = adjuntos.filter((adjunto) => adjunto.mime?.startsWith('image/'))
  const documentos = adjuntos.filter((adjunto) => !adjunto.mime?.startsWith('image/'))

  const [archivo, setArchivo] = useState(null)
  const [tipo, setTipo] = useState('foto')
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)

  async function subir(evento) {
    evento.preventDefault()
    if (!archivo) {
      setError(MENSAJES_ERROR.ARCHIVO_REQUERIDO)
      return
    }
    setSubiendo(true)
    setError(null)
    try {
      await activosService.subirAdjunto(activo.id, { archivo, tipo })
      setArchivo(null)
      onCambio()
    } catch (err) {
      setError(MENSAJES_ERROR[err.code] ?? 'No fue posible subir el archivo. Intente nuevamente.')
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminar(adjunto) {
    setError(null)
    try {
      await activosService.eliminarAdjunto(adjunto.id)
      onCambio()
    } catch {
      setError('No fue posible eliminar el adjunto. Intente nuevamente.')
    }
  }

  async function hacerPrincipal(adjunto) {
    setError(null)
    try {
      await activosService.definirFotoPrincipal(activo.id, adjunto.id)
      onCambio()
    } catch {
      setError('No fue posible cambiar la foto principal. Intente nuevamente.')
    }
  }

  return (
    <section className={estilos.tarjeta}>
      <h2 className={estilos.tituloSeccion}>Adjuntos</h2>

      {error && <Alert tipo="error">{error}</Alert>}

      {fotos.length === 0 && documentos.length === 0 && (
        <p className={estilos.vacio}>Aún no hay fotos ni documentos para este activo.</p>
      )}

      {fotos.length > 0 && (
        <div className={estilos.galeria}>
          {fotos.map((foto) => (
            <figure key={foto.id} className={estilos.tarjetaFoto}>
              <a href={activosService.urlAdjunto(foto.id)} target="_blank" rel="noreferrer">
                <img
                  src={activosService.urlAdjunto(foto.id)}
                  alt={foto.nombreOriginal}
                  className={estilos.miniatura}
                  loading="lazy"
                />
              </a>
              <figcaption className={estilos.pieFoto}>
                <span className={estilos.fechaFoto}>{formatearFecha(foto.fecha)}</span>
                {activo.foto === foto.id && <span className={estilos.marcaPrincipal}>Principal</span>}
                <span className={estilos.accionesFoto}>
                  {foto.latitud != null && (
                    <a href={enlaceMapa(foto)} target="_blank" rel="noreferrer">
                      Ver en mapa
                    </a>
                  )}
                  {puedeGestionar && activo.foto !== foto.id && (
                    <button type="button" onClick={() => hacerPrincipal(foto)}>
                      Hacer principal
                    </button>
                  )}
                  {puedeGestionar && (
                    <button type="button" onClick={() => eliminar(foto)}>
                      Eliminar
                    </button>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {documentos.length > 0 && (
        <ul className={estilos.listaDocumentos}>
          {documentos.map((documento) => (
            <li key={documento.id} className={estilos.documento}>
              <span className={estilos.datosDocumento}>
                <span className={estilos.nombreDocumento}>{documento.nombreOriginal}</span>
                <span className={estilos.metaDocumento}>
                  {ETIQUETA_TIPO[documento.tipo] ?? documento.tipo} · {formatearTamano(documento.tamano)} ·{' '}
                  {formatearFecha(documento.fecha)}
                </span>
              </span>
              <span className={estilos.accionesDocumento}>
                <a href={activosService.urlAdjunto(documento.id)}>Descargar</a>
                {puedeGestionar && (
                  <button type="button" onClick={() => eliminar(documento)}>
                    Eliminar
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {puedeGestionar && (
        <form className={estilos.formulario} onSubmit={subir}>
          <h3 className={estilos.tituloFormulario}>Agregar adjunto</h3>
          <div className={estilos.filaFormulario}>
            <CampoArchivo
              archivo={archivo}
              onSeleccionar={(seleccionado) => {
                setArchivo(seleccionado)
                setError(null)
              }}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              capture="environment"
              aria-label="Archivo"
              className={estilos.campoArchivo}
            />
            <Desplegable
              aria-label="Tipo de adjunto"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={estilos.selectTipo}
            >
              {Object.entries(ETIQUETA_TIPO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Desplegable>
          </div>

          <Button anchoCompleto={false} tipo="submit" disabled={subiendo}>
            {subiendo ? 'Subiendo…' : 'Subir adjunto'}
          </Button>
          <p className={estilos.nota}>
            Imágenes JPG/PNG/WebP o PDF, hasta 10 MB. Si la foto trae ubicación (GPS), se usa
            automáticamente.
          </p>
        </form>
      )}
    </section>
  )
}
