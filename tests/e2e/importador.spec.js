/**
 * Importador de la planilla "Vista General" (RQ-24, docs/12): sube la
 * planilla real de 3.530 filas y verifica la previsualización con el
 * mapeo sugerido. La confirmación no se ejecuta aquí (dejaría 3.530
 * activos en la base de la demo); ese paso queda validado por API.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { esperarContenido } from './utilidades.js'

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

test('la previsualización analiza la planilla completa y propone el mapeo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'solo escritorio: mismo flujo en todos')

  await page.goto('/configuracion/importar')
  await esperarContenido(page)

  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(raiz, 'entregables', 'planilla-ejemplo-vista-general.xlsx'))
  await page.getByRole('button', { name: 'Analizar planilla' }).click()

  // Paso 2: total de filas, validación y mapeo sugerido visibles.
  await expect(page.getByText(/Mapeo de columnas — 3\.530 filas/)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('3.530', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Confirmar importación \(3\.530 filas\)/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Código' })).toBeVisible()

  // Volver a empezar deja el paso 1 limpio.
  await page.getByRole('button', { name: 'Volver a empezar' }).click()
  await expect(page.getByRole('button', { name: 'Analizar planilla' })).toBeVisible()
})
