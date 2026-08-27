import { useEffect, useState } from 'react'
import * as activosService from '../services/activosService'

const FILTROS_INICIALES = { texto: '', categoria: '', ubicacion: '', estado: '' }

/**
 * Búsqueda avanzada del listado de activos. `filtros` refleja lo que el
 * usuario va tecleando/eligiendo de inmediato (controla los campos);
 * la consulta al mock se dispara con un pequeño debounce para no golpear
 * el servicio en cada tecla, igual que haría un buscador contra una API
 * real.
 */
export function useActivos() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES)
  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const idTemporizador = setTimeout(() => setFiltrosAplicados(filtros), 300)
    return () => clearTimeout(idTemporizador)
  }, [filtros])

  useEffect(() => {
    let vigente = true

    // El `Promise.resolve().then(...)` inicial no es decorativo: marcar
    // "cargando" dentro de un callback (en vez de al inicio del efecto)
    // evita el re-render en cascada que produciría llamar a setState de
    // forma síncrona en el cuerpo del efecto.
    Promise.resolve()
      .then(() => {
        if (vigente) setCargando(true)
        return activosService.buscarActivos(filtrosAplicados)
      })
      .then((resultado) => {
        if (!vigente) return
        setActivos(resultado)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [filtrosAplicados])

  const hayFiltrosActivos = Object.values(filtrosAplicados).some(Boolean)

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
  }

  return { activos, cargando, filtros, setFiltros, hayFiltrosActivos, limpiarFiltros }
}
