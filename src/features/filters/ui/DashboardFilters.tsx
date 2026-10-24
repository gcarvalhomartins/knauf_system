import { MACHINE_CODES } from '@shared/config/constants'
import { users } from '@shared/api/mock-db'

type Props = {
  machine: string
  operator: string
  month: string
  onChange: (next: { machine: string; operator: string; month: string }) => void
}

export function DashboardFilters({ machine, operator, month, onChange }: Props) {
  const operators = users.filter((u) => u.role === 'operador')
  return (
    <div className="filters">
      <label>
        Máquina
        <select value={machine} onChange={(e) => onChange({ machine: e.target.value, operator, month })}>
          <option value="todas">Todas</option>
          {MACHINE_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>
      <label>
        Operador
        <select value={operator} onChange={(e) => onChange({ machine, operator: e.target.value, month })}>
          <option value="todos">Todos</option>
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mês
        <select value={month} onChange={(e) => onChange({ machine, operator, month: e.target.value })}>
          <option value="2026-10">Outubro 2026</option>
          <option value="2026-09">Setembro 2026</option>
          <option value="2026-08">Agosto 2026</option>
        </select>
      </label>
    </div>
  )
}
