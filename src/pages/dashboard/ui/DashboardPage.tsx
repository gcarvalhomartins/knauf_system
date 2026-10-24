import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BadgeCheck, Gauge, Package, Timer } from 'lucide-react'
import { AppHeader } from '@widgets/app-header/ui/AppHeader'
import { DashboardFilters } from '@features/filters/ui/DashboardFilters'
import { api } from '@shared/api/client'
import { brand } from '@shared/config/brand'
import { formatNumber, formatPercent } from '@shared/lib/format'
import { KpiCard } from '@shared/ui/KpiCard'
import { computeOee, oeeTone } from '@shared/lib/oee'
import type { DailyKpi } from '@entities/production/model/types'
import type { Machine } from '@entities/machine/model/types'
import type { ProductionEntry } from '@entities/production/model/types'

const TOOLTIP = {
  backgroundColor: '#ffffff',
  border: '1px solid #E2E7EC',
  borderRadius: 12,
  fontSize: 13,
  boxShadow: '0 10px 30px rgba(0,36,79,0.12)',
}

const SHIFT_MINUTES = 480

export function DashboardPage() {
  const [filters, setFilters] = useState({ machine: 'todas', operator: 'todos', month: '2026-10' })
  const [kpis, setKpis] = useState<DailyKpi[]>([])
  const [monthly, setMonthly] = useState<DailyKpi[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [entries, setEntries] = useState<ProductionEntry[]>([])

  useEffect(() => {
    void api.listKpis('diario').then(setKpis)
    void api.listKpis('mensal').then(setMonthly)
    void api.listMachines().then(setMachines)
    void api.listEntries().then(setEntries)
  }, [])

  const last = kpis.at(-1)
  const oee = last?.oee ?? 0
  const quality = last?.quality ?? 0
  const productivity = last?.productivity ?? 0

  /**
   * OEE do turno calculado a partir dos apontamentos reais:
   * disponibilidade x performance x qualidade (paradas planejadas
   * nao penalizam a disponibilidade).
   */
  const shiftOee = useMemo(() => {
    if (entries.length === 0) return null
    const totals = entries.map((entry) => {
      const goodParts = Math.max(entry.cycleCounterEnd - entry.cycleCounterStart, 0) * entry.partsPerCycle
      const idealCycleS = Math.min(...entry.hours.map((h) => h.cycleTimeS || 48))
      return computeOee({
        plannedMinutes: SHIFT_MINUTES,
        hours: entry.hours,
        goodParts,
        scrapParts: 0,
        idealCycleS,
      })
    })
    const avg = (k: keyof (typeof totals)[number]) =>
      totals.reduce((s, t) => s + (t[k] as number), 0) / totals.length
    return {
      availability: avg('availability'),
      performance: avg('performance'),
      quality: avg('quality'),
      oee: avg('oee'),
    }
  }, [entries])

  const visibleMachines =
    filters.machine === 'todas' ? machines : machines.filter((m) => m.code === filters.machine)

  const tone = oeeTone(oee)

  return (
    <div className="page-pad">
      <AppHeader
        title="Dashboard executivo"
        subtitle={`Desempenho da planta · metas OEE ${brand.kpis.oeeTarget}% e absenteísmo ${brand.kpis.absenteeismTarget}%`}
        actions={<DashboardFilters {...filters} onChange={setFilters} />}
      />

      <section className="kpi-grid">
        <KpiCard
          label="OEE atual"
          value={formatPercent(oee)}
          hint={`Meta ${brand.kpis.oeeTarget}%`}
          tone={tone}
          icon={<Gauge size={18} />}
        />
        <KpiCard
          label="Peças boas"
          value={formatNumber(last?.goodParts ?? 0)}
          hint={`${formatNumber(last?.scrapParts ?? 0)} refugos`}
          icon={<Package size={18} />}
        />
        <KpiCard
          label="Horas produtivas"
          value={`${last?.runHours ?? 0}h`}
          hint={`${last?.stopHours ?? 0}h paradas`}
          icon={<Timer size={18} />}
        />
        <KpiCard
          label="% Qualidade"
          value={formatPercent(quality)}
          hint={`Produtividade ${formatPercent(productivity)}`}
          tone="ok"
          icon={<BadgeCheck size={18} />}
        />
      </section>

      <section className="chart-grid">
        <article className="panel">
          <h2>Evolução diária OEE / OER</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={kpis}>
              <CartesianGrid stroke="#E2E7EC" />
              <XAxis dataKey="date" stroke="#8B949C" />
              <YAxis domain={[70, 100]} stroke="#8B949C" />
              <Tooltip contentStyle={TOOLTIP} />
              <Legend />
              <Area type="monotone" dataKey="oee" name="OEE" stroke="#0099DE" fill="rgba(0,153,222,0.18)" />
              <Area type="monotone" dataKey="oer" name="OER" stroke="#ED8000" fill="rgba(237,128,0,0.14)" />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <h2>OEE do turno em curso</h2>
          {shiftOee ? (
            <>
              <div className={`oee-gauge ${oeeTone(shiftOee.oee)}`}>
                <strong>{formatPercent(shiftOee.oee)}</strong>
                <span>OEE apurado</span>
              </div>
              <div className="oee-breakdown">
                <div className="oee-item">
                  <span>Disponibilidade</span>
                  <strong>{formatPercent(shiftOee.availability)}</strong>
                  <small>tempo produtivo / planejado</small>
                </div>
                <div className="oee-item">
                  <span>Performance</span>
                  <strong>{formatPercent(shiftOee.performance)}</strong>
                  <small>peças boas / teóricas</small>
                </div>
                <div className="oee-item">
                  <span>Qualidade</span>
                  <strong>{formatPercent(shiftOee.quality)}</strong>
                  <small>boas / (boas + refugos)</small>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Sem apontamentos no turno.</p>
          )}
        </article>
      </section>

      <section className="chart-grid">
        <article className="panel">
          <h2>OEE mensal</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid stroke="#E2E7EC" />
              <XAxis dataKey="date" stroke="#8B949C" />
              <YAxis domain={[70, 100]} stroke="#8B949C" />
              <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,153,222,0.08)' }} />
              <Bar dataKey="oee" name="OEE" fill="#0099DE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <h2>Produtividade x Qualidade</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kpis}>
              <CartesianGrid stroke="#E2E7EC" />
              <XAxis dataKey="date" stroke="#8B949C" />
              <YAxis domain={[80, 100]} stroke="#8B949C" />
              <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,153,222,0.08)' }} />
              <Legend />
              <Bar dataKey="productivity" name="Produtividade" fill="#1153A1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="quality" name="Qualidade" fill="#3C8A2E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <article className="panel">
        <h2>Máquinas · turno atual</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Status</th>
                <th>Produto / OF</th>
                <th>OEE</th>
                <th>Boas</th>
                <th>Refugo</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {visibleMachines.map((m) => (
                <tr key={m.code}>
                  <td>
                    <b>{m.code}</b>
                  </td>
                  <td>
                    <span className={`pill ${m.status}`}>{m.status}</span>
                  </td>
                  <td>
                    {m.product}
                    <small className="block muted">{m.ofNumber}</small>
                  </td>
                  <td>{formatPercent(m.oee)}</td>
                  <td>{formatNumber(m.goodParts)}</td>
                  <td>{formatNumber(m.scrapParts)}</td>
                  <td>{m.operatorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
