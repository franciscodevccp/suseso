/**
 * Escáner de códigos (RQ-20, docs/08): un lector USB escribe el código y
 * termina con Enter; aquí se simula tipeando, que es exactamente lo mismo.
 */
import { expect, test } from '@playwright/test'
import { esperarContenido } from './utilidades.js'

test('escanear un RFID abre la ficha del activo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: mismo flujo en todos')

  await page.goto('/activos-fijos')
  await esperarContenido(page)
  const escaner = page.getByLabel('Escanear o escribir un código')
  await escaner.fill('RFID-A003')
  await escaner.press('Enter')

  await expect(page.getByRole('heading', { name: 'Teléfono IP Cisco 8841' })).toBeVisible()
  await expect(page).toHaveURL(/\/activos-fijos\/[a-z0-9]+$/)
})

test('un código no registrado ofrece dar de alta con ese código', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: mismo flujo en todos')

  await page.goto('/activos-fijos')
  await esperarContenido(page)
  const escaner = page.getByLabel('Escanear o escribir un código')
  await escaner.fill('CODIGO-INEXISTENTE-99')
  await escaner.press('Enter')

  await expect(page.getByText('no registrado')).toBeVisible()
  await page.getByRole('button', { name: 'Dar de alta con este código' }).click()
  await expect(page).toHaveURL(/\/activos-fijos\/nuevo\?codigo=CODIGO-INEXISTENTE-99$/)
  await expect(page.getByLabel('Código de barras')).toHaveValue('CODIGO-INEXISTENTE-99')
})

test('en almacén el escáner busca por folio de bodega', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: mismo flujo en todos')

  await page.goto('/almacen')
  await esperarContenido(page)
  const escaner = page.getByLabel('Escanear o escribir un código')
  await escaner.fill('BOD-2026-0001')
  await escaner.press('Enter')

  await expect(page).toHaveURL(/\/almacen\/[a-z0-9]+$/)
  await expect(page.getByText('Stock actual')).toBeVisible()
})
