import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useMisBienes } from '../hooks/useMisBienes'
import { FormularioBusquedaBien } from '../components/FormularioBusquedaBien'
import { TarjetaConsultaBien } from '../components/TarjetaConsultaBien'
import { MisBienesTabla } from '../components/MisBienesTabla'
import * as activosService from '../../activos/mock/activosService.mock'
import estilos from './AutoconsultaPage.module.css'

/**
 * Portal de autoconsulta: búsqueda rápida de un bien (folio/código de
 * barras/RFID) y "Mis bienes" (los activos a cargo del usuario). Vista de
 * solo lectura — sin valor contable ni acciones de edición.
 */
export function AutoconsultaPage() {
  const { usuario } = useAuth()
  const { activos: misBienes, cargando: cargandoMisBienes } = useMisBienes()

  const [buscando, setBuscando] = useState(false)
  const [textoBuscado, setTextoBuscado] = useState('')
  const [resultados, setResultados] = useState(null) // null = sin búsqueda todavía

  async function manejarBuscar(texto) {
    if (!texto.trim()) {
      setResultados(null)
      return
    }
    setBuscando(true)
    setTextoBuscado(texto.trim())
    const encontrados = await activosService.buscarActivos({ texto })
    setResultados(encontrados)
    setBuscando(false)
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Autoconsulta</h1>
      <p className={estilos.subtitulo}>Hola, {usuario.nombre}. Consulte la información de un bien.</p>

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Buscar un bien</h2>
        <p className={estilos.ayuda}>Ingrese el folio, código de barras o RFID del bien.</p>
        <FormularioBusquedaBien onBuscar={manejarBuscar} buscando={buscando} />

        {!buscando && resultados !== null && (
          <div className={estilos.resultados}>
            {resultados.length === 0 && (
              <p className={estilos.sinResultados}>
                No se encontró ningún bien con "{textoBuscado}".
              </p>
            )}
            {resultados.length === 1 && <TarjetaConsultaBien activo={resultados[0]} />}
            {resultados.length > 1 && <MisBienesTabla activos={resultados} cargando={false} />}
          </div>
        )}
      </section>

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Mis bienes</h2>
        <p className={estilos.ayuda}>Activos asignados a su nombre como responsable.</p>
        <MisBienesTabla activos={misBienes} cargando={cargandoMisBienes} />
      </section>
    </div>
  )
}
