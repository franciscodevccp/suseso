import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CampoFecha } from '../../../components/common/CampoFecha'
import { Desplegable } from '../../../components/common/Desplegable'
import { Button } from '../../../components/common/Button'
import { BotonesExportacion } from '../../reportes/components/BotonesExportacion'
import { FILTROS_INICIALES, useAuditoria } from '../hooks/useAuditoria'
import * as auditoriaService from '../services/auditoriaService'
import estilos from './AuditoriaPage.module.css'

const MODULOS = ['acceso', 'activos', 'almacen', 'actas', 'usuarios', 'configuracion', 'solicitudes', 'api']

const COLUMNAS_EXPORT = [
  { clave: 'fecha', etiqueta: 'Fecha y hora' },
  { clave: 'usuarioNombre', etiqueta: 'Usuario' },
  { clave: 'modulo', etiqueta: 'Módulo' },
  { clave: 'accion', etiqueta: 'Acción' },
  { clave: 'entidadFolio', etiqueta: 'Folio' },
  { clave: 'detalle', etiqueta: 'Detalle' },
]

const formatearFechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

function comoFilaExport(fila) {
  return {
    fecha: formatearFechaHora(fila.fecha),
    usuarioNombre: fila.usuarioNombre,
    modulo: fila.modulo,
    accion: fila.accion,
    entidadFolio: fila.entidadFolio ?? '—',
    detalle: fila.detalle,
  }
}

/** Enlace a la ficha correspondiente cuando la entidad lo permite. */
function EnlaceEntidad({ fila }) {
  if (!fila.entidadFolio) return <span>—</span>
  const rutas = { activo: '/activos-fijos', itemAlmacen: '/almacen', acta: '/actas' }
  const base = rutas[fila.entidad]
  if (!base || !fila.entidadId) return <span>{fila.entidadFolio}</span>
  return (
    <Link to={`${base}/${fila.entidadId}`} className={estilos.enlaceFolio}>
      {fila.entidadFolio}
    </Link>
  )
}

/** Bitácora de acciones del sistema (RQ-08, docs/05). */
export function AuditoriaPage() {
  const [parametros] = useSearchParams()
  const folioInicial = parametros.get('folio') ?? ''
  const {
    filas,
    total,
    cargando,
    filtros,
    setFiltros,
    filtrosAplicados,
    hayFiltros,
    pagina,
    setPagina,
    totalPaginas,
    limpiarFiltros,
  } = useAuditoria(folioInicial ? { ...FILTROS_INICIALES, folio: folioInicial } : FILTROS_INICIALES)
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    let vigente = true
    auditoriaService.obtenerUsuariosAuditoria().then((nombres) => {
      if (vigente) setUsuarios(nombres)
    })
    return () => {
      vigente = false
    }
  }, [])

  function actualizarCampo(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
  }

  async function obtenerReporteCompleto() {
    // El filtro actual completo, hasta el tope de exportación (docs/05).
    const resultado = await auditoriaService.obtenerAuditoria({
      ...filtrosAplicados,
      pagina: 1,
      porPagina: 5000,
    })
    return { columnas: COLUMNAS_EXPORT, filas: resultado.filas.map(comoFilaExport) }
  }

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Auditoría</h1>
          <p className={estilos.subtitulo}>
            Bitácora de todas las acciones del sistema: quién hizo qué y cuándo.
          </p>
        </div>
      </div>

      <div className={estilos.filtros}>
        <Desplegable
          aria-label="Filtrar por usuario"
          value={filtros.usuario}
          onChange={(e) => actualizarCampo('usuario', e.target.value)}
          className={estilos.filtro}
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </Desplegable>

        <Desplegable
          aria-label="Filtrar por módulo"
          value={filtros.modulo}
          onChange={(e) => actualizarCampo('modulo', e.target.value)}
          className={estilos.filtro}
        >
          <option value="">Todos los módulos</option>
          {MODULOS.map((modulo) => (
            <option key={modulo} value={modulo}>
              {modulo}
            </option>
          ))}
        </Desplegable>

        <input
          type="search"
          aria-label="Filtrar por acción"
          placeholder="Acción (ej. ingreso)"
          value={filtros.accion}
          onChange={(e) => actualizarCampo('accion', e.target.value)}
          className={estilos.filtro}
        />

        <input
          type="search"
          aria-label="Filtrar por folio"
          placeholder="Folio (ej. AF-2026-0001)"
          value={filtros.folio}
          onChange={(e) => actualizarCampo('folio', e.target.value)}
          className={estilos.filtro}
        />

        <div className={estilos.rangoFechas}>
          <label className={estilos.campoFecha}>
            <span>Desde</span>
            <CampoFecha
              aria-label="Desde"
              value={filtros.desde}
              onChange={(e) => actualizarCampo('desde', e.target.value)}
              className={estilos.entradaFecha}
            />
          </label>

          <label className={estilos.campoFecha}>
            <span>Hasta</span>
            <CampoFecha
              aria-label="Hasta"
              value={filtros.hasta}
              onChange={(e) => actualizarCampo('hasta', e.target.value)}
              className={estilos.entradaFecha}
            />
          </label>
        </div>

        {hayFiltros && (
          <button type="button" className={estilos.limpiar} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      <BotonesExportacion
        titulo="Auditoría"
        prefijoArchivo="auditoria"
        columnas={COLUMNAS_EXPORT}
        filas={filas.map(comoFilaExport)}
        deshabilitado={cargando || filas.length === 0}
        obtenerReporte={obtenerReporteCompleto}
      />

      {cargando ? (
        <p className={estilos.cargando}>Cargando bitácora…</p>
      ) : filas.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensajeVacio}>
            {hayFiltros ? 'No hay registros con esos criterios' : 'Aún no hay registros en la bitácora'}
          </p>
        </div>
      ) : (
        <>
          <div className={estilos.contenedorTabla}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Fecha y hora</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Módulo</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Folio</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => (
                  <tr key={fila.id} className={estilos.fila}>
                    <td data-etiqueta="Fecha y hora">{formatearFechaHora(fila.fecha)}</td>
                    <td data-etiqueta="Usuario">{fila.usuarioNombre}</td>
                    <td data-etiqueta="Módulo">{fila.modulo}</td>
                    <td data-etiqueta="Acción">{fila.accion}</td>
                    <td data-etiqueta="Folio">
                      <EnlaceEntidad fila={fila} />
                    </td>
                    <td data-etiqueta="Detalle" className={estilos.detalle}>
                      {fila.detalle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={estilos.paginacion}>
            <Button
              variante="secundario"
              anchoCompleto={false}
              disabled={pagina <= 1}
              onClick={() => setPagina(pagina - 1)}
            >
              Anterior
            </Button>
            <span className={estilos.paginaActual}>
              Página {pagina} de {totalPaginas} · {total.toLocaleString('es-CL')} registros
            </span>
            <Button
              variante="secundario"
              anchoCompleto={false}
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
