import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { EtiquetaActivo } from '../components/EtiquetaActivo'
import * as activosService from '../services/activosService'
import estilos from './PliegoEtiquetasPage.module.css'

/**
 * Pliego de etiquetas (RQ-19, docs/08): los activos seleccionados en el
 * listado, en una grilla de 4 × 10 por hoja A4 para etiquetas
 * autoadhesivas precortadas.
 */
export function PliegoEtiquetasPage() {
  const [parametros] = useSearchParams()
  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)

  const ids = (parametros.get('ids') ?? '').split(',').filter(Boolean)

  useEffect(() => {
    let vigente = true
    activosService
      .buscarActivos({})
      .then((todos) => {
        if (!vigente) return
        const porId = new Map(todos.map((activo) => [activo.id, activo]))
        setActivos(ids.map((id) => porId.get(id)).filter(Boolean))
      })
      .catch(() => {})
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids derivado de la URL
  }, [parametros])

  useEffect(() => {
    document.body.classList.add('imprimir-etiquetas')
    return () => document.body.classList.remove('imprimir-etiquetas')
  }, [])

  return (
    <div>
      <div className={estilos.controles}>
        <Link to="/activos-fijos" className={estilos.volver}>
          ← Volver al listado
        </Link>
        <h1 className={estilos.titulo}>Pliego de etiquetas</h1>
        <p className={estilos.subtitulo}>
          {activos.length} etiqueta(s) seleccionada(s) — hoja A4, 4 por fila, para etiquetas
          autoadhesivas precortadas.
        </p>
        <Button anchoCompleto={false} onClick={() => window.print()} disabled={activos.length === 0}>
          Imprimir pliego
        </Button>
      </div>

      {cargando ? (
        <p className={estilos.cargando}>Preparando etiquetas…</p>
      ) : activos.length === 0 ? (
        <p className={estilos.cargando}>No hay activos seleccionados.</p>
      ) : (
        <div className={estilos.pliego}>
          {activos.map((activo) => (
            <EtiquetaActivo key={activo.id} activo={activo} />
          ))}
        </div>
      )}
    </div>
  )
}
