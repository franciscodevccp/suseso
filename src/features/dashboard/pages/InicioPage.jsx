import { useAuth } from '../../auth/hooks/useAuth'
import { useDashboardResumen } from '../hooks/useDashboardResumen'
import { KpiCard } from '../components/KpiCard'
import { EmptyChartCard } from '../components/EmptyChartCard'
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
          </div>

          <div className={estilos.gridGraficos}>
            <EmptyChartCard titulo="Distribución por estado" />
            <EmptyChartCard titulo="Activos por categoría" />
          </div>

          <RecentActivity items={datos.actividadReciente} />
        </>
      )}
    </div>
  )
}
