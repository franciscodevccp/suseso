import { EncabezadoInstitucional } from './EncabezadoInstitucional'
import estilos from './AuthLayout.module.css'

/** Layout compartido por las vistas del módulo de acceso: marca + tarjeta centrada. */
export function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className={estilos.pagina}>
      <EncabezadoInstitucional />
      <main className={estilos.contenido}>
        <div className={estilos.tarjeta}>
          <h1 className={estilos.titulo}>{titulo}</h1>
          {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
          {children}
        </div>
      </main>
      <footer className={estilos.pie}>
        Sistema Integral de Gestión de Activos Fijos y Almacén — SUSESO
      </footer>
    </div>
  )
}
