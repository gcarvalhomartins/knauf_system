import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { UserRoundX } from 'lucide-react'
import { AppHeader } from '@widgets/app-header/ui/AppHeader'
import { api } from '@shared/api/client'
import { brand } from '@shared/config/brand'
import { formatDuration, formatPercent } from '@shared/lib/format'
import { KpiCard } from '@shared/ui/KpiCard'
import { ABSENTEEISM_TARGET, absenteeismRate } from '@shared/lib/oee'
import type { AbsenteeismLog } from '@entities/production/model/types'

const TOOLTIP = {
  backgroundColor: '#ffffff',
  border: '1px solid #E2E7EC',
  borderRadius: 12,
  fontSize: 13,
  boxShadow: '0 10px 30px rgba(0,36,79,0.12)',
}

/**
 * Base de calculo: 14 maquinas x 3 turnos x 8h de producao planejada.
 * O absenteismo e medido sobre as horas produtivas das maquinas.
 */
const PRODUCTIVE_MIN_MONTH = 14 * 3 * 8 * 60
const DAYS_SAMPLE = 30

export function AbsenteismoPage() {
  const [logs, setLogs] = useState<AbsenteeismLog[]>([])
  const [trend, setTrend] = useState<{ date: string; value: number }[]>([])

  useEffect(() => {
    void api.listAbsenteeism().then((d) => {
      setLogs(d.logs)
      setTrend(d.trend)
    })
  }, [])

  const totals = useMemo(() => {
    const w = logs.filter((l) => l.reason === 'W').reduce((s, l) => s + l.minutes, 0)
    const z = logs.filter((l) => l.reason === 'Z').reduce((s, l) => s + l.minutes, 0)
    const rate = absenteeismRate(w + z, PRODUCTIVE_MIN_MONTH / DAYS_SAMPLE)
    const byMachine = new Map<string, number>()
    for (const l of logs) byMachine.set(l.machineCode, (byMachine.get(l.machineCode) ?? 0) + l.minutes)
    return {
      w,
      z,
      rate,
      withinTarget: rate <= ABSENTEEISM_TARGET,
      byMachine: [...byMachine.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [logs])

  return (
    <div className="page-pad">
      <AppHeader
        title="Absenteísmo operacional"
        subtitle={`Motivos W (falta de operador) e Z (operador em outra função) · meta ≤ ${ABSENTEEISM_TARGET}%`}
      />

      <section className="kpi-grid">
        <KpiCard
          label="% Absenteísmo (amostra)"
          value={formatPercent(totals.rate, 2)}
          hint={`Meta ≤ ${brand.kpis.absenteeismTarget}% · ${totals.withinTarget ? 'dentro da meta' : 'acima da meta'}`}
          tone={totals.withinTarget ? 'ok' : 'bad'}
          icon={<UserRoundX size={18} />}
        />
        <KpiCard
          label="Minutos motivo W"
          value={`${totals.w} min`}
          hint={`${formatDuration(totals.w)} · falta de operador`}
          tone="warn"
        />
        <KpiCard
          label="Minutos motivo Z"
          value={`${totals.z} min`}
          hint={`${formatDuration(totals.z)} · operador em outra função`}
          tone="warn"
        />
        <KpiCard
          label="Eventos no período"
          value={String(logs.length)}
          hint={`${totals.byMachine.length} máquinas afetadas`}
        />
      </section>

      <section className="chart-grid">
        <article className="panel">
          <h2>Tendência semanal vs. meta 2%</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid stroke="#E2E7EC" />
              <XAxis dataKey="date" stroke="#8B949C" />
              <YAxis domain={[0, 4]} stroke="#8B949C" />
              <Tooltip contentStyle={TOOLTIP} />
              <ReferenceLine y={ABSENTEEISM_TARGET} stroke="#ED8000" strokeDasharray="4 4" label="Meta 2%" />
              <Line type="monotone" dataKey="value" name="% Absenteísmo" stroke="#0099DE" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <h2>Horas perdidas por máquina</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Minutos</th>
                  <th>Horas</th>
                  <th>% da capacidade</th>
                </tr>
              </thead>
              <tbody>
                {totals.byMachine.map(([code, minutes]) => {
                  const pct = absenteeismRate(minutes, 3 * 8 * 60)
                  return (
                    <tr key={code}>
                      <td>
                        <b>{code}</b>
                      </td>
                      <td>{minutes}</td>
                      <td>{formatDuration(minutes)}</td>
                      <td className={pct > 2 ? 'bad-text' : 'ok-text'}>{formatPercent(pct, 2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <article className="panel">
        <h2>Logs de absenteísmo</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Máquina</th>
                <th>Motivo</th>
                <th>Minutos</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.date}</td>
                  <td>{l.shift}º</td>
                  <td>
                    <b>{l.machineCode}</b>
                  </td>
                  <td>
                    <span className={`pill ${l.reason === 'W' ? 'down' : 'setup'}`}>
                      {l.reason} · {l.reason === 'W' ? 'Falta operador' : 'Outra função'}
                    </span>
                  </td>
                  <td>{l.minutes}</td>
                  <td>{l.operatorName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
