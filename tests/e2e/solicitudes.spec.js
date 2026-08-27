/**
 * Ciclo completo de solicitudes (AD-03, docs/11): el Funcionario crea
 * desde el portal, el Administrador aprueba y entrega desde la bandeja, y
 * la entrega genera los egresos de almacén. Solo en escritorio, y con
 * SESIONES PROPIAS por API: los flujos que mutan datos no comparten la
 * cookie del storageState con el resto de la suite.
 */
import { expect, test } from '@playwright/test'
import { contextoConSesion, esperarContenido, sinDesbordeHorizontal } from './utilidades.js'

test.describe.configure({ mode: 'serial' })

let folioCreado = ''

test('el funcionario crea una solicitud desde el catálogo', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')

  const contexto = await contextoConSesion(browser, 'funcionario@demo.cl')
  const page = await contexto.newPage()

  await page.goto('/autoconsulta/solicitudes/nueva')
  await esperarContenido(page)
  await sinDesbordeHorizontal(page)

  await page.getByLabel('Cantidad de Resma de papel carta').fill('2')
  await page.locator('textarea').fill('Prueba E2E del portal')
  await page.getByRole('button', { name: /Enviar solicitud/ }).click()

  // Aterriza en el detalle: folio SOL- y estado Pendiente.
  await expect(page.getByRole('heading', { name: /Solicitud SOL-/ })).toBeVisible()
  await expect(page.getByText('Pendiente')).toBeVisible()
  await expect(page.getByText('2×')).toBeVisible()
  const titulo = await page.getByRole('heading', { name: /Solicitud SOL-/ }).textContent()
  folioCreado = titulo.replace('Solicitud', '').trim()

  // Y queda en "Mis solicitudes".
  await page.goto('/autoconsulta/solicitudes')
  await esperarContenido(page)
  await expect(page.getByRole('link', { name: folioCreado })).toBeVisible()
  await sinDesbordeHorizontal(page)
  await contexto.close()
})

test('el administrador aprueba y entrega; la entrega registra egresos', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')
  expect(folioCreado, 'depende de la solicitud creada por el funcionario').toMatch(/^SOL-/)

  const contexto = await contextoConSesion(browser, 'admin@demo.cl')
  const page = await contexto.newPage()

  await page.goto('/solicitudes')
  await esperarContenido(page)
  await sinDesbordeHorizontal(page)

  const fila = page.locator('tr', { hasText: folioCreado })
  await expect(fila).toBeVisible()
  await fila.getByRole('button', { name: 'Aprobar' }).click()
  await expect(page.getByText(`Solicitud ${folioCreado} aprobada.`)).toBeVisible()

  // Pasa a Históricas como aprobada; desde ahí se entrega.
  await page.getByRole('tab', { name: 'Históricas' }).click()
  const filaHistorica = page.locator('tr', { hasText: folioCreado })
  await expect(filaHistorica.getByText('Aprobada')).toBeVisible()
  await filaHistorica.getByRole('button', { name: 'Entregar' }).click()
  await expect(page.getByText(`Solicitud ${folioCreado} entregada`, { exact: false })).toBeVisible()
  await expect(filaHistorica.getByText('Entregada')).toBeVisible()

  // El kardex del ítem registró el egreso con el folio de la solicitud.
  await page.goto('/almacen')
  await esperarContenido(page)
  await page.locator('tr', { hasText: 'Resma de papel carta' }).locator('a').first().click()
  await esperarContenido(page)
  await expect(page.getByText(`Entrega solicitud ${folioCreado}`)).toBeVisible()
  await contexto.close()
})

test('rechazar exige observación', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')

  const contexto = await contextoConSesion(browser, 'admin@demo.cl')
  const page = await contexto.newPage()

  await page.goto('/solicitudes')
  await esperarContenido(page)
  // Una pendiente del seed (SOL-0001 o SOL-0002) abre el modal de rechazo.
  const fila = page.locator('tr', { hasText: 'SOL-' }).first()
  await expect(fila).toBeVisible()
  await fila.getByRole('button', { name: 'Rechazar' }).click()
  await expect(page.getByRole('heading', { name: /Rechazar la solicitud/ })).toBeVisible()
  // Sin observación el botón queda deshabilitado (la regla del servidor).
  await expect(page.getByRole('button', { name: 'Rechazar solicitud' })).toBeDisabled()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await contexto.close()
})
