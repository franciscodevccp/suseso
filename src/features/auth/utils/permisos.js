/**
 * Permisos por rol, centralizados (docs/04, D-02/D-10/D-11). Los archivos
 * permisos*.js de cada feature delegan aquí; la matriz completa se aplica
 * SIEMPRE en el servidor (autorizar(...roles)) — esto solo decide qué
 * muestra la interfaz.
 */
export const ROLES = ['Administrador', 'Gestor de Activos', 'Consulta', 'Funcionario']

export const puedeGestionar = (usuario) =>
  ['Administrador', 'Gestor de Activos'].includes(usuario?.rol)

export const esAdministrador = (usuario) => usuario?.rol === 'Administrador'

export const esFuncionario = (usuario) => usuario?.rol === 'Funcionario'

/** Funcionario solo usa el portal de autoconsulta; el resto ve el panel. */
export const puedeVerPanel = (usuario) => Boolean(usuario) && !esFuncionario(usuario)

/**
 * Matriz de permisos (docs/04, D-10) para la pantalla de solo lectura
 * Configuración → Perfiles y permisos y para el manual. El orden de
 * columnas es el de ROLES.
 */
export const MATRIZ_PERMISOS = [
  { recurso: 'Panel: listados, fichas, reportes, auditoría y alertas', permisos: [true, true, true, false] },
  { recurso: 'Crear, editar, trasladar y dar de baja activos', permisos: [true, true, false, false] },
  { recurso: 'Almacén: ítems e ingresos/egresos', permisos: [true, true, false, false] },
  { recurso: 'Actas: crear y cerrar', permisos: [true, true, false, false] },
  { recurso: 'Solicitudes: aprobar, rechazar y entregar', permisos: [true, true, false, false] },
  { recurso: 'Solicitudes: crear y ver las propias; autoconsulta', permisos: [true, true, true, true] },
  { recurso: 'Configuración: ver (vida útil, perfiles y permisos)', permisos: [true, true, true, false] },
  { recurso: 'Configuración: editar vida útil y reiniciar demo', permisos: [true, false, false, false] },
  { recurso: 'Importar planilla', permisos: [true, true, false, false] },
  { recurso: 'Usuarios: administrar cuentas y roles', permisos: [true, false, false, false] },
]
