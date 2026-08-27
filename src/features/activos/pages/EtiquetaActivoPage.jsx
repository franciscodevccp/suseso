import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { EtiquetaActivo } from '../components/EtiquetaActivo'
import * as activosService from '../services/activosService'
import estilos from './EtiquetaActivoPage.module.css'

/**
 * Vista previa e impresión de la etiqueta individual (RQ-19, docs/08):
 * al imprimir, la página mide 50×25 mm y solo sale la etiqueta.
 */
export function EtiquetaActivoPage() {
  const { id } = useParams()
  const [activo, setActivo] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    activosService
      .obtenerActivoPorId(id)
      .then((fila) => vigente && setActivo(fila))
      .catch(() => {})
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [id])

  // Al imprimir se oculta todo el marco de la aplicación (global.css).
  useEffect(() => {
    document.body.classList.add('imprimir-etiquetas')
    return () => document.body.classList.remove('imprimir-etiquetas')
  }, [])

  if (cargando) return <p className={estilos.cargando}>Cargando etiqueta…</p>
  if (!activo) {
    return (
      <div>
        <Link to="/activos-fijos" className={estilos.volver}>
          ← Volver al listado
        </Link>
        <p className={estilos.cargando}>El activo no existe.</p>
      </div>
    )
  }

  return (
    <div>
      <div className={estilos.controles}>
        <Link to={`/activos-fijos/${activo.id}`} className={estilos.volver}>
          ← Volver a la ficha
        </Link>
        <h1 className={estilos.titulo}>Etiqueta de {activo.folio}</h1>
        <p className={estilos.subtitulo}>
          Tamaño de impresión: 50 × 25 mm (etiqueta autoadhesiva estándar).
        </p>
        <Button anchoCompleto={false} onClick={() => window.print()}>
          Imprimir etiqueta
        </Button>
      </div>

      <div className={estilos.zonaEtiqueta}>
        <EtiquetaActivo activo={activo} />
      </div>
    </div>
  )
}
