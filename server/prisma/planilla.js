/**
 * Genera `entregables/planilla-ejemplo-vista-general.xlsx` con 3.530
 * filas en el formato de la respuesta 8 del foro (docs/12): codificación,
 * descripción/nombre, características, ubicación física, categoría,
 * valores contables, fecha de adquisición, responsable y serie.
 *
 * Los códigos usan OTRO prefijo EAN (779) para no chocar con los activos
 * sembrados: la demostración en vivo importa la planilla completa y
 * `pnpm db:seed` devuelve todo al estado inicial (RQ-24, criterio B.3).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import {
  AREAS_HUERFANOS,
  TIPOS_ACTIVO,
  crearAzar,
  crearGeneradorEan,
  generarFuncionarios,
} from './generadores.js'

const TOTAL_FILAS = 3530

export async function generarPlanilla(rutaSalida) {
  const rng = crearAzar(19870513)
  const ean = crearGeneradorEan('779', 500000)
  const funcionarios = generarFuncionarios(rng)
  const ubicaciones = AREAS_HUERFANOS.map((area) => `Huérfanos 1376 — ${area}`)

  const libro = new ExcelJS.Workbook()
  libro.creator = 'SISGA — planilla de ejemplo para migración'
  const hoja = libro.addWorksheet('Vista General')

  hoja.columns = [
    { header: 'Código', key: 'codigo', width: 18 },
    { header: 'Nombre / Descripción', key: 'nombre', width: 40 },
    { header: 'Características', key: 'caracteristicas', width: 45 },
    { header: 'Ubicación física', key: 'ubicacion', width: 42 },
    { header: 'Categoría', key: 'categoria', width: 28 },
    { header: 'Valor contable', key: 'valor', width: 16 },
    { header: 'Fecha adquisición', key: 'fecha', width: 18 },
    { header: 'Responsable', key: 'responsable', width: 30 },
    { header: 'Serie', key: 'serie', width: 20 },
  ]
  hoja.getRow(1).font = { bold: true }

  let serieContador = 90000
  for (let fila = 0; fila < TOTAL_FILAS; fila++) {
    const tipo = TIPOS_ACTIVO[Math.floor(rng.azar() * TIPOS_ACTIVO.length)]
    const nombre = rng.de(tipo.modelos)
    const agno = rng.entero(2019, 2026)
    const mes = agno === 2026 ? rng.entero(1, 7) : rng.entero(1, 12)
    const fecha = `${String(rng.entero(1, 28)).padStart(2, '0')}-${String(mes).padStart(2, '0')}-${agno}`

    hoja.addRow({
      codigo: ean(),
      nombre,
      caracteristicas: `${tipo.descripcion} Estado de conservación ${rng.de(['bueno', 'regular', 'muy bueno'])}.`,
      ubicacion: rng.de(ubicaciones),
      categoria: tipo.categoria,
      valor: rng.entero(tipo.valor[0] / 1000, tipo.valor[1] / 1000) * 1000,
      fecha,
      responsable: rng.de(funcionarios).nombre,
      serie: tipo.serie ? `SN-${agno}-${serieContador++}` : '',
    })
  }

  await mkdir(path.dirname(rutaSalida), { recursive: true })
  await libro.xlsx.writeFile(rutaSalida)
  return { archivo: rutaSalida, filas: TOTAL_FILAS }
}
