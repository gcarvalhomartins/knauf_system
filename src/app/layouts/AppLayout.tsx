import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@widgets/app-sidebar/ui/AppSidebar'
import { useAuth } from '@features/auth/ui/AuthContext'
import { brand } from '@shared/config/brand'
import { BrandLogo } from '@shared/ui/BrandLogo'
import { todayLabel } from '@shared/lib/format'

export function AppLayout() {
  const { user } = useAuth()
  const { pathname, search } = useLocation()
  if (!user) return <Navigate to="/login" replace />

  const tvMode = pathname.startsWith('/andon') && new URLSearchParams(search).get('tv') === '1'

  if (tvMode) {
    return (
      <main className="main tv-mode">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="shell">
      <AppSidebar />
      <main className="main">
        <header className="app-topbar">
          <div className="topbar-title">
            <BrandLogo tone="navy" height={22} />
          </div>
          <div className="topbar-meta">
            <span className="topbar-chip">Meta OEE {brand.kpis.oeeTarget}%</span>
            <span className="topbar-chip">Absenteismo ≤ {brand.kpis.absenteeismTarget}%</span>
            <span>{todayLabel()}</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
