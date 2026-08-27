import { forwardRef } from 'react'
import estilos from './Button.module.css'

/**
 * Botón institucional con variantes primaria/secundaria. Cuando `disabled`
 * es verdadero puede mostrar una `etiqueta` auxiliar (ej. "Próximamente").
 * Por defecto ocupa el ancho completo de su contenedor (los formularios de
 * acceso lo dan por sentado); pasar `anchoCompleto={false}` para un botón
 * en línea que solo ocupe su contenido (ej. dentro de una barra superior).
 */
export const Button = forwardRef(function Button(
  {
    children,
    variante = 'primario',
    tipo = 'button',
    etiqueta,
    anchoCompleto = true,
    className = '',
    ...resto
  },
  ref,
) {
  return (
    <span className={`${estilos.contenedor} ${anchoCompleto ? estilos.anchoCompleto : ''}`}>
      <button
        ref={ref}
        type={tipo}
        className={`${estilos.boton} ${estilos[variante]} ${className}`}
        {...resto}
      >
        {children}
      </button>
      {etiqueta && <span className={estilos.etiqueta}>{etiqueta}</span>}
    </span>
  )
})
