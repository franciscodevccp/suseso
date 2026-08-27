/**
 * Adjuntos de un activo (RQ-12, docs/06): subir una foto desde la ficha,
 * verla en la galería y eliminarla. Corre solo en escritorio para que los
 * cuatro dispositivos no compitan por la misma ficha.
 */
import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'
import { esperarContenido } from './utilidades.js'

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

test('sube una foto, aparece en la galería y se elimina', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: evita carreras entre dispositivos')

  await page.goto('/activos-fijos')
  await esperarContenido(page)
  // La SEGUNDA ficha: la primera la usan los tests de responsive en paralelo.
  await page.locator('a[href^="/activos-fijos/"]').nth(1).click()
  await expect(page.getByText('Adjuntos')).toBeVisible()

  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'foto-prueba.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64') })
  await expect(page.getByText('foto-prueba.png')).toBeVisible()

  await page.getByRole('button', { name: 'Subir adjunto' }).click()
  await expect(page.locator('img[src^="/api/adjuntos/"]').first()).toBeVisible()
  await expect(page.getByText('Principal')).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar' }).first().click()
  await expect(page.getByText('Aún no hay fotos ni documentos para este activo.')).toBeVisible()
})
