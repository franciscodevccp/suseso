import { useEffect, useState } from 'react'
import * as almacenService from '../mock/almacenService.mock'

/** Catálogos de categorías, ubicaciones y unidades, para poblar los selects del formulario. */
export function useCatalogosAlmacen() {
  const [categorias, setCategorias] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [unidades, setUnidades] = useState([])

  useEffect(() => {
    let vigente = true

    Promise.all([
      almacenService.obtenerCategorias(),
      almacenService.obtenerUbicaciones(),
      almacenService.obtenerUnidades(),
    ]).then(([categoriasObtenidas, ubicacionesObtenidas, unidadesObtenidas]) => {
      if (!vigente) return
      setCategorias(categoriasObtenidas)
      setUbicaciones(ubicacionesObtenidas)
      setUnidades(unidadesObtenidas)
    })

    return () => {
      vigente = false
    }
  }, [])

  return { categorias, ubicaciones, unidades }
}
