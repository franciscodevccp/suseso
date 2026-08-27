import { useEffect, useState } from 'react'
import * as activosService from '../services/activosService'

/** Catálogos de categorías, ubicaciones y responsables, para poblar los filtros del listado. */
export function useCatalogosActivos() {
  const [categorias, setCategorias] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [funcionarios, setFuncionarios] = useState([])

  useEffect(() => {
    let vigente = true

    Promise.all([
      activosService.obtenerCategorias(),
      activosService.obtenerUbicaciones(),
      activosService.obtenerFuncionarios(),
    ]).then(([categoriasObtenidas, ubicacionesObtenidas, funcionariosObtenidos]) => {
      if (!vigente) return
      setCategorias(categoriasObtenidas)
      setUbicaciones(ubicacionesObtenidas)
      setFuncionarios(funcionariosObtenidos)
    })

    return () => {
      vigente = false
    }
  }, [])

  return { categorias, ubicaciones, funcionarios }
}
