/**
 * Cliente HTTP común de todos los servicios reales (docs/03). La sesión
 * es la cookie (credentials: 'include'); un 401 fuera de /api/auth
 * dispara `sesion-invalida`, que AuthContext escucha para llevar al
 * usuario a /sesion-expirada.
 */
export class ErrorApi extends Error {
  constructor(codigo, mensaje, status) {
    super(mensaje || codigo)
    this.name = 'ErrorApi'
    this.codigo = codigo
    this.status = status
  }
}

export async function http(metodo, ruta, { cuerpo, form } = {}) {
  const respuesta = await fetch(ruta, {
    method: metodo,
    credentials: 'include',
    headers: form ? undefined : { 'Content-Type': 'application/json' },
    body: form ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined),
  })

  if (respuesta.status === 401 && !ruta.startsWith('/api/auth/')) {
    window.dispatchEvent(new Event('sesion-invalida'))
  }
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}))
    throw new ErrorApi(error.codigo ?? 'ERROR', error.mensaje, respuesta.status)
  }
  return respuesta.status === 204 ? null : respuesta.json()
}
