import estilos from './EncabezadoInstitucional.module.css'

/* Estrella decorativa de 5 puntas (polígono propio, no es un asset). */
function IconoEstrella() {
  return (
    <svg
      className={estilos.estrella}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="12,2 14.35,8.76 21.51,8.91 15.8,13.24 17.88,20.09 12,16 6.12,20.09 8.2,13.24 2.49,8.91 9.65,8.76" />
    </svg>
  )
}

/**
 * Encabezado institucional replicando la estructura del oficial de SUSESO
 * (tres zonas: recuadro institucional, marca "Gobierno de Chile" y una
 * acción a la derecha). Construido íntegramente con CSS/SVG propios, sin
 * usar ningún asset del sitio real.
 *
 * La zona derecha es agnóstica de su contenido: se le pasa vía
 * `accionDerecha` (ej. el menú de perfil en el shell autenticado). Si no
 * se pasa nada, no se renderiza esa zona — así en las pantallas de acceso
 * (login, recuperar clave) el encabezado muestra solo la marca.
 */
export function EncabezadoInstitucional({ accionDerecha }) {
  return (
    <header className={estilos.encabezado}>
      <div className={estilos.zonaIzquierda}>
        <div className={estilos.franjaBicolor} aria-hidden="true">
          <span className={estilos.mitadAzul} />
          <span className={estilos.mitadRoja} />
        </div>
        <div className={estilos.cajaInstitucion}>
          <span>Superintendencia</span>
          <span>de Seguridad</span>
          <span>Social</span>
        </div>
      </div>

      <div className={estilos.zonaCentro}>
        <div className={estilos.filaGuiones} aria-hidden="true">
          <span className={estilos.guiones} />
          <IconoEstrella />
          <span className={estilos.guiones} />
        </div>
        <p className={estilos.trabajando}>
          <strong>TRABAJANDO</strong> PARA <strong>USTED</strong>
        </p>
        <span className={estilos.lineaRoja} aria-hidden="true" />
        <p className={estilos.gobierno}>
          <strong>GOBIERNO</strong> DE <strong>CHILE</strong>
        </p>
      </div>

      {accionDerecha && <div className={estilos.zonaDerecha}>{accionDerecha}</div>}
    </header>
  )
}
