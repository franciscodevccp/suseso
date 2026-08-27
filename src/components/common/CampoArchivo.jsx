import estilos from './CampoArchivo.module.css'

/**
 * Selector de archivo con diseño propio (el control nativo no es
 * estilizable, misma decisión que Desplegable/CampoFecha): botón +
 * nombre del archivo elegido. El input real queda oculto pero accesible
 * (el teclado enfoca el botón y Enter/Espacio abren el diálogo).
 *
 * Controlado: recibe `archivo` (File o null) y avisa con `onSeleccionar`.
 */
export function CampoArchivo({ archivo, onSeleccionar, accept, capture, className = '', 'aria-label': ariaLabel }) {
  return (
    <span className={`${estilos.campo} ${className}`}>
      <label className={estilos.boton}>
        Seleccionar archivo
        <input
          type="file"
          className={estilos.entradaOculta}
          accept={accept}
          capture={capture}
          aria-label={ariaLabel}
          onClick={(evento) => {
            // Permite volver a elegir el mismo archivo tras limpiar.
            evento.target.value = ''
          }}
          onChange={(evento) => onSeleccionar(evento.target.files?.[0] ?? null)}
        />
      </label>
      <span className={archivo ? estilos.nombre : estilos.sinArchivo}>
        {archivo ? archivo.name : 'Ningún archivo seleccionado'}
      </span>
    </span>
  )
}
