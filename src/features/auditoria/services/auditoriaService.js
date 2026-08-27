/** Consulta de la bitácora (RQ-08, docs/05). */
import { http } from '../../../services/http.js'

export function obtenerAuditoria({ usuario = '', modulo = '', accion = '', folio = '', desde = '', hasta = '', pagina = 1, porPagina = 50 } = {}) {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries({ usuario, modulo, accion, folio, desde, hasta })) {
    if (valor) parametros.set(clave, valor)
  }
  parametros.set('pagina', String(pagina))
  parametros.set('porPagina', String(porPagina))
  return http('GET', `/api/auditoria?${parametros}`)
}

/** Nombres de usuario presentes en la bitácora (para el filtro). */
export function obtenerUsuariosAuditoria() {
  return http('GET', '/api/auditoria/usuarios')
}
