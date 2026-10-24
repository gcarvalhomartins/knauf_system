import type { ReactNode } from 'react'
import { todayLabel } from '@shared/lib/format'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function AppHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle ?? todayLabel()}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </header>
  )
}
