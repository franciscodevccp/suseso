/**
 * Barrido responsive de TODOS los módulos (RQ-02, RQ-05, docs/13 §360px):
 * cada ruta se abre en cada dispositivo de la matriz y se verifica que
 * (1) no hay desborde horizontal, (2) no hay errores de consola ni de
 * página, y (3) el contenido principal renderiza. Además, humo funcional
 * de las interacciones clave (desplegable propio, modales, formularios).
 */
import { expect, test } from '@playwright/test'
import { esperarContenido, recolectarErrores, sinDesbordeHorizontal } from './utilidades.js'

const RUTAS = [
  { ruta: '/inicio', espera: 'Hola,' },
  { ruta: '/activos-fijos', espera: 'Activos fijos' },
  { ruta: '/activos-fijos/nuevo', espera: 'Nuevo activo' },
  { ruta: '/almacen', espera: 'Almacén' },
  { ruta: '/almacen/nuevo', espera: 'Nuevo ítem' },
  { ruta: '/actas-y-firma', espera: 'Actas' },
  { ruta: '/actas-y-firma/nueva', espera: 'acta' },
  { ruta: '/integraciones', espera: 'Integraciones' },
  { ruta: '/integraciones/sigfe', espera: 'SIGFE' },
  { ruta: '/integraciones/mercadopublico', espera: 'Mercado Público' },
  { ruta: '/reportes', espera: 'Reportes' },
  { ruta: '/configuracion/vida-util', espera: 'Configuración' },
  { ruta: '/configuracion/perfiles', espera: 'Perfiles y permisos' },
  { ruta: '/auditoria', espera: 'Bitácora' },
  { ruta: '/autoconsulta', espera: 'Autoconsulta' },
  { ruta: '/alertas', espera: 'Alertas' },
  { ruta: '/usuarios', espera: 'Nuevo usuario' },
  { ruta: '/perfil/cambiar-clave', espera: 'contraseña' },
]

for (const { ruta, espera } of RUTAS) {
  test(`${ruta} renderiza sin desbordes ni errores`, async ({ page }, testInfo) => {
    const errores = recolectarErrores(page)
    await page.goto(ruta)
    await esperarContenido(page)
    await expect(page.getByText(espera, { exact: false }).first()).toBeVisible()

    await sinDesbordeHorizontal(page)
    expect(errores, errores.join('\n')).toHaveLength(0)

    await page.screenshot({
      path: `tests/e2e/capturas/${testInfo.project.name}/${ruta.replaceAll('/', '_') || 'raiz'}.png`,
      fullPage: false,
    })
  })
}

test('la ficha de un activo se abre desde el listado y no desborda', async ({ page }) => {
  const errores = recolectarErrores(page)
  await page.goto('/activos-fijos')
  await esperarContenido(page)
  await page.locator('a[href^="/activos-fijos/"]').first().click()
  await esperarContenido(page)
  await expect(page.getByText('Datos generales')).toBeVisible()
  await expect(page.getByText('Depreciación', { exact: false }).first()).toBeVisible()
  await sinDesbordeHorizontal(page)
  expect(errores, errores.join('\n')).toHaveLength(0)
})

test('la ficha de un ítem de almacén se abre y no desborda', async ({ page }) => {
  const errores = recolectarErrores(page)
  await page.goto('/almacen')
  await esperarContenido(page)
  await page.locator('a[href^="/almacen/"]').first().click()
  await esperarContenido(page)
  await expect(page.getByText('Historial de movimientos', { exact: false })).toBeVisible()
  await sinDesbordeHorizontal(page)
  expect(errores, errores.join('\n')).toHaveLength(0)
})

test('el desplegable propio abre, navega y selecciona', async ({ page }) => {
  await page.goto('/activos-fijos/nuevo')
  await esperarContenido(page)

  const combo = page.getByRole('combobox', { name: 'Categoría' })
  await combo.click()
  const lista = page.getByRole('listbox')
  await expect(lista).toBeVisible()
  // La lista completa cabe sin scroll interno (9 opciones).
  await expect(lista.getByRole('option')).toHaveCount(9)
  await lista.getByRole('option', { name: 'Mobiliario' }).click()
  await expect(combo).toContainText('Mobiliario')
  await expect(lista).toBeHidden()

  // Teclado: abrir con flecha, bajar y confirmar con Enter.
  await combo.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeHidden()
})

test('el modal de traslado abre y se cancela sin errores', async ({ page }) => {
  const errores = recolectarErrores(page)
  await page.goto('/activos-fijos')
  await esperarContenido(page)
  await page.locator('a[href^="/activos-fijos/"]').first().click()
  await esperarContenido(page)
  await page.getByRole('button', { name: 'Trasladar' }).click()
  await expect(page.getByRole('heading', { name: /Trasladar/ })).toBeVisible()
  await sinDesbordeHorizontal(page)
  await page.getByRole('button', { name: 'Cancelar' }).click()
  expect(errores, errores.join('\n')).toHaveLength(0)
})

test('solo el módulo tiene scroll: encabezado y sidebar quedan fijos', async ({ page }) => {
  await page.goto('/activos-fijos')
  await esperarContenido(page)
  await page.locator('a[href^="/activos-fijos/"]').first().click()
  // La ficha completa (con su tabla de depreciación) debe estar cargada
  // antes de medir: es lo que hace al contenido más alto que la ventana.
  await expect(page.getByText('Datos generales')).toBeVisible()
  await expect(page.getByText('Evolución año a año')).toBeVisible()

  const medida = await page.evaluate(() => {
    const principal = document.querySelector('main')
    principal.scrollTop = 400
    return {
      scrollDeVentana: window.scrollY,
      scrollDeMain: principal.scrollTop,
      documentoDesborda: document.documentElement.scrollHeight > window.innerHeight + 1,
    }
  })
  expect(medida.scrollDeVentana).toBe(0)
  expect(medida.documentoDesborda).toBe(false)
  expect(medida.scrollDeMain).toBeGreaterThan(0)
})
