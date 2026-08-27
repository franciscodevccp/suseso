import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/common/Button'
import { TarjetaConsultaBien } from '../components/TarjetaConsultaBien'
import * as activosService from '../../activos/mock/activosService.mock'
import estilos from './ConsultaActivoPage.module.css'

/** Vista de consulta de un bien puntual, alcanzada desde una búsqueda o desde "Mis bienes". */
export function ConsultaActivoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activo, setActivo] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    activosService.obtenerActivoPorId(id).then((resultado) => {
      if (!vigente) return
      setActivo(resultado)
      setCargando(false)
    })
    return () => {
      vigente = false
    }
  }, [id])

  if (cargando) {
    return <p className={estilos.cargando}>Cargando…</p>
  }

  if (!activo) {
    return (
      <div className={estilos.noEncontrado}>
        <h1>Bien no encontrado</h1>
        <p>No existe ningún bien con ese identificador.</p>
        <Link to="/autoconsulta">Volver a autoconsulta</Link>
      </div>
    )
  }

  return (
    <div>
      <Button
        variante="secundario"
        anchoCompleto={false}
        className={estilos.botonVolver}
        onClick={() => navigate('/autoconsulta')}
      >
        ← Volver a autoconsulta
      </Button>

      <TarjetaConsultaBien activo={activo} />
    </div>
  )
}
