import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleSlash, FileCheck2, RefreshCw } from 'lucide-react'
import { AppHeader } from '@widgets/app-header/ui/AppHeader'
import { api } from '@shared/api/client'
import { formatNumber, formatPercent } from '@shared/lib/format'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { KpiCard } from '@shared/ui/KpiCard'
import {
  buildConciliation,
  canCloseShift,
  type ConciliationRow,
} from '@features/sap-reconciliation/lib/build-conciliation'
import type { ProductionEntry } from '@entities/production/model/types'
import type { LabelScan } from '@entities/label/model/types'
import type { SapMovement } from '@entities/sap/model/types'

const STATUS_META: Record<
  ConciliationRow['status'],
  { label: string; tone: 'green' | 'yellow' | 'red' | 'gray'; icon: typeof CheckCircle2 }
> = {
  ok: { label: 'Conciliado', tone: 'green', icon: CheckCircle2 },
  atencao: { label: 'Atenção', tone: 'yellow', icon: AlertTriangle },
  divergente: { label: 'Divergente', tone: 'red', icon: AlertTriangle },
  pendente: { label: 'Pendente SAP', tone: 'gray', icon: CircleSlash },
}

export function SapConciliationPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [scans, setScans] = useState<LabelScan[]>([])
  const [movements, setMovements] = useState<SapMovement[]>([])
  const [closed, setClosed] = useState<string[]>([])

  async function refresh() {
    const [e, s, m] = await Promise.all([
      api.listEntries(),
      api.listLabelScans(),
      api.listSapMovements(),
    ])
    setEntries(e)
    setScans(s)
    setMovements(m)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const rows = useMemo(() => buildConciliation(entries, scans, movements), [entries, scans, movements])
  const closedOk = canCloseShift(rows)

  const totals = useMemo(() => {
    const sap = rows.reduce((s, r) => s + r.sapParts, 0)
    const cycle = rows.reduce((s, r) => s + r.cycleParts, 0)
    const scanned = rows.reduce((s, r) => s + r.scannedParts, 0)
    const divergentes = rows.filter((r) => r.status === 'divergente' || r.status === 'pendente').length
    return { sap, cycle, scanned, divergentes, diffPct: sap > 0 ? ((cycle - sap) / sap) * 100 : 0 }
  }, [rows])

  return (
    <div className="page-pad">
      <AppHeader
        title="Conciliação com o SAP"
        subtitle="Cruzamento entre o apontamento real (contadores + etiquetas) e o realizado no SAP"
        actions={
          <>
            <Button variant="ghost" onClick={() => void refresh()}>
              <RefreshCw size={16} /> Atualizar
            </Button>
            <Button
              variant={closedOk ? 'primary' : 'warn'}
              disabled={!closedOk}
              onClick={() => {
                setClosed(rows.map((r) => r.id))
              }}
            >
              <FileCheck2 size={16} /> Fechar turno
            </Button>
          </>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Peças no SAP"
          value={formatNumber(totals.sap)}
          hint={`${movements.length} lançamentos no período`}
          tone={totals.diffPct === 0 ? 'ok' : 'warn'}
        />
        <KpiCard
          label="Peças apontadas (ciclo)"
          value={formatNumber(totals.cycle)}
          hint={`Divergência ${formatPercent(totals.diffPct, 2)}`}
          tone={Math.abs(totals.diffPct) <= 1 ? 'ok' : 'bad'}
        />
        <KpiCard
          label="Peças etiquetadas"
          value={formatNumber(totals.scanned)}
          hint={`${scans.length} etiquetas lidas`}
        />
        <KpiCard
          label="Turnos bloqueados"
          value={String(totals.divergentes)}
          hint={totals.divergentes === 0 ? 'Fechamento liberado' : 'Requer tratativa da divergência'}
          tone={totals.divergentes === 0 ? 'ok' : 'bad'}
        />
      </section>

      <section className="panel">
        <div className="row-between">
          <h2>Turnos em conciliação</h2>
          <span className="muted">
            Tolerância: 1% (ok) · 3% (atenção) · acima disso bloqueia o fechamento
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Turno</th>
                <th>OF</th>
                <th>Ciclo</th>
                <th>Etiquetas</th>
                <th>SAP</th>
                <th>Div. SAP</th>
                <th>Div. interna</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = STATUS_META[r.status]
                const Icon = meta.icon
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{r.machineCode}</b>
                      <small className="block muted">{r.operatorName}</small>
                    </td>
                    <td>{r.shift}º</td>
                    <td>{r.ofNumber}</td>
                    <td>{formatNumber(r.cycleParts)}</td>
                    <td>{formatNumber(r.scannedParts)}</td>
                    <td>{formatNumber(r.sapParts)}</td>
                    <td className={Math.abs(r.sapDiffPct) > 3 ? 'bad-text' : Math.abs(r.sapDiffPct) > 1 ? 'warn-text' : 'ok-text'}>
                      {r.sapParts > 0 ? formatPercent(r.sapDiffPct, 2) : '—'}
                    </td>
                    <td className={Math.abs(r.internalDiffPct) > 3 ? 'bad-text' : Math.abs(r.internalDiffPct) > 1 ? 'warn-text' : 'ok-text'}>
                      {formatPercent(r.internalDiffPct, 2)}
                    </td>
                    <td>
                      <span className={`recon-status ${r.status}`}>
                        <Icon size={14} /> {meta.label}
                      </span>
                      {r.notes.map((n) => (
                        <small key={n} className="block muted">
                          {n}
                        </small>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {closed.length > 0 ? (
        <div className="toast">
          <CheckCircle2 size={16} /> Turno conciliado e apto para fechamento no SAP ({closed.length} apontamento(s)).
        </div>
      ) : null}

      <section className="legend-grid">
        <article className="panel">
          <h3>Critério de conciliação</h3>
          <ul className="criteria">
            <li>
              <b>Origem real:</b> contador de ciclo da injetora (peças teóricas produzidas).
            </li>
            <li>
              <b>Origem rastreável:</b> soma das etiquetas lidas × quantidade por embalagem.
            </li>
            <li>
              <b>Origem SAP:</b> confirmação de.quantity na ordem de fabricação.
            </li>
          </ul>
        </article>
        <article className="panel">
          <h3>Status</h3>
          <div className="stack">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} className="row-between">
                <span className={`recon-status ${key}`}>
                  <meta.icon size={14} /> {meta.label}
                </span>
                <Badge tone={meta.tone}>{key === 'ok' ? 'auto' : key === 'atencao' ? 'justificativa' : 'bloqueia'}</Badge>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3>Fechamento de turno</h3>
          <p className="muted">
            O fechamento só é liberado quando todas as linhas estão conciliadas ou dentro da faixa de
            atenção com justificativa registrada. Divergências acima de 3% exigem acerto no SAP ou
            novo apontamento.
          </p>
          <Badge tone={closedOk ? 'green' : 'red'}>{closedOk ? 'Liberado' : 'Bloqueado'}</Badge>
        </article>
      </section>
    </div>
  )
}
