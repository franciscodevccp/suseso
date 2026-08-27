import { useEffect, useId, useRef, useState } from 'react'
import estilos from './CampoFecha.module.css'

/**
 * Selector de fecha con calendario de diseño propio (misma decisión que
 * Desplegable, docs/17: el popup nativo del <input type="date"> no es
 * estilizable). Contrato igual al input: `value` en formato AAAA-MM-DD
 * (o "") y `onChange` con `{ target: { name, value } }`.
 *
 * Todo se calcula con componentes de fecha LOCALES (nunca toISOString),
 * para que la fecha elegida no se corra un día por zona horaria.
 */
// Abreviaturas chilenas (la "X" de miércoles es convención de España).
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const aIso = (anio, mes, dia) =>
  `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

function desdeIso(valor) {
  if (!valor) return null
  const [anio, mes, dia] = valor.split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return { anio, mes: mes - 1, dia }
}

function nombreMes(anio, mes) {
  const texto = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(anio, mes, 1),
  )
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const formatearVisible = (valor) => {
  const fecha = desdeIso(valor)
  if (!fecha) return null
  return `${String(fecha.dia).padStart(2, '0')}-${String(fecha.mes + 1).padStart(2, '0')}-${fecha.anio}`
}

export function CampoFecha({
  id,
  name,
  value = '',
  onChange,
  className = '',
  placeholder = 'Cualquier fecha',
  'aria-label': ariaLabel,
  disabled = false,
}) {
  const idGenerado = useId()
  const idBoton = id ?? idGenerado
  const hoy = new Date()
  const seleccionada = desdeIso(value)

  const [abierto, setAbierto] = useState(false)
  const [alineadoDerecha, setAlineadoDerecha] = useState(false)
  const [vista, setVista] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() })
  const raizRef = useRef(null)
  const botonRef = useRef(null)
  const cuadriculaRef = useRef(null)

  function abrir() {
    if (disabled) return
    const base = seleccionada ?? { anio: hoy.getFullYear(), mes: hoy.getMonth() }
    setVista({ anio: base.anio, mes: base.mes })
    // Si el calendario (~280 px) no cabe hacia la derecha, se ancla al
    // borde derecho del control para no cortarse contra la ventana.
    const caja = raizRef.current?.getBoundingClientRect()
    setAlineadoDerecha(Boolean(caja && caja.left + 280 > window.innerWidth))
    setAbierto(true)
  }

  function cerrar() {
    setAbierto(false)
    botonRef.current?.focus()
  }

  function emitir(valorIso) {
    onChange?.({ target: { name, value: valorIso } })
    cerrar()
  }

  function moverMes(paso) {
    setVista(({ anio, mes }) => {
      const fecha = new Date(anio, mes + paso, 1)
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() }
    })
  }

  // Clic fuera del componente: se cierra (sin devolver el foco).
  useEffect(() => {
    if (!abierto) return undefined
    function alPresionarFuera(evento) {
      if (!raizRef.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alPresionarFuera)
    return () => document.removeEventListener('pointerdown', alPresionarFuera)
  }, [abierto])

  // Al abrir, el foco va al día seleccionado (o a hoy, o al 1°).
  useEffect(() => {
    if (!abierto) return
    const objetivo =
      cuadriculaRef.current?.querySelector('[data-preferido="si"]') ??
      cuadriculaRef.current?.querySelector('button[data-dia]')
    objetivo?.focus()
  }, [abierto, vista])

  function manejarTecladoCuadricula(evento) {
    const actual = Number(evento.target.dataset?.dia)
    if (evento.key === 'Escape') {
      evento.preventDefault()
      return cerrar()
    }
    if (!actual) return

    const saltos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (evento.key in saltos) {
      evento.preventDefault()
      const destino = actual + saltos[evento.key]
      const enMes = cuadriculaRef.current?.querySelector(`button[data-dia="${destino}"]`)
      if (enMes) return enMes.focus()
      // Se salió del mes: avanza/retrocede y el efecto reenfoca.
      moverMes(destino < 1 ? -1 : 1)
      return
    }
    if (evento.key === 'PageUp') {
      evento.preventDefault()
      moverMes(-1)
    } else if (evento.key === 'PageDown') {
      evento.preventDefault()
      moverMes(1)
    }
  }

  const totalDias = new Date(vista.anio, vista.mes + 1, 0).getDate()
  // Lunes como primer día de la semana (getDay(): domingo = 0).
  const huecos = (new Date(vista.anio, vista.mes, 1).getDay() + 6) % 7
  const esHoy = (dia) =>
    vista.anio === hoy.getFullYear() && vista.mes === hoy.getMonth() && dia === hoy.getDate()
  const esSeleccionado = (dia) =>
    seleccionada &&
    seleccionada.anio === vista.anio &&
    seleccionada.mes === vista.mes &&
    seleccionada.dia === dia

  const textoVisible = formatearVisible(value)

  return (
    <div
      ref={raizRef}
      className={`${estilos.campo} ${disabled ? estilos.deshabilitado : ''} ${className}`}
    >
      <button
        ref={botonRef}
        type="button"
        id={idBoton}
        className={estilos.boton}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={(evento) => {
          if (!abierto && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(evento.key)) {
            evento.preventDefault()
            abrir()
          }
        }}
      >
        <span className={textoVisible ? estilos.valor : estilos.marcador}>
          {textoVisible ?? placeholder}
        </span>
        <svg className={estilos.icono} width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 6h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div
          className={`${estilos.calendario} ${alineadoDerecha ? estilos.alineadoDerecha : ''}`}
          role="dialog"
          aria-label="Elegir fecha"
        >
          <div className={estilos.cabecera}>
            <button type="button" className={estilos.navegacion} aria-label="Mes anterior" onClick={() => moverMes(-1)}>
              ‹
            </button>
            <span className={estilos.mes}>{nombreMes(vista.anio, vista.mes)}</span>
            <button type="button" className={estilos.navegacion} aria-label="Mes siguiente" onClick={() => moverMes(1)}>
              ›
            </button>
          </div>

          <div className={estilos.diasSemana} aria-hidden="true">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>

          <div ref={cuadriculaRef} className={estilos.cuadricula} onKeyDown={manejarTecladoCuadricula}>
            {Array.from({ length: huecos }, (_, i) => (
              <span key={`hueco-${i}`} />
            ))}
            {Array.from({ length: totalDias }, (_, i) => {
              const dia = i + 1
              const preferido = esSeleccionado(dia) || (!seleccionada && esHoy(dia))
              return (
                <button
                  key={dia}
                  type="button"
                  data-dia={dia}
                  data-preferido={preferido ? 'si' : undefined}
                  className={[
                    estilos.dia,
                    esHoy(dia) ? estilos.diaHoy : '',
                    esSeleccionado(dia) ? estilos.diaSeleccionado : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`${dia} de ${nombreMes(vista.anio, vista.mes)}`}
                  aria-pressed={esSeleccionado(dia) || undefined}
                  onClick={() => emitir(aIso(vista.anio, vista.mes, dia))}
                >
                  {dia}
                </button>
              )
            })}
          </div>

          <div className={estilos.pie}>
            <button
              type="button"
              className={estilos.atajo}
              onClick={() => emitir(aIso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))}
            >
              Hoy
            </button>
            {value && (
              <button type="button" className={estilos.atajo} onClick={() => emitir('')}>
                Borrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
