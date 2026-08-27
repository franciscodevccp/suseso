/** Acciones de configuración del sistema. */
import { http } from '../../../services/http.js'

/** Restaura los datos de demostración (docs/13, docs/14): solo Administrador. */
export function reiniciarDemo() {
  return http('POST', '/api/configuracion/reiniciar-demo')
}

/** Definición de campos personalizados (RQ-21, docs/08). */
export function obtenerCamposPersonalizados() {
  return http('GET', '/api/configuracion/campos-personalizados')
}

export function guardarCamposPersonalizados(campos) {
  return http('PUT', '/api/configuracion/campos-personalizados', { cuerpo: campos })
}

// --- Importador de la planilla "Vista General" (RQ-24, docs/12) ---------

export function previsualizarImportacion(archivo) {
  const form = new FormData()
  form.append('archivo', archivo)
  return http('POST', '/api/importaciones/vista-general/previsualizar', { form })
}

export function confirmarImportacion({ idPrevisualizacion, mapeo }) {
  return http('POST', '/api/importaciones/vista-general/confirmar', {
    cuerpo: { idPrevisualizacion, mapeo, crearCatalogosFaltantes: true },
  })
}
