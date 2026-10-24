import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@app/layouts/AppLayout'
import { LoginPage } from '@pages/login/ui/LoginPage'
import { DashboardPage } from '@pages/dashboard/ui/DashboardPage'
import { AndonPage } from '@pages/andon/ui/AndonPage'
import { ApontamentoPage } from '@pages/apontamento/ui/ApontamentoPage'
import { ManutencaoPage } from '@pages/manutencao/ui/ManutencaoPage'
import { AbsenteismoPage } from '@pages/absenteismo/ui/AbsenteismoPage'
import { SapConciliationPage } from '@pages/sap/ui/SapConciliationPage'
import { useAuth } from '@features/auth/ui/AuthContext'
import { canAccess, type AppModule } from '@features/auth/model/permissions'
import type { ReactNode } from 'react'

function Guard({ module, children }: { module: AppModule; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!canAccess(user.role, module)) return <Navigate to="/andon" replace />
  return children
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={
            <Guard module="dashboard">
              <DashboardPage />
            </Guard>
          }
        />
        <Route
          path="/andon"
          element={
            <Guard module="andon">
              <AndonPage />
            </Guard>
          }
        />
        <Route
          path="/apontamento"
          element={
            <Guard module="apontamento">
              <ApontamentoPage />
            </Guard>
          }
        />
        <Route
          path="/manutencao"
          element={
            <Guard module="os">
              <ManutencaoPage />
            </Guard>
          }
        />
        <Route
          path="/conciliacao-sap"
          element={
            <Guard module="sap">
              <SapConciliationPage />
            </Guard>
          }
        />
        <Route
          path="/absenteismo"
          element={
            <Guard module="absenteismo">
              <AbsenteismoPage />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
