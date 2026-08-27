/**
 * Genera `entregables/manual-demo-sisga.pdf` (RQ-27, docs/16): captura
 * las pantallas de cada módulo con Playwright, compone el manual en HTML
 * y lo imprime a PDF con el motor Chromium. Corre con `pnpm dev` arriba
 * y el seed cargado.
 *
 *   node scripts/manual.mjs
 *   node scripts/manual.mjs --url https://demo.ejemplo.cl --api-key LLAVE
 *
 * Sin --url se usa un marcador visible: REGENERAR con la URL definitiva
 * antes de adjuntar a la oferta (T-03).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
process.loadEnvFile(path.join(raiz, '.env'))

const argumentos = process.argv.slice(2)
const valorDe = (bandera, porDefecto) => {
  const i = argumentos.indexOf(bandera)
  return i >= 0 ? argumentos[i + 1] : porDefecto
}
const URL_DEMO = valorDe('--url', '⟨URL-DE-LA-DEMO — completar al publicar⟩')
const CLAVE = valorDe('--clave', process.env.CLAVE_DEMO)
const API_KEY = valorDe('--api-key', process.env.API_DEMO_KEY)
// Con --origen las capturas salen de esa instancia (p. ej. la demo
// publicada); sin él, del entorno de desarrollo local.
const ORIGEN = valorDe('--origen', 'http://localhost:5173')

const destino = path.join(raiz, 'entregables')
const carpetaCapturas = path.join(destino, 'capturas-manual')

// --- Capturas de módulos -------------------------------------------------

const CAPTURAS = [
  { ruta: '/login', nombre: 'login', titulo: 'Inicio de sesión', anonima: true },
  { ruta: '/inicio', nombre: 'inicio', titulo: 'Panel de control' },
  { ruta: '/activos-fijos', nombre: 'activos', titulo: 'Activos fijos' },
  { ruta: '/almacen', nombre: 'almacen', titulo: 'Almacén' },
  { ruta: '/solicitudes', nombre: 'solicitudes', titulo: 'Solicitudes' },
  { ruta: '/alertas', nombre: 'alertas', titulo: 'Alertas' },
  { ruta: '/actas', nombre: 'actas', titulo: 'Actas de asignación y entrega' },
  { ruta: '/integraciones', nombre: 'integraciones', titulo: 'Integraciones (API pública)' },
  { ruta: '/reportes', nombre: 'reportes', titulo: 'Reportes' },
  { ruta: '/auditoria', nombre: 'auditoria', titulo: 'Auditoría' },
  { ruta: '/usuarios', nombre: 'usuarios', titulo: 'Usuarios' },
  { ruta: '/configuracion/importar', nombre: 'importar', titulo: 'Importar planilla' },
  { ruta: '/autoconsulta', nombre: 'portal', titulo: 'Portal de autoconsulta', funcionario: true },
]

async function capturarModulos() {
  await mkdir(carpetaCapturas, { recursive: true })
  const navegador = await chromium.launch()

  async function contextoDe(email) {
    const contexto = await navegador.newContext({
      viewport: { width: 1366, height: 768 },
      baseURL: ORIGEN,
    })
    if (email) {
      const r = await contexto.request.post('/api/auth/login', {
        data: { email, password: process.env.CLAVE_DEMO },
      })
      if (!r.ok()) throw new Error(`login ${email}: ${r.status()}`)
    }
    return contexto
  }

  const admin = await contextoDe('admin@demo.cl')
  const funcionario = await contextoDe('funcionario@demo.cl')
  const anonimo = await contextoDe(null)

  for (const captura of CAPTURAS) {
    const contexto = captura.anonima ? anonimo : captura.funcionario ? funcionario : admin
    const pagina = await contexto.newPage()
    await pagina.goto(captura.ruta)
    await pagina.waitForLoadState('networkidle')
    await pagina.waitForTimeout(400)
    await pagina.screenshot({ path: path.join(carpetaCapturas, `${captura.nombre}.png`) })
    await pagina.close()
    console.log(`  ✓ captura ${captura.nombre}`)
  }

  await admin.close()
  await funcionario.close()
  await anonimo.close()
  await navegador.close()
}

// --- Composición del manual ---------------------------------------------

async function imagen(nombre) {
  const datos = await readFile(path.join(carpetaCapturas, `${nombre}.png`))
  return `data:image/png;base64,${datos.toString('base64')}`
}

async function seccionModulo(nombre, titulo, descripcion) {
  return `
    <section class="modulo">
      <h3>${titulo}</h3>
      <p>${descripcion}</p>
      <img src="${await imagen(nombre)}" alt="${titulo}" />
    </section>`
}

async function generarHtml() {
  const modulos = [
    await seccionModulo('inicio', 'Panel de control', 'Indicadores del inventario (total de activos, valor inventariado, valor libro con depreciación al día, alertas vigentes, stock bajo mínimo y solicitudes pendientes), distribución por estado y categoría, y la actividad reciente del sistema.'),
    await seccionModulo('activos', 'Activos fijos', 'Listado con búsqueda combinada (texto, categoría, ubicación, responsable, estado), campo de escáner, selección para imprimir etiquetas y hoja mural por ubicación. Cada ficha reúne datos, adjuntos con fotografías, depreciación, historial y acciones (editar, trasladar, dar de baja, etiqueta).'),
    await seccionModulo('almacen', 'Almacén', 'Ítems de bodega con su stock y stock mínimo; cada ficha registra ingresos y egresos con kardex completo. Un egreso mayor al stock disponible queda bloqueado.'),
    await seccionModulo('solicitudes', 'Solicitudes', 'Bandeja de las solicitudes de insumos creadas desde el portal: aprobar, rechazar (con observación que el solicitante ve) o entregar — la entrega descuenta el stock automáticamente.'),
    await seccionModulo('alertas', 'Alertas', 'Mantenciones próximas y atrasadas, garantías por vencer, stock bajo mínimo, ítems sin stock y solicitudes pendientes. El número del menú lateral se actualiza solo.'),
    await seccionModulo('actas', 'Actas de asignación y entrega', 'Actas de recepción y entrega de bienes. Al cerrarse quedan protegidas con un sello de integridad que puede verificarse en pantalla en cualquier momento.'),
    await seccionModulo('integraciones', 'Integraciones (API pública)', 'Documentación viva de la API: cada endpoint tiene un botón "Probar" que ejecuta la llamada real, y la especificación OpenAPI 3.1 se descarga desde la misma pantalla. Incluye la exportación contable (SIGFE) y la consulta de órdenes de compra reales de mercadopublico.cl.'),
    await seccionModulo('reportes', 'Reportes', 'Inventario valorizado, depreciación (con proyección año a año) y movimientos, con filtros y descarga en PDF, Excel y CSV.'),
    await seccionModulo('auditoria', 'Auditoría', 'Bitácora de todas las acciones: quién hizo qué, cuándo y sobre qué folio. Filtros por usuario, módulo, acción, folio y fechas; exportable.'),
    await seccionModulo('usuarios', 'Usuarios', 'Administración de cuentas y roles: creación con clave temporal (el sistema fuerza el cambio al primer ingreso), activación/desactivación, desbloqueo y restablecimiento.'),
    await seccionModulo('importar', 'Importar planilla', 'Carga inicial desde la planilla Excel "Vista General": el sistema propone el mapeo de columnas, valida duplicados y errores, e importa miles de filas en segundos con folios correlativos.'),
    await seccionModulo('portal', 'Portal de autoconsulta', 'Para funcionarios sin perfil administrativo: buscar un bien por folio, código de barras o RFID; ver "Mis bienes"; crear solicitudes de insumos y seguir su estado.'),
  ]

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Segoe UI", Roboto, sans-serif; color: #1a2332; font-size: 11.5px; line-height: 1.55; }
  .portada { height: 96vh; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 0 48px; page-break-after: always; }
  .portada .marca { font-size: 46px; font-weight: 800; color: #074280; letter-spacing: 1px; }
  .portada .subtitulo { font-size: 18px; color: #33415c; }
  .portada .caja { margin-top: 26px; border: 1.5px solid #074280; border-radius: 10px; padding: 18px 22px; }
  .portada .caja h2 { font-size: 14px; color: #074280; margin-bottom: 8px; }
  .portada table { border-collapse: collapse; font-size: 12.5px; }
  .portada td { padding: 3px 14px 3px 0; }
  .portada code { font-family: Consolas, monospace; background: #eef2f7; padding: 1px 6px; border-radius: 4px; }
  .aviso { margin-top: 18px; background: #fff7e0; border: 1px solid #e0c060; border-radius: 8px; padding: 10px 14px; font-size: 11px; }
  h1 { font-size: 20px; color: #074280; border-bottom: 2px solid #074280; padding-bottom: 6px; margin: 26px 0 12px; page-break-after: avoid; }
  h3 { font-size: 14px; color: #074280; margin: 14px 0 4px; page-break-after: avoid; }
  p { margin-bottom: 6px; }
  .cuerpo { padding: 0 40px; }
  .modulo { page-break-inside: avoid; margin-bottom: 14px; }
  .modulo img { width: 100%; border: 1px solid #ccd4e0; border-radius: 6px; margin-top: 4px; }
  table.plan { border-collapse: collapse; width: 100%; margin: 8px 0; }
  table.plan th, table.plan td { border: 1px solid #ccd4e0; padding: 5px 8px; text-align: left; vertical-align: top; }
  table.plan th { background: #eef2f7; color: #074280; }
  ul, ol { margin: 4px 0 8px 20px; }
  li { margin-bottom: 3px; }
  code { font-family: Consolas, monospace; background: #eef2f7; padding: 0 4px; border-radius: 3px; }
  .pie { color: #667; font-size: 10px; margin-top: 20px; }
</style>
</head>
<body>

<div class="portada">
  <div class="marca">SISGA</div>
  <div class="subtitulo">Sistema Integral de Gestión de Activos Fijos y Almacén<br/>Manual de uso de la demostración — Licitación 1607-11-LE26</div>
  <div class="caja">
    <h2>Acceso a la demostración</h2>
    <table>
      <tr><td><strong>URL</strong></td><td><code>${URL_DEMO}</code></td></tr>
      <tr><td><strong>Cuentas</strong></td><td>admin@demo.cl · gestor@demo.cl · consulta@demo.cl · funcionario@demo.cl</td></tr>
      <tr><td><strong>Clave (todas)</strong></td><td><code>${CLAVE}</code></td></tr>
      <tr><td><strong>Llave de la API</strong></td><td><code>${API_KEY}</code> (cabecera <code>X-API-Key</code>)</td></tr>
    </table>
    <p style="margin-top:8px">En la pantalla de inicio de sesión, las cuatro tarjetas completan el formulario con un clic. Cada cuenta muestra el sistema según su rol.</p>
  </div>
  <div class="aviso"><strong>Entorno de demostración.</strong> Todos los datos son ficticios: nombres, correos y bienes fueron inventados para esta evaluación y no corresponden a personas ni registros reales. La demostración permanece en línea de forma continua durante todo el período de evaluación.</div>
  <p class="pie">Aeroconce Servicios SpA — agosto de 2026</p>
</div>

<div class="cuerpo">

<h1>1 · Ruta sugerida de revisión (15 minutos)</h1>
<p>La secuencia cubre los siete contenidos mínimos exigidos y los tres elementos adicionales declarados. Los tiempos son referenciales; cada paso indica la ruta dentro del sistema.</p>
<table class="plan">
  <tr><th style="width:44px">Min.</th><th>Paso</th><th>Qué observar</th></tr>
  <tr><td>0–1</td><td>Entrar con la tarjeta <strong>Administrador</strong></td><td>Banner de demostración permanente; panel con indicadores reales del inventario (529 activos).</td></tr>
  <tr><td>1–3</td><td><strong>Activos fijos</strong>: buscar, abrir una ficha, crear un activo</td><td>Búsqueda combinada; folio correlativo automático; ficha con depreciación, adjuntos e historial.</td></tr>
  <tr><td>3–5</td><td>En la ficha: <strong>trasladar</strong> el activo y revisar el historial</td><td>El traslado queda en el historial del bien y en la Auditoría (dos registros distintos).</td></tr>
  <tr><td>5–7</td><td><strong>Almacén</strong>: abrir un ítem, registrar un ingreso y probar un egreso mayor al stock</td><td>Kardex al día; el egreso imposible queda bloqueado con un mensaje claro.</td></tr>
  <tr><td>7–8</td><td><strong>Alertas</strong></td><td>Mantenciones, garantías, stock bajo mínimo y solicitudes pendientes; coincide con el número del menú.</td></tr>
  <tr><td>8–10</td><td><strong>Reportes</strong>: depreciación y descargas</td><td>Cálculo lineal mensual visible por activo; PDF, Excel y CSV descargan.</td></tr>
  <tr><td>10–12</td><td><strong>Integraciones</strong>: botón "Probar" y Mercado Público</td><td>La API responde en vivo con la llave; una orden de compra REAL de mercadopublico.cl consultada y vinculada a un activo.</td></tr>
  <tr><td>12–13</td><td><strong>Usuarios</strong>: crear uno con clave temporal</td><td>El sistema fuerza el cambio de clave al primer ingreso (puede probarse en una ventana de incógnito).</td></tr>
  <tr><td>13–15</td><td>Salir y entrar como <strong>Funcionario</strong></td><td>El portal de autoconsulta: "Mis bienes", crear una solicitud de insumos y (de vuelta como Administrador) aprobarla y entregarla — el stock se descuenta.</td></tr>
</table>

<h1>2 · Los módulos</h1>
${modulos.join('\n')}

<h1>3 · Convenciones de depreciación</h1>
<ul>
  <li><strong>Método:</strong> lineal <strong>mensual</strong>, con valor residual de $1. El mes de compra se deprecia completo.</li>
  <li><strong>Vida útil:</strong> tabla por categoría según la Resolución Exenta SII N°43 de 2002 (referencial), editable por el Administrador en Configuración → Vida útil, incluida la vida acelerada opcional.</li>
  <li><strong>Dónde se ve:</strong> la ficha de cada activo (cuota mensual, acumulada, valor libro y evolución año a año), el panel (valor libro total) y el reporte de depreciación. Todos usan el mismo cálculo.</li>
</ul>

<h1>4 · El escáner, sin lector físico</h1>
<p>Los lectores USB de código de barras y RFID escriben como un teclado y terminan con Enter. Por eso el campo "Escanear" (en Activos fijos y Almacén) se demuestra <strong>tipeando</strong>: escriba un folio (<code>AF-2026-0001</code>), un código de barras (<code>7801112223334</code>) o un RFID (<code>RFID-A001</code>) y presione Enter — el sistema abre la ficha, igual que lo haría con el lector conectado. Un código no registrado ofrece dar de alta el bien con ese código ya precargado. La propuesta incluye el equipamiento PDA cotizado.</p>

<h1>5 · La API para integraciones</h1>
<ul>
  <li>La documentación viva está en <strong>Integraciones</strong> dentro de la demo: cada endpoint tiene un botón "Probar" que ejecuta la llamada real.</li>
  <li>La especificación <strong>OpenAPI 3.1</strong> (<code>openapi.yaml</code>) se descarga desde esa pantalla y acompaña esta oferta.</li>
  <li>Autenticación por cabecera <code>X-API-Key</code> con la llave indicada en la portada; límite de 60 consultas por minuto.</li>
  <li>Cubre: activos con filtros, depreciación por activo, exportación contable para SIGFE, asientos mensuales, almacén con kardex, movimientos y un webhook de confirmación.</li>
</ul>

<h1>6 · Respaldo y soporte</h1>
<ul>
  <li><strong>Respaldo automático diario:</strong> copia de la base de datos (pg_dump) y de los archivos adjuntos, con rotación de 14 días. La restauración fue ensayada como parte de la preparación de esta demo.</li>
  <li><strong>Reinicio de la demostración:</strong> el Administrador puede restaurar los datos de ejemplo desde Configuración → Reiniciar demo; la demostración vuelve exactamente al estado inicial.</li>
  <li><strong>Canal de soporte durante la evaluación:</strong> contacto@aeroconce.cl — respuesta dentro del día hábil.</li>
</ul>

<p class="pie">SISGA · Manual de uso de la demostración · Los datos exhibidos son ficticios · Aeroconce Servicios SpA</p>
</div>
</body>
</html>`
}

// --- PDF -----------------------------------------------------------------

console.log('Capturando módulos…')
await capturarModulos()
console.log('Componiendo el manual…')
const html = await generarHtml()
const rutaHtml = path.join(destino, 'capturas-manual', 'manual.html')
await writeFile(rutaHtml, html)

const navegador = await chromium.launch()
const pagina = await navegador.newPage()
await pagina.goto(`file:///${rutaHtml.replace(/\\/g, '/')}`)
await pagina.pdf({
  path: path.join(destino, 'manual-demo-sisga.pdf'),
  format: 'A4',
  margin: { top: '14mm', bottom: '14mm', left: '0mm', right: '0mm' },
  printBackground: true,
})
await navegador.close()
console.log(`Listo: ${path.join(destino, 'manual-demo-sisga.pdf')}`)
