import { SubNavConfiguracion } from '../components/SubNavConfiguracion'
import { MATRIZ_PERMISOS, ROLES } from '../../auth/utils/permisos'
import estilos from './PerfilesPermisosPage.module.css'

/**
 * Matriz de perfiles y permisos, de SOLO lectura (docs/04, RQ-06):
 * generada desde permisos.js — la misma fuente que aplica el servidor —
 * para que lo declarado en el manual y lo que hace el sistema no puedan
 * divergir. No hay editor de permisos: los perfiles son parametrizables a
 * nivel de configuración del sistema, no desde la pantalla.
 */
export function PerfilesPermisosPage() {
  return (
    <div>
      <h1 className={estilos.titulo}>Configuración</h1>
      <p className={estilos.subtitulo}>Qué puede hacer cada perfil en el sistema.</p>

      <SubNavConfiguracion />

      <div className={estilos.contenedorTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Recurso</th>
              {ROLES.map((rol) => (
                <th key={rol} scope="col" className={estilos.columnaRol}>
                  {rol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIZ_PERMISOS.map((fila) => (
              <tr key={fila.recurso} className={estilos.fila}>
                <td data-etiqueta="Recurso" className={estilos.recurso}>
                  {fila.recurso}
                </td>
                {fila.permisos.map((permitido, indice) => (
                  <td key={ROLES[indice]} data-etiqueta={ROLES[indice]} className={estilos.celdaPermiso}>
                    <span
                      className={permitido ? estilos.permitido : estilos.denegado}
                      aria-label={permitido ? 'Permitido' : 'No permitido'}
                    >
                      {permitido ? '✓' : '—'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={estilos.nota}>
        Cada permiso se exige también en el servidor: ocultar un botón nunca es la única barrera.
      </p>
    </div>
  )
}
