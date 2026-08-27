/** Utilidades compartidas de las pruebas de responsive (docs/15). */
import { expect } from '@playwright/test'

/**
 * Falla si la página (o el <main> con scroll propio) desborda en
 * horizontal. Los contenedores con overflow-x propio (tablas en
 * escritorio) no cuentan: solo importa que la VENTANA no tenga scroll
 * lateral, que es lo que se ve mal en un teléfono.
 */
export async function sinDesbordeHorizontal(pagina) {
  const medida = await pagina.evaluate(() => {
    const ancho = window.innerWidth
    const doc = document.documentElement
    const principal = document.querySelector('main')
    const culpables = []

    function anotarCulpables(raiz) {
      for (const el of raiz.querySelectorAll('*')) {
        const caja = el.getBoundingClientRect()
        if (caja.width > 1 && caja.right > ancho + 1) {
          const clases = [...el.classList].join('.')
          culpables.push(`${el.tagName.toLowerCase()}${clases ? `.${clases}` : ''}→${Math.round(caja.right)}px`)
          if (culpables.length >= 5) return
        }
      }
    }

    const desbordaDocumento = doc.scrollWidth > ancho + 1
    const desbordaMain = principal ? principal.scrollWidth > principal.clientWidth + 1 : false
    if (desbordaDocumento) anotarCulpables(document.body)
    else if (desbordaMain) anotarCulpables(principal)

    return { ancho, documento: doc.scrollWidth, main: principal?.scrollWidth ?? null, mainVisible: principal?.clientWidth ?? null, desbordaDocumento, desbordaMain, culpables }
  })

  expect(
    medida.desbordaDocumento || medida.desbordaMain,
    `Desborde horizontal con ventana de ${medida.ancho}px (documento ${medida.documento}px, main ${medida.main}/${medida.mainVisible}px). Elementos: ${medida.culpables.join(' | ') || 'no identificados'}`,
  ).toBe(false)
}

/** Junta errores de consola y de página para afirmarlos al final. */
export function recolectarErrores(pagina) {
  const errores = []
  pagina.on('console', (mensaje) => {
    if (mensaje.type() === 'error') errores.push(`console.error: ${mensaje.text()}`)
  })
  pagina.on('pageerror', (error) => errores.push(`pageerror: ${error.message}`))
  return errores
}

/** Espera a que la vista termine de cargar datos (spinners de la app). */
export async function esperarContenido(pagina) {
  await pagina.waitForLoadState('networkidle')
  await expect(pagina.locator('main, form').first()).toBeVisible()
}
