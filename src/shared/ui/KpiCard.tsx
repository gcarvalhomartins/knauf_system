import type { ReactNode } from 'react'

type Props = {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'ok' | 'warn' | 'bad'
  icon?: ReactNode
}

export function KpiCard({ label, value, hint, tone = 'default', icon }: Props) {
  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div className="kpi-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  )
}
