import { descargarBlob } from './descargarArchivo'

const INSTITUCION = 'Superintendencia de Seguridad Social'

/** Escapa un campo CSV: comillas dobles si contiene coma, comilla o salto de línea. */
function escaparCampoCsv(valor) {
  const texto = String(valor ?? '')
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

/**
 * Arma el contenido CSV (sin librería): 3 líneas de encabezado
 * institucional, línea en blanco, encabezado de columnas y filas.
 */
export function generarCsv({ titulo, columnas, filas }) {
  const encabezado = [
    escaparCampoCsv(INSTITUCION),
    escaparCampoCsv(titulo),
    escaparCampoCsv(`Generado el ${new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}`),
    '',
    columnas.map((columna) => escaparCampoCsv(columna.etiqueta)).join(','),
  ]
  const lineasDatos = filas.map((fila) =>
    columnas.map((columna) => escaparCampoCsv(fila[columna.clave])).join(','),
  )
  return [...encabezado, ...lineasDatos].join('\r\n')
}

/** Descarga el CSV con BOM UTF-8, para que Excel abra tildes/ñ correctamente. */
export function descargarCsv(nombreArchivo, { titulo, columnas, filas }) {
  const contenido = generarCsv({ titulo, columnas, filas })
  const BOM_UTF8 = '﻿'
  const blob = new Blob([BOM_UTF8 + contenido], { type: 'text/csv;charset=utf-8;' })
  descargarBlob(blob, nombreArchivo)
}
