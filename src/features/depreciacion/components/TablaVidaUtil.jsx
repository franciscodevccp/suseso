import { useEffect, useState } from 'react'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import estilos from './TablaVidaUtil.module.css'

/**
 * Tabla de vida útil por categoría. Si `puedeEditar` es falso, se
 * muestra de solo lectura (Consulta y Gestor de Activos pueden ver los
 * valores vigentes, pero no cambiarlos).
 */
export function TablaVidaUtil({ tabla, puedeEditar, onGuardar, guardando, error }) {
  const [valores, setValores] = useState(tabla)
  const [erroresFila, setErroresFila] = useState({})

  // La tabla se recarga completa después de guardar (o al reiniciar los
  // datos de prueba): el estado local se resincroniza cuando cambia. El
  // callback evita llamar a setState de forma síncrona en el cuerpo del
  // efecto (ver mismo patrón en useActivos.js).
  useEffect(() => {
    Promise.resolve().then(() => setValores(tabla))
  }, [tabla])

  function actualizarValor(categoria, valorTexto) {
    setValores((anterior) =>
      anterior.map((fila) => (fila.categoria === categoria ? { ...fila, vidaUtilAnios: valorTexto } : fila)),
    )
  }

  function manejarGuardar() {
    const errores = {}
    const filasValidadas = valores.map((fila) => {
      const numero = Number(fila.vidaUtilAnios)
      if (!Number.isInteger(numero) || numero <= 0) {
        errores[fila.categoria] = 'Ingrese un número entero mayor a 0.'
      }
      return { ...fila, vidaUtilAnios: numero }
    })
    setErroresFila(errores)
    if (Object.keys(errores).length > 0) return
    onGuardar(filasValidadas)
  }

  return (
    <div>
      {error && <Alert tipo="error">{error}</Alert>}

      <div className={estilos.contenedorTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">Vida útil (años)</th>
            </tr>
          </thead>
          <tbody>
            {valores.map((fila) => (
              <tr key={fila.categoria}>
                <td>{fila.categoria}</td>
                <td>
                  {puedeEditar ? (
                    <div className={estilos.celdaInput}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={estilos.input}
                        value={fila.vidaUtilAnios}
                        onChange={(e) => actualizarValor(fila.categoria, e.target.value)}
                        aria-label={`Vida útil de ${fila.categoria} en años`}
                      />
                      {erroresFila[fila.categoria] && (
                        <p className={estilos.errorCelda}>{erroresFila[fila.categoria]}</p>
                      )}
                    </div>
                  ) : (
                    `${fila.vidaUtilAnios} años`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {puedeEditar && (
        <Button anchoCompleto={false} onClick={manejarGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      )}
    </div>
  )
}
