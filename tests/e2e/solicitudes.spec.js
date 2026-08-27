/**
 * Ciclo completo de solicitudes (AD-03, docs/11): el Funcionario crea
 * desde el portal, el Administrador aprueba y entrega desde la bandeja, y
 * la entrega genera los egresos de almacén. Solo en escritorio para no
 * competir con los demás dispositivos por los mismos datos.
 */
import { expect, test } from '@playwright/test'
import { esperarContenido, sinDesbordeHorizontal } from './utilidades.js'

test.describe.configure({ mode: 'serial' })

let folioCreado = ''

test.describe('portal del funcionario', () => {
  test.use({ storageState: 'tests/e2e/.estado/funcionario.json' })

  test('crea una solicitud desde el catálogo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')

    await page.goto('/autoconsulta/solicitudes/nueva')
    await esperarContenido(page)
    await sinDesbordeHorizontal(page)

    await page.getByLabel('Cantidad de Resma de papel carta').fill('2')
    await page.getByRole('textbox', { name: /observación/i }).or(page.locator('textarea')).fill('Prueba E2E del portal')
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
  })
})

test.describe('bandeja del panel', () => {
  test('el administrador aprueba y entrega; la entrega registra egresos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')
    expect(folioCreado, 'depende de la solicitud creada por el funcionario').toMatch(/^SOL-/)

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
    await page.getByRole('link', { name: 'BOD-', exact: false }).first().waitFor()
    await page.locator('tr', { hasText: 'Resma de papel carta' }).locator('a').first().click()
    await esperarContenido(page)
    await expect(page.getByText(`Entrega solicitud ${folioCreado}`)).toBeVisible()
  })

  test('rechazar exige observación', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: flujo con datos compartidos')

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
  })
})
