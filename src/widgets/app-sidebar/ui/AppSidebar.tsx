import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  MonitorPlay,
  UserRoundX,
  Wrench,
} from 'lucide-react'
import { ROLE_LABEL } from '@entities/user/model/types'
import { canAccess } from '@features/auth/model/permissions'
import { useAuth } from '@features/auth/ui/AuthContext'
import { BrandLogo } from '@shared/ui/BrandLogo'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as const },
  { to: '/andon', label: 'Andon TV', icon: MonitorPlay, module: 'andon' as const },
  { to: '/apontamento', label: 'Apontamento F48', icon: ClipboardList, module: 'apontamento' as const },
  { to: '/manutencao', label: 'OS & TPM MA', icon: Wrench, module: 'os' as const },
  { to: '/absenteismo', label: 'Absenteismo', icon: UserRoundX, module: 'absenteismo' as const },
  { to: '/conciliacao-sap', label: 'Conciliação SAP', icon: FileCheck2, module: 'sap' as const },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <BrandLogo tone="brand" height={26} />
      </div>
      <nav>
        {links
          .filter((l) => canAccess(user.role, l.module))
          .map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
      </nav>
      <div className="sidebar-user">
        <div>
          <strong>{user.name}</strong>
          <small>
            {ROLE_LABEL[user.role]} {user.shift ? `· ${user.shift}º turno` : ''}
          </small>
        </div>
        <button className="icon-btn" onClick={logout} title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
