import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { useAuth } from '../../auth/hooks/useAuth'
import { esAdministrador } from '../../auth/utils/permisos'
import { useUsuarios } from '../hooks/useUsuarios'
import { TablaUsuarios } from '../components/TablaUsuarios'
import { ModalUsuario } from '../components/ModalUsuario'
import { ModalClaveTemporal } from '../components/ModalClaveTemporal'
import { obtenerMensajeErrorUsuario } from '../constants/mensajesUsuarios'
import * as usuariosService from '../services/usuariosService'
import estilos from './UsuariosPage.module.css'

/** Administración de cuentas y roles (docs/04, RQ-06/07, DEMO-07). Solo Administrador. */
export function UsuariosPage() {
  const { usuario: sesion } = useAuth()
  const { usuarios, cargando, recargar } = useUsuarios()
  const [modal, setModal] = useState(null) // {tipo:'crear'} | {tipo:'editar', usuario} | {tipo:'clave', usuario, claveTemporal}
  const [enviando, setEnviando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [errorPagina, setErrorPagina] = useState(null)

  if (!esAdministrador(sesion)) {
    return (
      <div>
        <h1 className={estilos.titulo}>Usuarios</h1>
        <p>Solo el rol Administrador puede administrar usuarios.</p>
      </div>
    )
  }

  async function guardar(datos) {
    setEnviando(true)
    setErrorModal(null)
    try {
      if (modal.tipo === 'editar') {
        await usuariosService.actualizarUsuario(modal.usuario.id, datos)
        setModal(null)
      } else {
        const resultado = await usuariosService.crearUsuario(datos)
        setModal({ tipo: 'clave', usuario: resultado.usuario, claveTemporal: resultado.claveTemporal })
      }
      recargar()
    } catch (err) {
      setErrorModal(obtenerMensajeErrorUsuario(err.code))
    } finally {
      setEnviando(false)
    }
  }

  async function ejecutarAccion(accion) {
    setErrorPagina(null)
    try {
      await accion()
      recargar()
    } catch (err) {
      setErrorPagina(obtenerMensajeErrorUsuario(err.code))
    }
  }

  async function restablecer(usuario) {
    setErrorPagina(null)
    try {
      const resultado = await usuariosService.restablecerClaveUsuario(usuario.id)
      setModal({ tipo: 'clave', usuario: resultado.usuario, claveTemporal: resultado.claveTemporal })
      recargar()
    } catch (err) {
      setErrorPagina(obtenerMensajeErrorUsuario(err.code))
    }
  }

  return (
    <div>
      <div className={estilos.encabezado}>
        <div>
          <h1 className={estilos.titulo}>Usuarios</h1>
          <p className={estilos.subtitulo}>
            Cuentas del sistema, sus roles y su estado. La clave temporal de una cuenta nueva se
            muestra una sola vez.
          </p>
        </div>
        <Button anchoCompleto={false} onClick={() => setModal({ tipo: 'crear' })}>
          Nuevo usuario
        </Button>
      </div>

      {errorPagina && <Alert tipo="error">{errorPagina}</Alert>}

      <TablaUsuarios
        usuarios={usuarios}
        cargando={cargando}
        onEditar={(usuario) => {
          setErrorModal(null)
          setModal({ tipo: 'editar', usuario })
        }}
        onActivar={(usuario) => ejecutarAccion(() => usuariosService.activarUsuario(usuario.id))}
        onDesactivar={(usuario) => ejecutarAccion(() => usuariosService.desactivarUsuario(usuario.id))}
        onDesbloquear={(usuario) => ejecutarAccion(() => usuariosService.desbloquearUsuario(usuario.id))}
        onRestablecer={restablecer}
      />

      {(modal?.tipo === 'crear' || modal?.tipo === 'editar') && (
        <ModalUsuario
          usuario={modal.tipo === 'editar' ? modal.usuario : null}
          onCerrar={() => setModal(null)}
          onConfirmar={guardar}
          enviando={enviando}
          error={errorModal}
        />
      )}

      {modal?.tipo === 'clave' && (
        <ModalClaveTemporal
          usuario={modal.usuario}
          claveTemporal={modal.claveTemporal}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  )
}
