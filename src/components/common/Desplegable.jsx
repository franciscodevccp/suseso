import { Children, useEffect, useId, useMemo, useRef, useState } from 'react'
import estilos from './Desplegable.module.css'

/**
 * Reemplazo del <select> nativo con lista desplegable de diseño propio
 * (decisión del 2026-08-27, docs/17): el popup nativo no es estilizable de
 * forma consistente en Chrome/Edge/Firefox (RQ-02).
 *
 * Contrato de uso IDÉNTICO al <select>: recibe <option> como hijos,
 * `value` controlado y `onChange` que entrega `{ target: { name, value } }`,
 * para que ningún consumidor cambie su código.
 *
 * Accesibilidad: patrón combobox/listbox de WAI-ARIA con
 * aria-activedescendant; flechas, Inicio/Fin, Enter/Espacio, Escape y
 * búsqueda por primera letra.
 */
export function Desplegable({
  id,
  name,
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}) {
  const idGenerado = useId()
  const idBoton = id ?? idGenerado
  const idLista = `${idBoton}-lista`

  const opciones = useMemo(() => {
    return Children.toArray(children)
      .filter((nodo) => nodo?.type === 'option')
      .map((nodo) => ({
        valor: nodo.props.value ?? String(nodo.props.children ?? ''),
        etiqueta: String(nodo.props.children ?? ''),
        deshabilitada: Boolean(nodo.props.disabled),
      }))
  }, [children])

  const indiceSeleccionado = opciones.findIndex((op) => String(op.valor) === String(value ?? ''))
  const seleccionada = indiceSeleccionado >= 0 ? opciones[indiceSeleccionado] : null

  const [abierto, setAbierto] = useState(false)
  const [alineadoDerecha, setAlineadoDerecha] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)
  const raizRef = useRef(null)
  const botonRef = useRef(null)
  const listaRef = useRef(null)

  function abrir(indiceInicial) {
    if (disabled) return
    const inicial =
      indiceInicial ??
      (indiceSeleccionado >= 0 ? indiceSeleccionado : opciones.findIndex((op) => !op.deshabilitada))
    setIndiceActivo(inicial)
    // Si una lista ancha no cabe hacia la derecha, se ancla al borde
    // derecho del control para no cortarse contra la ventana.
    const caja = raizRef.current?.getBoundingClientRect()
    setAlineadoDerecha(Boolean(caja && caja.left + Math.min(420, window.innerWidth * 0.92) > window.innerWidth && caja.right - 420 > 0))
    setAbierto(true)
  }

  function cerrar() {
    setAbierto(false)
    setIndiceActivo(-1)
  }

  function seleccionar(indice) {
    const opcion = opciones[indice]
    if (!opcion || opcion.deshabilitada) return
    onChange?.({ target: { name, value: opcion.valor } })
    cerrar()
    botonRef.current?.focus()
  }

  function moverActivo(desde, paso) {
    let indice = desde
    for (let i = 0; i < opciones.length; i++) {
      indice = (indice + paso + opciones.length) % opciones.length
      if (!opciones[indice].deshabilitada) return setIndiceActivo(indice)
    }
  }

  function buscarPorLetra(letra) {
    const objetivo = letra.toLowerCase()
    const desde = indiceActivo >= 0 ? indiceActivo : -1
    for (let i = 1; i <= opciones.length; i++) {
      const indice = (desde + i) % opciones.length
      const opcion = opciones[indice]
      if (!opcion.deshabilitada && opcion.etiqueta.toLowerCase().startsWith(objetivo)) {
        setIndiceActivo(indice)
        return
      }
    }
  }

  function manejarTeclado(evento) {
    if (disabled) return
    const { key } = evento

    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(key)) {
        evento.preventDefault()
        abrir(key === 'End' ? ultimoHabilitado() : undefined)
      }
      return
    }

    if (key === 'ArrowDown') {
      evento.preventDefault()
      moverActivo(indiceActivo, 1)
    } else if (key === 'ArrowUp') {
      evento.preventDefault()
      moverActivo(indiceActivo, -1)
    } else if (key === 'Home') {
      evento.preventDefault()
      moverActivo(-1, 1)
    } else if (key === 'End') {
      evento.preventDefault()
      setIndiceActivo(ultimoHabilitado())
    } else if (key === 'Enter' || key === ' ') {
      evento.preventDefault()
      seleccionar(indiceActivo)
    } else if (key === 'Escape') {
      evento.preventDefault()
      cerrar()
    } else if (key === 'Tab') {
      cerrar()
    } else if (key.length === 1 && /\S/.test(key)) {
      buscarPorLetra(key)
    }
  }

  function ultimoHabilitado() {
    for (let i = opciones.length - 1; i >= 0; i--) {
      if (!opciones[i].deshabilitada) return i
    }
    return -1
  }

  // Clic fuera del componente: se cierra.
  useEffect(() => {
    if (!abierto) return undefined
    function alPresionarFuera(evento) {
      if (!raizRef.current?.contains(evento.target)) cerrar()
    }
    document.addEventListener('pointerdown', alPresionarFuera)
    return () => document.removeEventListener('pointerdown', alPresionarFuera)
  }, [abierto])

  // La opción activa siempre visible dentro del scroll de la lista.
  useEffect(() => {
    if (!abierto || indiceActivo < 0) return
    listaRef.current
      ?.querySelector(`#${CSS.escape(`${idBoton}-op-${indiceActivo}`)}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [abierto, indiceActivo, idBoton])

  return (
    <div
      ref={raizRef}
      className={`${estilos.desplegable} ${disabled ? estilos.deshabilitado : ''} ${className}`}
    >
      <button
        ref={botonRef}
        type="button"
        id={idBoton}
        className={estilos.boton}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-activedescendant={
          abierto && indiceActivo >= 0 ? `${idBoton}-op-${indiceActivo}` : undefined
        }
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={manejarTeclado}
      >
        <span className={estilos.valor}>{seleccionada?.etiqueta ?? ' '}</span>
        <svg
          className={`${estilos.flecha} ${abierto ? estilos.flechaAbierta : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierto && (
        <ul
          ref={listaRef}
          id={idLista}
          className={`${estilos.lista} ${alineadoDerecha ? estilos.alineadaDerecha : ''}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {opciones.map((opcion, indice) => (
            <li
              key={`${opcion.valor}-${indice}`}
              id={`${idBoton}-op-${indice}`}
              role="option"
              aria-selected={indice === indiceSeleccionado}
              aria-disabled={opcion.deshabilitada || undefined}
              className={[
                estilos.opcion,
                indice === indiceActivo ? estilos.activa : '',
                indice === indiceSeleccionado ? estilos.seleccionada : '',
                opcion.deshabilitada ? estilos.opcionDeshabilitada : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={(evento) => evento.preventDefault()}
              onClick={() => seleccionar(indice)}
              onMouseEnter={() => setIndiceActivo(indice)}
            >
              <span>{opcion.etiqueta}</span>
              {indice === indiceSeleccionado && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8.5l3.2 3L13 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
