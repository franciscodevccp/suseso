/**
 * Genera (una vez, se commitea el resultado):
 *  - server/prisma/adjuntos-seed/foto-XX.jpg — 12 fotografías referenciales
 *    ficticias de bienes (canvas institucional) para que el seed las
 *    reparta en fichas de activos (RQ-12).
 *  - server/prisma/adjuntos-seed/{garantia,manual}.pdf — documentos de
 *    muestra.
 *  - entregables/foto-muestra-gps.jpg — una foto CON coordenadas GPS
 *    reales en su EXIF (Huérfanos 1376, Santiago), para que la comisión
 *    pruebe RQ-22 subiéndola desde el PC: el sistema extrae el GPS y
 *    ofrece "Ver en mapa". El EXIF se construye a mano y se VERIFICA con
 *    exifr (la misma librería que usa el servidor).
 *
 *   node scripts/generar-adjuntos-seed.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { jsPDF } from 'jspdf'
import exifr from 'exifr'

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const carpetaSeed = path.join(raiz, 'server', 'prisma', 'adjuntos-seed')

const TIPOS = [
  ['Notebook institucional', '💻', '#0b3d6e'],
  ['Monitor de escritorio', '🖥️', '#123f63'],
  ['Escritorio de trabajo', '🗄️', '#5a4632'],
  ['Silla ergonómica', '🪑', '#41475a'],
  ['Proyector de sala', '📽️', '#31445e'],
  ['Aire acondicionado', '❄️', '#2b5566'],
  ['Teléfono IP', '☎️', '#243d55'],
  ['Impresora multifuncional', '🖨️', '#3d4451'],
  ['Estante metálico', '📚', '#4c4438'],
  ['Vehículo institucional', '🚚', '#2f4a3e'],
  ['Generador eléctrico', '⚡', '#4f4020'],
  ['Cajonera móvil', '🗃️', '#3f3a52'],
]

async function generarFotos() {
  await mkdir(carpetaSeed, { recursive: true })
  const navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 800, height: 600 } })

  for (let i = 0; i < TIPOS.length; i++) {
    const [nombre, icono, color] = TIPOS[i]
    await pagina.setContent(`
      <body style="margin:0">
      <div style="width:800px;height:600px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
                  background:linear-gradient(160deg, ${color} 0%, #0a1626 100%);font-family:'Segoe UI',sans-serif;color:#fff">
        <div style="font-size:150px;line-height:1">${icono}</div>
        <div style="font-size:30px;font-weight:700">${nombre}</div>
        <div style="font-size:16px;opacity:.75">Fotografía referencial — bien ficticio de demostración</div>
        <div style="position:absolute;bottom:22px;font-size:13px;opacity:.55;letter-spacing:1px">SISGA · SUSESO · datos ficticios</div>
      </div></body>`)
    await pagina.screenshot({
      path: path.join(carpetaSeed, `foto-${String(i + 1).padStart(2, '0')}.jpg`),
      type: 'jpeg',
      quality: 72,
    })
  }
  await navegador.close()
  console.log(`✓ ${TIPOS.length} fotografías en server/prisma/adjuntos-seed/`)
}

function generarPdfs() {
  const garantia = new jsPDF()
  garantia.setFontSize(18)
  garantia.text('Certificado de garantía (documento ficticio)', 20, 30)
  garantia.setFontSize(11)
  garantia.text(
    [
      'Proveedor: Comercializadora Demo SpA — RUT ficticio',
      'Bien: equipo institucional de demostración',
      'Vigencia: 24 meses desde la recepción conforme.',
      '',
      'Documento de EJEMPLO para la demostración SISGA (licitación 1607-11-LE26).',
      'No corresponde a una garantía real.',
    ],
    20,
    50,
  )
  garantia.save(path.join(carpetaSeed, 'garantia.pdf'))

  const manual = new jsPDF()
  manual.setFontSize(18)
  manual.text('Manual del equipo (documento ficticio)', 20, 30)
  manual.setFontSize(11)
  manual.text(
    [
      '1. Encendido y apagado seguro.',
      '2. Mantención preventiva sugerida cada 6 meses.',
      '3. Contacto de soporte del proveedor.',
      '',
      'Documento de EJEMPLO para la demostración SISGA. Datos ficticios.',
    ],
    20,
    50,
  )
  manual.save(path.join(carpetaSeed, 'manual.pdf'))
  console.log('✓ garantia.pdf y manual.pdf')
}

// --- EXIF GPS construido a mano (APP1/TIFF/GPS IFD) ---------------------

function racional(valor) {
  const denominador = 10000
  return [Math.round(valor * denominador), denominador]
}

function gradosMinutosSegundos(decimal) {
  const absoluto = Math.abs(decimal)
  const grados = Math.floor(absoluto)
  const minutos = Math.floor((absoluto - grados) * 60)
  const segundos = ((absoluto - grados) * 60 - minutos) * 60
  return [[grados, 1], [minutos, 1], racional(segundos)]
}

/** Segmento APP1 Exif con SOLO el IFD GPS (suficiente para exifr y el servidor). */
function segmentoExifGps(latitud, longitud) {
  const partes = []
  const u16 = (n) => partes.push([n >> 8, n & 0xff])
  const u32 = (n) => partes.push([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
  const bytes = (...b) => partes.push(b)

  // Cabecera TIFF big-endian.
  bytes(0x4d, 0x4d) // MM
  u16(42)
  u32(8) // offset del IFD0

  // IFD0: una sola entrada (puntero al GPS IFD, tag 0x8825).
  u16(1)
  u16(0x8825)
  u16(4) // LONG
  u32(1)
  const offsetGpsIfd = 8 + 2 + 12 + 4 // tras IFD0
  u32(offsetGpsIfd)
  u32(0) // sin siguiente IFD

  // GPS IFD: 4 entradas (LatRef, Lat, LonRef, Lon).
  const entradas = 4
  const finEntradas = offsetGpsIfd + 2 + entradas * 12 + 4
  u16(entradas)

  const latRef = latitud >= 0 ? 'N' : 'S'
  const lonRef = longitud >= 0 ? 'E' : 'W'

  // 1: GPSLatitudeRef (ASCII 2, cabe inline)
  u16(1); u16(2); u32(2); bytes(latRef.charCodeAt(0), 0, 0, 0)
  // 2: GPSLatitude (3 RATIONAL = 24 bytes, fuera de línea)
  u16(2); u16(5); u32(3); u32(finEntradas)
  // 3: GPSLongitudeRef
  u16(3); u16(2); u32(2); bytes(lonRef.charCodeAt(0), 0, 0, 0)
  // 4: GPSLongitude
  u16(4); u16(5); u32(3); u32(finEntradas + 24)
  u32(0) // sin siguiente IFD

  // Datos fuera de línea: 6 racionales.
  for (const [numerador, denominador] of [
    ...gradosMinutosSegundos(latitud),
    ...gradosMinutosSegundos(longitud),
  ]) {
    u32(numerador)
    u32(denominador)
  }

  const tiff = Buffer.from(partes.flat())
  const cuerpo = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff])
  const app1 = Buffer.alloc(4)
  app1[0] = 0xff
  app1[1] = 0xe1
  app1.writeUInt16BE(cuerpo.length + 2, 2)
  return Buffer.concat([app1, cuerpo])
}

async function generarFotoConGps() {
  // Huérfanos 1376, Santiago Centro (sede SUSESO).
  const LAT = -33.44012
  const LNG = -70.65243

  const original = await readFile(path.join(carpetaSeed, 'foto-01.jpg'))
  if (!(original[0] === 0xff && original[1] === 0xd8)) throw new Error('foto-01.jpg no es JPEG')

  // Insertar APP1 justo después del SOI (antes de cualquier otro segmento).
  const conGps = Buffer.concat([
    original.subarray(0, 2),
    segmentoExifGps(LAT, LNG),
    original.subarray(2),
  ])
  const destino = path.join(raiz, 'entregables', 'foto-muestra-gps.jpg')
  await writeFile(destino, conGps)

  // Verificación con la MISMA librería que usa el servidor.
  const gps = await exifr.gps(destino)
  if (!gps || Math.abs(gps.latitude - LAT) > 0.001 || Math.abs(gps.longitude - LNG) > 0.001) {
    throw new Error(`EXIF GPS no verificó: ${JSON.stringify(gps)}`)
  }
  console.log(`✓ entregables/foto-muestra-gps.jpg con GPS verificado: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`)
}

await generarFotos()
generarPdfs()
await generarFotoConGps()
