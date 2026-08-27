/**
 * Portal de autoconsulta con el rol Funcionario (AD-03, docs/11): su
 * sidebar queda reducido, "Mis bienes" muestra solo sus activos, y el
 * panel administrativo lo rechaza incluso por URL directa.
 */
import { expect, test } from '@playwright/test'
import { esperarContenido, recolectarErrores, sinDesbordeHorizontal } from './utilidades.js'

test.use({ storageState: 'tests/e2e/.estado/funcionario.json' })

test('mis bienes lista los activos del funcionario sin desbordes', async ({ page }) => {
  const errores = recolectarErrores(page)
  await page.goto('/autoconsulta')
  await esperarContenido(page)
  await expect(page.getByText('AF-2026-0001')).toBeVisible()
  await sinDesbordeHorizontal(page)
  expect(errores, errores.join('\n')).toHaveLength(0)
})

test('la consulta de un bien propio abre su ficha', async ({ page }) => {
  await page.goto('/autoconsulta')
  await esperarContenido(page)
  await page.locator('a[href^="/autoconsulta/"]').first().click()
  await esperarContenido(page)
  await sinDesbordeHorizontal(page)
})

test('el panel administrativo no se alcanza ni por URL directa', async ({ page }) => {
  await page.goto('/activos-fijos')
  await page.waitForURL('**/autoconsulta')
  await expect(page).toHaveURL(/autoconsulta/)
})
