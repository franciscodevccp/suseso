/**
 * La pasada principal de la demo (docs/15 §E2E, docs/16): los flujos que
 * la comisión ejecuta en la revisión de 15 minutos, de punta a punta y
 * en serie. Solo escritorio: son flujos con datos compartidos.
 */
import { expect, test } from '@playwright/test'
import { esperarContenido } from './utilidades.js'

test.describe.configure({ mode: 'serial' })

const soloEscritorio = (testInfo) =>
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')

test('crear un activo, trasladarlo, y verlo en historial y auditoría', async ({ page }, testInfo) => {
  soloEscritorio(testInfo)

  // Alta con folio correlativo.
  await page.goto('/activos-fijos/nuevo')
  await esperarContenido(page)
  await page.getByLabel('Nombre', { exact: true }).fill('Proyector de prueba E2E')
  await page.getByLabel('Categoría').click()
  await page.getByRole('option', { name: 'Equipos audiovisuales' }).click()
  await page.getByLabel('Ubicación', { exact: true }).click()
  await page.getByRole('option', { name: 'Huérfanos 1376 — Piso 8, Sala de consejo' }).click()
  await page.getByLabel('Valor (CLP)').fill('450000')
  await page.getByRole('button', { name: 'Crear activo' }).click()
  await page.waitForURL('**/activos-fijos')

  // Aparece en el listado; entrar a la ficha por el nombre.
  await page.getByPlaceholder(/Buscar por folio/).fill('Proyector de prueba E2E')
  // .first(): corridas repetidas sin reseed acumulan proyectores de prueba.
  const filaNueva = page.locator('tr', { hasText: 'Proyector de prueba E2E' }).first()
  await expect(filaNueva).toBeVisible()
  const folio = await filaNueva.locator('a').first().textContent()
  expect(folio).toMatch(/^AF-\d{4}-\d{4}$/)
  await filaNueva.locator('a').first().click()
  await esperarContenido(page)

  // Traslado con el modal.
  await page.getByRole('button', { name: 'Trasladar' }).click()
  await page.getByLabel('Nueva ubicación').click()
  await page.getByRole('option', { name: 'Huérfanos 1376 — Piso 1, Oficina de partes' }).click()
  await page.getByRole('button', { name: /Confirmar traslado|Trasladar/ }).last().click()

  // El historial del bien lo registra.
  await expect(page.getByText('Huérfanos 1376 — Piso 1, Oficina de partes').first()).toBeVisible()
  await expect(page.getByText(/Traslado de/).first()).toBeVisible()

  // Y la auditoría del sistema también (docs/05: cosas distintas).
  await page.goto(`/auditoria?folio=${folio}`)
  await esperarContenido(page)
  const filasAuditoria = page.locator('tr', { hasText: folio })
  await expect(filasAuditoria.first()).toBeVisible()
})

test('kardex de almacén: ingreso suma y egreso sin stock queda bloqueado', async ({ page }, testInfo) => {
  soloEscritorio(testInfo)

  await page.goto('/almacen')
  await esperarContenido(page)
  await page.locator('tr', { hasText: 'Tóner HP 26A' }).locator('a').first().click()
  await esperarContenido(page)

  const tarjetaStock = page.locator('section', { hasText: 'Stock actual' }).first()
  const stockAntes = Number((await tarjetaStock.innerText()).match(/\d+/)[0])

  // Ingreso de 5: el stock y el kardex reaccionan.
  await page.getByRole('button', { name: 'Registrar ingreso' }).click()
  await page.getByLabel('Cantidad').fill('5')
  await page.getByLabel('Motivo').fill('Reposición de prueba E2E')
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(tarjetaStock).toContainText(String(stockAntes + 5))
  await expect(page.getByText('Reposición de prueba E2E').first()).toBeVisible()

  // Egreso imposible: mensaje claro y el stock no cambia.
  await page.getByRole('button', { name: 'Registrar egreso' }).click()
  await page.getByLabel('Cantidad').fill('99999')
  await page.getByLabel('Motivo').fill('Intento inválido')
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText(/stock disponible|insuficiente/i).first()).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(tarjetaStock).toContainText(String(stockAntes + 5))
})

test('los reportes descargan en PDF, Excel y CSV', async ({ page }, testInfo) => {
  soloEscritorio(testInfo)

  await page.goto('/reportes')
  await esperarContenido(page)
  await expect(page.getByRole('button', { name: 'Descargar PDF' })).toBeEnabled()

  for (const formato of ['PDF', 'Excel', 'CSV']) {
    const descarga = page.waitForEvent('download')
    await page.getByRole('button', { name: `Descargar ${formato}` }).click()
    const archivo = await descarga
    expect(archivo.suggestedFilename().length).toBeGreaterThan(4)
  }
})

test('búsqueda combinada: ubicación + estado + texto', async ({ page }, testInfo) => {
  soloEscritorio(testInfo)

  await page.goto('/activos-fijos')
  await esperarContenido(page)

  await page.getByLabel('Filtrar por ubicación').click()
  await page.getByRole('option', { name: 'Huérfanos 1376 — Piso 5, Tecnologías de la Información' }).click()
  await page.getByLabel('Filtrar por estado').click()
  await page.getByRole('option', { name: 'Activo', exact: true }).click()
  await page.getByPlaceholder(/Buscar por folio/).fill('Notebook')

  // Aserciones con reintento: el listado refetcha tras cada filtro.
  const filas = page.locator('tbody tr')
  await expect(filas.first()).toContainText('Notebook')
  await expect(filas.filter({ hasText: 'En reparación' })).toHaveCount(0)
  await expect(filas.filter({ hasText: 'Extraviado' })).toHaveCount(0)
  const sinUbicacion = filas.filter({
    hasNotText: 'Piso 5, Tecnologías de la Información',
  })
  await expect(sinUbicacion).toHaveCount(0)
})

test('el badge de alertas coincide con el listado', async ({ page }, testInfo) => {
  soloEscritorio(testInfo)

  await page.goto('/alertas')
  await esperarContenido(page)
  const badge = page
    .getByRole('link', { name: /^Alertas \(\d+\)$/ })
    .getByText(/^\d+$/)
  const numeroBadge = Number(await badge.textContent())
  expect(numeroBadge).toBeGreaterThan(0)

  const filas = await page.locator('tbody tr').count()
  expect(filas).toBe(numeroBadge)
})

test('crear un usuario con clave temporal y completar el cambio obligatorio', async ({ page, browser }, testInfo) => {
  soloEscritorio(testInfo)

  await page.goto('/usuarios')
  await esperarContenido(page)
  await page.getByRole('button', { name: 'Nuevo usuario' }).click()
  const correo = `prueba.pasada.${Date.now() % 100000}@demo.cl`
  await page.getByLabel('Nombre').fill('Usuario Pasada E2E')
  await page.getByLabel('Correo').fill(correo)
  await page.getByLabel('Rol').click()
  await page.getByRole('option', { name: 'Consulta' }).click()
  await page.getByRole('button', { name: 'Crear usuario' }).click()

  // La clave temporal se muestra UNA vez.
  const claveTemporal = (await page.locator('code, pre').first().textContent()).trim()
  expect(claveTemporal.length).toBeGreaterThanOrEqual(8)
  await page.getByRole('button', { name: /Entendido|Cerrar/ }).click()

  // Entrar con la temporal fuerza el cambio de clave — en un CONTEXTO
  // LIMPIO: hacerlo con la cookie compartida del administrador haría que
  // el regenerate del login destruyera esa sesión para toda la suite.
  const contextoNuevo = await browser.newContext({ baseURL: 'http://localhost:5173' })
  const paginaNueva = await contextoNuevo.newPage()
  await paginaNueva.goto('/login')
  await paginaNueva.getByLabel('Correo electrónico').fill(correo)
  await paginaNueva.getByLabel('Contraseña', { exact: true }).fill(claveTemporal)
  await paginaNueva.getByRole('button', { name: 'Ingresar' }).click()
  await paginaNueva.waitForURL('**/cambio-clave-obligatorio')

  await paginaNueva.getByLabel('Nueva contraseña', { exact: true }).fill('Pasada#2026ok')
  await paginaNueva.getByLabel('Confirmar nueva contraseña').fill('Pasada#2026ok')
  await paginaNueva.getByRole('button', { name: /Guardar|Cambiar/ }).click()
  await paginaNueva.waitForURL(/\/(inicio|autoconsulta|login)/)
  await contextoNuevo.close()
})
