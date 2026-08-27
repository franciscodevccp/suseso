import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { RutaAdministrativa } from './features/auth/RutaAdministrativa'
import { LoginPage } from './features/auth/pages/LoginPage'
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage'
import { ForcePasswordChangePage } from './features/auth/pages/ForcePasswordChangePage'
import { AccountLockedPage } from './features/auth/pages/AccountLockedPage'
import { SessionExpiredPage } from './features/auth/pages/SessionExpiredPage'
import { ChangePasswordPage } from './features/auth/pages/ChangePasswordPage'
import { AppLayout } from './components/layout/AppLayout'
import { AlertasPage } from './features/alertas/pages/AlertasPage'
import { InicioPage } from './features/dashboard/pages/InicioPage'
import { ListadoActivosPage } from './features/activos/pages/ListadoActivosPage'
import { FichaActivoPage } from './features/activos/pages/FichaActivoPage'
import { AltaActivoPage } from './features/activos/pages/AltaActivoPage'
import { EditarActivoPage } from './features/activos/pages/EditarActivoPage'
import { ListadoActasPage } from './features/actas/pages/ListadoActasPage'
import { CrearActaPage } from './features/actas/pages/CrearActaPage'
import { FichaActaPage } from './features/actas/pages/FichaActaPage'
import { AutoconsultaPage } from './features/autoconsulta/pages/AutoconsultaPage'
import { ConsultaActivoPage } from './features/autoconsulta/pages/ConsultaActivoPage'
import { ListadoAlmacenPage } from './features/almacen/pages/ListadoAlmacenPage'
import { AltaItemPage } from './features/almacen/pages/AltaItemPage'
import { FichaItemPage } from './features/almacen/pages/FichaItemPage'
import { DocumentacionApiPage } from './features/integraciones/pages/DocumentacionApiPage'
import { IntegracionSigfePage } from './features/integraciones/pages/IntegracionSigfePage'
import { IntegracionMercadoPublicoPage } from './features/integraciones/pages/IntegracionMercadoPublicoPage'
import { VidaUtilPage } from './features/depreciacion/pages/VidaUtilPage'
import { ReportesPage } from './features/reportes/pages/ReportesPage'
import { UsuariosPage } from './features/usuarios/pages/UsuariosPage'
import { AuditoriaPage } from './features/auditoria/pages/AuditoriaPage'
import { PerfilesPermisosPage } from './features/configuracion/pages/PerfilesPermisosPage'
import { ReiniciarDemoPage } from './features/configuracion/pages/ReiniciarDemoPage'
import { MisSolicitudesPage } from './features/solicitudes/pages/MisSolicitudesPage'
import { NuevaSolicitudPage } from './features/solicitudes/pages/NuevaSolicitudPage'
import { DetalleSolicitudPage } from './features/solicitudes/pages/DetalleSolicitudPage'
import { BandejaSolicitudesPage } from './features/solicitudes/pages/BandejaSolicitudesPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-clave" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-clave" element={<ResetPasswordPage />} />
        <Route path="/cambio-clave-obligatorio" element={<ForcePasswordChangePage />} />
        <Route path="/cuenta-bloqueada" element={<AccountLockedPage />} />
        <Route path="/sesion-expirada" element={<SessionExpiredPage />} />

        {/* Área autenticada: shell con sidebar compartido por todas estas vistas. */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Accesible para cualquier rol autenticado, incluido Funcionario. */}
          <Route path="/autoconsulta" element={<AutoconsultaPage />} />
          <Route path="/autoconsulta/solicitudes" element={<MisSolicitudesPage />} />
          <Route path="/autoconsulta/solicitudes/nueva" element={<NuevaSolicitudPage />} />
          <Route path="/autoconsulta/solicitudes/:id" element={<DetalleSolicitudPage />} />
          <Route path="/autoconsulta/:id" element={<ConsultaActivoPage />} />
          <Route path="/perfil/cambiar-clave" element={<ChangePasswordPage />} />

          {/* Módulos administrativos: el rol Funcionario no entra ni por URL directa. */}
          <Route element={<RutaAdministrativa />}>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/activos-fijos" element={<ListadoActivosPage />} />
            <Route path="/activos-fijos/nuevo" element={<AltaActivoPage />} />
            <Route path="/activos-fijos/:id/editar" element={<EditarActivoPage />} />
            <Route path="/activos-fijos/:id" element={<FichaActivoPage />} />
            <Route path="/almacen" element={<ListadoAlmacenPage />} />
            <Route path="/almacen/nuevo" element={<AltaItemPage />} />
            <Route path="/almacen/:id" element={<FichaItemPage />} />
            <Route path="/solicitudes" element={<BandejaSolicitudesPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/actas" element={<ListadoActasPage />} />
            <Route path="/actas/nueva" element={<CrearActaPage />} />
            <Route path="/actas/:id" element={<FichaActaPage />} />
            <Route path="/integraciones" element={<DocumentacionApiPage />} />
            <Route path="/integraciones/sigfe" element={<IntegracionSigfePage />} />
            <Route path="/integraciones/mercadopublico" element={<IntegracionMercadoPublicoPage />} />
            <Route path="/configuracion/vida-util" element={<VidaUtilPage />} />
            <Route path="/configuracion/perfiles" element={<PerfilesPermisosPage />} />
            <Route path="/configuracion/reiniciar-demo" element={<ReiniciarDemoPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
