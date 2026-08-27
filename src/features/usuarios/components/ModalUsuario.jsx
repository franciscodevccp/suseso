import { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { TextField } from '../../../components/common/TextField'
import { SelectField } from '../../../components/common/SelectField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { ROLES } from '../../auth/utils/permisos'
import estilos from './ModalUsuario.module.css'

/**
 * Crear o editar un usuario (docs/04). En edición el correo no se cambia
 * (el servidor tampoco lo permite); la clave temporal la genera el
 * servidor y la muestra ModalClaveTemporal después.
 */
export function ModalUsuario({ usuario, onCerrar, onConfirmar, enviando, error }) {
  const esEdicion = Boolean(usuario)
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [rol, setRol] = useState(usuario?.rol ?? '')
  const [errores, setErrores] = useState({})

  function manejarEnvio(evento) {
    evento.preventDefault()
    const nuevosErrores = {}
    if (!nombre.trim()) nuevosErrores.nombre = 'Ingrese el nombre.'
    if (!esEdicion && !email.trim()) nuevosErrores.email = 'Ingrese el correo.'
    if (!rol) nuevosErrores.rol = 'Seleccione un rol.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    onConfirmar(esEdicion ? { nombre: nombre.trim(), rol } : { nombre: nombre.trim(), email: email.trim(), rol })
  }

  return (
    <Modal titulo={esEdicion ? `Editar a ${usuario.nombre}` : 'Nuevo usuario'} onCerrar={onCerrar}>
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}

        <TextField
          label="Nombre completo"
          value={nombre}
          error={errores.nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        {!esEdicion && (
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            error={errores.email}
            hint="La clave temporal se genera automáticamente y se muestra una sola vez."
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <SelectField
          label="Rol"
          value={rol}
          error={errores.rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="">Seleccione un rol</option>
          {ROLES.map((nombreRol) => (
            <option key={nombreRol} value={nombreRol}>
              {nombreRol}
            </option>
          ))}
        </SelectField>

        <div className={estilos.acciones}>
          <Button variante="primario" anchoCompleto={false} tipo="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
          <Button variante="secundario" anchoCompleto={false} tipo="button" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
