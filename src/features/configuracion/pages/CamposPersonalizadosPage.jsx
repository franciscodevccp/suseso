import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Desplegable } from '../../../components/common/Desplegable'
import { useAuth } from '../../auth/hooks/useAuth'
import { SubNavConfiguracion } from '../components/SubNavConfiguracion'
import * as configuracionService from '../services/configuracionService'
import estilos from './CamposPersonalizadosPage.module.css'

const TIPOS = [
  { valor: 'texto', etiqueta: 'Texto' },
  { valor: 'numero', etiqueta: 'Número' },
  { valor: 'fecha', etiqueta: 'Fecha' },
  { valor: 'lista', etiqueta: 'Lista de opciones' },
]

/** "Número de serie" → "numero_serie" (id estable del campo). */
function comoId(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Configuración → Campos personalizados (RQ-21, docs/08): agregar,
 * editar, ordenar y desactivar los campos que el formulario de activos
 * muestra bajo los estándar. Los edita solo el Administrador (D-10).
 */
export function CamposPersonalizadosPage() {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  const [campos, setCampos] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    configuracionService
      .obtenerCamposPersonalizados()
      .then((filas) => vigente && setCampos(filas))
      .catch(() => vigente && setMensaje({ tipo: 'error', texto: 'No fue posible cargar los campos.' }))
    return () => {
      vigente = false
    }
  }, [])

  function actualizar(indice, cambios) {
    setCampos((previos) => previos.map((campo, i) => (i === indice ? { ...campo, ...cambios } : campo)))
  }

  function mover(indice, paso) {
    setCampos((previos) => {
      const destino = indice + paso
      if (destino < 0 || destino >= previos.length) return previos
      const copia = [...previos]
      ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
      return copia
    })
  }

  function agregar() {
    setCampos((previos) => [
      ...previos,
      { id: '', nombre: '', tipo: 'texto', obligatorio: false, habilitado: true },
    ])
  }

  function quitar(indice) {
    setCampos((previos) => previos.filter((_, i) => i !== indice))
  }

  async function guardar() {
    const listos = campos
      .filter((campo) => campo.nombre.trim())
      .map((campo) => ({
        ...campo,
        nombre: campo.nombre.trim(),
        id: campo.id || comoId(campo.nombre),
        ...(campo.tipo === 'lista'
          ? { opciones: (campo.opciones ?? []).map((o) => o.trim()).filter(Boolean) }
          : { opciones: undefined }),
      }))
    if (listos.some((campo) => campo.tipo === 'lista' && !(campo.opciones?.length > 0))) {
      setMensaje({ tipo: 'error', texto: 'Los campos de tipo lista necesitan al menos una opción.' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      setCampos(await configuracionService.guardarCamposPersonalizados(listos))
      setMensaje({ tipo: 'exito', texto: 'Campos personalizados guardados.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No fue posible guardar los campos.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Configuración</h1>
      <p className={estilos.subtitulo}>
        Campos adicionales que el formulario de activos muestra bajo los estándar.
      </p>

      <SubNavConfiguracion />

      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}

      {campos && (
        <section className={estilos.tarjeta}>
          {campos.length === 0 && (
            <p className={estilos.vacio}>Aún no hay campos personalizados definidos.</p>
          )}

          <ul className={estilos.lista}>
            {campos.map((campo, indice) => (
              <li key={campo.id || `nuevo-${indice}`} className={estilos.filaCampo}>
                <div className={estilos.celdas}>
                  <label className={estilos.celda}>
                    <span>Nombre</span>
                    <input
                      type="text"
                      value={campo.nombre}
                      disabled={!esAdministrador}
                      onChange={(e) => actualizar(indice, { nombre: e.target.value })}
                      placeholder="Ej.: Número de serie"
                    />
                  </label>
                  <label className={estilos.celda}>
                    <span>Tipo</span>
                    <Desplegable
                      value={campo.tipo}
                      disabled={!esAdministrador}
                      onChange={(e) => actualizar(indice, { tipo: e.target.value })}
                      aria-label={`Tipo del campo ${campo.nombre || indice + 1}`}
                      className={estilos.selector}
                    >
                      {TIPOS.map((tipo) => (
                        <option key={tipo.valor} value={tipo.valor}>
                          {tipo.etiqueta}
                        </option>
                      ))}
                    </Desplegable>
                  </label>
                  {campo.tipo === 'lista' && (
                    <label className={`${estilos.celda} ${estilos.celdaOpciones}`}>
                      <span>Opciones (separadas por coma)</span>
                      <input
                        type="text"
                        value={(campo.opciones ?? []).join(', ')}
                        disabled={!esAdministrador}
                        onChange={(e) =>
                          actualizar(indice, { opciones: e.target.value.split(',').map((o) => o.trimStart()) })
                        }
                        placeholder="Opción A, Opción B, Opción C"
                      />
                    </label>
                  )}
                </div>

                <div className={estilos.controles}>
                  <label className={estilos.casilla}>
                    <input
                      type="checkbox"
                      checked={campo.obligatorio}
                      disabled={!esAdministrador}
                      onChange={(e) => actualizar(indice, { obligatorio: e.target.checked })}
                    />
                    Obligatorio
                  </label>
                  <label className={estilos.casilla}>
                    <input
                      type="checkbox"
                      checked={campo.habilitado}
                      disabled={!esAdministrador}
                      onChange={(e) => actualizar(indice, { habilitado: e.target.checked })}
                    />
                    Habilitado
                  </label>
                  {esAdministrador && (
                    <span className={estilos.orden}>
                      <button type="button" onClick={() => mover(indice, -1)} disabled={indice === 0} aria-label="Subir">
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(indice, 1)}
                        disabled={indice === campos.length - 1}
                        aria-label="Bajar"
                      >
                        ↓
                      </button>
                      <button type="button" className={estilos.quitar} onClick={() => quitar(indice)}>
                        Quitar
                      </button>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {esAdministrador && (
            <div className={estilos.acciones}>
              <Button variante="secundario" anchoCompleto={false} onClick={agregar}>
                Agregar campo
              </Button>
              <Button anchoCompleto={false} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar campos'}
              </Button>
            </div>
          )}
        </section>
      )}

      <p className={estilos.nota}>
        Los valores quedan en la ficha de cada activo y entran en la búsqueda por texto del listado.
      </p>
    </div>
  )
}
