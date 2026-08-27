import { useEffect, useState } from 'react'
import * as activosService from '../mock/activosService.mock'

/** Catálogos de categorías y ubicaciones, para poblar los filtros del listado. */
export function useCatalogosActivos() {
  const [categorias, setCategorias] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])

  useEffect(() => {
    let vigente = true

    Promise.all([activosService.obtenerCategorias(), activosService.obtenerUbicaciones()]).then(
      ([categoriasObtenidas, ubicacionesObtenidas]) => {
        if (!vigente) return
        setCategorias(categoriasObtenidas)
        setUbicaciones(ubicacionesObtenidas)
      },
    )

    return () => {
      vigente = false
    }
  }, [])

  return { categorias, ubicaciones }
}
