import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TablaSolicitudes } from '../components/TablaSolicitudes'
import * as solicitudesService from '../services/solicitudesService'
import estilos from './MisSolicitudesPage.module.css'

/** "Mis solicitudes" del portal (docs/11): las del usuario en sesión. */
export function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    solicitudesService
      .obtenerMisSolicitudes()
      .then((filas) => {
        if (vigente) setSolicitudes(filas)
      })
      .catch(() => {})
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Mis solicitudes</h1>
          <p className={estilos.subtitulo}>Solicitudes de insumos del almacén a su nombre.</p>
        </div>
        <Link to="/autoconsulta/solicitudes/nueva" className={estilos.botonNueva}>
          Nueva solicitud
        </Link>
      </div>

      <TablaSolicitudes solicitudes={solicitudes} cargando={cargando} />
    </div>
  )
}
