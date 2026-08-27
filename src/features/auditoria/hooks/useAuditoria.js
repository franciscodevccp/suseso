import { useEffect, useState } from 'react'
import * as auditoriaService from '../services/auditoriaService'

export const FILTROS_INICIALES = { usuario: '', modulo: '', accion: '', folio: '', desde: '', hasta: '' }

/**
 * Bitácora con filtros y paginación (50 por página, docs/05). Cambiar un
 * filtro vuelve a la página 1; el texto libre (acción/folio) se aplica
 * con un pequeño debounce, igual que el buscador de activos.
 */
export function useAuditoria(filtrosIniciales = FILTROS_INICIALES) {
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState({ filas: [], total: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const idTemporizador = setTimeout(() => {
      setFiltrosAplicados(filtros)
      setPagina(1)
    }, 300)
    return () => clearTimeout(idTemporizador)
  }, [filtros])

  useEffect(() => {
    let vigente = true

    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return auditoriaService.obtenerAuditoria({ ...filtrosAplicados, pagina })
      })
      .then((resultado) => {
        if (!vigente) return
        setDatos(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [filtrosAplicados, pagina])

  const totalPaginas = Math.max(1, Math.ceil(datos.total / 50))
  const hayFiltros = Object.values(filtrosAplicados).some(Boolean)

  return {
    filas: datos.filas,
    total: datos.total,
    cargando,
    filtros,
    setFiltros,
    filtrosAplicados,
    hayFiltros,
    pagina,
    setPagina,
    totalPaginas,
    limpiarFiltros: () => setFiltros(FILTROS_INICIALES),
  }
}
