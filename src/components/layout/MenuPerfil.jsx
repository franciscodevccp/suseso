import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useTema } from '../../features/theme/hooks/useTema'
import { OPCIONES_TEMA } from '../../features/theme/context/themeContextObject'
import estilos from './MenuPerfil.module.css'

const ETIQUETA_TEMA = {
  claro: 'Claro',
  oscuro: 'Oscuro',
  automatico: 'Automático',
}

/* Selector de los ítems interactivos del menú (acciones + opciones de tema). */
const SELECTOR_ITEMS = '[role="menuitem"], [role="menuitemradio"]'

/* Marca de selección para la opción de tema activa. */
function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M5 13l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* Icono de usuario, silueta simple propia (mismo trazo que tenía "Mi portal"). */
function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M12 13c-4.4 0-8 2.9-8 6.5V21h16v-1.5c0-3.6-3.6-6.5-8-6.5z" />
    </svg>
  )
}

/* Flecha que indica el estado abierto/cerrado del menú. */
function IconoFlecha() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Botón de perfil en el encabezado del shell autenticado: muestra el
 * nombre de la sesión activa y despliega un menú con los datos de la
 * cuenta y las acciones de sesión. Reemplaza al antiguo botón "Mi portal"
 * (sin acción) y al "Cerrar sesión" que antes vivía duplicado en
 * AppHeader.
 */
export function MenuPerfil() {
  const { usuario, logout } = useAuth()
  const { preferencia, establecerPreferencia } = useTema()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)
  const idMenu = useId()

  // Cierra al hacer clic afuera o al presionar Escape (devolviendo el foco
  // al botón disparador, como espera un usuario de teclado).
  useEffect(() => {
    if (!abierto) return undefined

    function manejarClicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) {
        setAbierto(false)
      }
    }

    function manejarTecla(evento) {
      if (evento.key === 'Escape') {
        setAbierto(false)
        contenedorRef.current?.querySelector('button')?.focus()
      }
    }

    document.addEventListener('mousedown', manejarClicFuera)
    document.addEventListener('keydown', manejarTecla)
    return () => {
      document.removeEventListener('mousedown', manejarClicFuera)
      document.removeEventListener('keydown', manejarTecla)
    }
  }, [abierto])

  // Al abrir, el foco pasa al primer ítem del menú (patrón estándar de menú de botón).
  useEffect(() => {
    if (abierto) {
      contenedorRef.current?.querySelector(SELECTOR_ITEMS)?.focus()
    }
  }, [abierto])

  function manejarNavegacionTeclado(evento) {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
    evento.preventDefault()
    const items = [...contenedorRef.current.querySelectorAll(SELECTOR_ITEMS)]
    const indiceActual = items.indexOf(document.activeElement)
    const siguiente =
      evento.key === 'ArrowDown'
        ? (indiceActual + 1) % items.length
        : (indiceActual - 1 + items.length) % items.length
    items[siguiente]?.focus()
  }

  function irACambiarClave() {
    setAbierto(false)
    navigate('/perfil/cambiar-clave')
  }

  async function manejarCerrarSesion() {
    setAbierto(false)
    await logout()
    navigate('/login')
  }

  return (
    <div className={estilos.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={estilos.disparador}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span className={estilos.iconoUsuario}>
          <IconoUsuario />
        </span>
        <span className={estilos.nombre}>{usuario.nombre}</span>
        <span className={`${estilos.flecha} ${abierto ? estilos.flechaAbierta : ''}`}>
          <IconoFlecha />
        </span>
      </button>

      {abierto && (
        <div
          id={idMenu}
          role="menu"
          aria-label="Menú de perfil"
          className={estilos.desplegable}
          onKeyDown={manejarNavegacionTeclado}
        >
          <div className={estilos.infoCuenta}>
            <p className={estilos.infoNombre}>{usuario.nombre}</p>
            <p className={estilos.infoCorreo}>{usuario.email}</p>
            <p className={estilos.infoRol}>{usuario.rol}</p>
          </div>

          <div className={estilos.separador} role="separator" />

          <p className={estilos.tituloSeccion} id={`${idMenu}-tema`}>
            Tema
          </p>
          <div role="group" aria-labelledby={`${idMenu}-tema`}>
            {OPCIONES_TEMA.map((opcion) => (
              <button
                key={opcion}
                type="button"
                role="menuitemradio"
                aria-checked={preferencia === opcion}
                className={estilos.item}
                onClick={() => establecerPreferencia(opcion)}
              >
                {ETIQUETA_TEMA[opcion]}
                {preferencia === opcion && (
                  <span className={estilos.check} aria-hidden="true">
                    <IconoCheck />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={estilos.separador} role="separator" />

          <button role="menuitem" type="button" className={estilos.item} onClick={irACambiarClave}>
            Cambiar contraseña
          </button>
          <button
            role="menuitem"
            type="button"
            className={estilos.item}
            onClick={manejarCerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
