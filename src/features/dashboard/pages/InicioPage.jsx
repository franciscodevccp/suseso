import { useAuth } from '../../auth/hooks/useAuth'
import { useDashboardResumen } from '../hooks/useDashboardResumen'
import { KpiCard } from '../components/KpiCard'
import { EmptyChartCard } from '../components/EmptyChartCard'
import { GraficoBarras } from '../components/GraficoBarras'
import { RecentActivity } from '../components/RecentActivity'
import { formatearMoneda } from '../../../utils/formatoMoneda'
import estilos from './InicioPage.module.css'

/** Panel de control: primera vista del área autenticada. */
export function InicioPage() {
  const { usuario } = useAuth()
  const { datos, cargando } = useDashboardResumen()

  return (
    <div>
      <h1 className={estilos.saludo}>Hola, {usuario.nombre}</h1>
      <p className={estilos.subtitulo}>Rol: {usuario.rol}</p>

      {cargando ? (
        <p className={estilos.cargando}>Cargando indicadores…</p>
      ) : (
        <>
          <div className={estilos.gridKpi}>
            <KpiCard
              titulo="Total de activos"
              valor={datos.indicadores.totalActivos}
              mensaje="Aún no hay activos registrados"
              tono="neutro"
            />
            <KpiCard
              titulo="Valor total inventariado"
              valor={datos.indicadores.valorTotalInventariado}
              formatear={formatearMoneda}
              mensaje="Aún no hay valorizaciones registradas"
              tono="neutro"
            />
            <KpiCard
              titulo="Valor libro total"
              valor={datos.indicadores.valorLibroTotal ?? 0}
              formatear={formatearMoneda}
              mensaje="Según la tabla de vida útil vigente"
              tono="neutro"
            />
            <KpiCard
              titulo="Alertas vigentes"
              valor={datos.indicadores.alertasVigentes}
              mensaje="Sin alertas activas por ahora"
              tono="positivo"
            />
            <KpiCard
              titulo="Ítems bajo stock mínimo"
              valor={datos.indicadores.itemsBajoStockMinimo}
              mensaje="Sin ítems bajo el mínimo"
              tono="positivo"
            />
            <KpiCard
              titulo="Solicitudes pendientes"
              valor={datos.indicadores.solicitudesPendientes ?? 0}
              mensaje="Sin solicitudes por resolver"
              tono="positivo"
            />
          </div>

          <div className={estilos.gridGraficos}>
            {datos.distribucionEstado.length > 0 ? (
              <GraficoBarras
                titulo="Distribución por estado"
                series={datos.distribucionEstado.map((fila) => ({
                  etiqueta: fila.etiqueta,
                  cantidad: fila.cantidad,
                }))}
              />
            ) : (
              <EmptyChartCard titulo="Distribución por estado" />
            )}
            {datos.activosPorCategoria.length > 0 ? (
              <GraficoBarras
                titulo="Activos por categoría"
                series={datos.activosPorCategoria.map((fila) => ({
                  etiqueta: fila.categoria,
                  cantidad: fila.cantidad,
                  secundario: formatearMoneda(fila.valor),
                }))}
              />
            ) : (
              <EmptyChartCard titulo="Activos por categoría" />
            )}
          </div>

          <RecentActivity items={datos.actividadReciente} />
        </>
      )}
    </div>
  )
}
