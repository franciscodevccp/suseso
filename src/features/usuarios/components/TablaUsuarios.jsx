import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstadoUsuario } from '../utils/estadoUsuario'
import estilos from './TablaUsuarios.module.css'

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })

/**
 * Tabla del módulo Usuarios (docs/04). Las cuentas de demostración no
 * ofrecen acciones: el servidor las rechaza (CUENTA_DEMO) y la UI lo
 * anticipa mostrando la marca "Demo".
 */
export function TablaUsuarios({ usuarios, cargando, onEditar, onActivar, onDesactivar, onDesbloquear, onRestablecer }) {
  if (cargando) {
    return <p className={estilos.cargando}>Cargando usuarios…</p>
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Correo</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col">Último cambio de clave</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className={estilos.fila}>
              <td data-etiqueta="Nombre">
                {usuario.nombre}
                {usuario.esCuentaDemo && <span className={estilos.marcaDemo}>Demo</span>}
              </td>
              <td data-etiqueta="Correo">{usuario.email}</td>
              <td data-etiqueta="Rol">{usuario.rol}</td>
              <td data-etiqueta="Estado">
                <BadgeEstado {...obtenerInfoEstadoUsuario(usuario.estado)} />
              </td>
              <td data-etiqueta="Último cambio de clave">
                {formatearFecha(usuario.fechaUltimoCambioClave)}
              </td>
              <td data-etiqueta="Acciones">
                {usuario.esCuentaDemo ? (
                  <span className={estilos.sinAcciones}>Protegida</span>
                ) : (
                  <span className={estilos.acciones}>
                    <button type="button" className={estilos.accion} onClick={() => onEditar(usuario)}>
                      Editar
                    </button>
                    {usuario.estado === 'bloqueado' && (
                      <button type="button" className={estilos.accion} onClick={() => onDesbloquear(usuario)}>
                        Desbloquear
                      </button>
                    )}
                    {usuario.estado === 'inactivo' ? (
                      <button type="button" className={estilos.accion} onClick={() => onActivar(usuario)}>
                        Activar
                      </button>
                    ) : (
                      <button type="button" className={estilos.accion} onClick={() => onDesactivar(usuario)}>
                        Desactivar
                      </button>
                    )}
                    <button type="button" className={estilos.accion} onClick={() => onRestablecer(usuario)}>
                      Restablecer clave
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
