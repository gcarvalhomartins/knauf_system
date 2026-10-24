import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@widgets/app-header/ui/AppHeader'
import { downloadSapFile } from '@features/sap-export/lib/build-sap-payload'
import { useAuth } from '@features/auth/ui/AuthContext'
import { canAccess } from '@features/auth/model/permissions'
import { api } from '@shared/api/client'
import { HOUR_SLOTS, MACHINE_CODES, SHIFTS } from '@shared/config/constants'
import { STOP_REASONS } from '@entities/stop-reason/model/types'
import type { HourlyRecord, ProductionEntry } from '@entities/production/model/types'
import type { LabelScan } from '@entities/label/model/types'
import { BarcodeScannerPanel } from '@features/barcode-scanner/ui/BarcodeScannerPanel'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'

function emptyHours(): HourlyRecord[] {
  return HOUR_SLOTS.map((slot) => ({
    slot,
    cycleStart: 0,
    cycleEnd: 0,
    stopMinutes: 0,
    cycleTimeS: 48,
    silo: 'S2',
  }))
}

export function ApontamentoPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [entry, setEntry] = useState<ProductionEntry | null>(null)
  const [saved, setSaved] = useState('')
  const [scans, setScans] = useState<LabelScan[]>([])

  useEffect(() => {
    void api.listEntries().then((list) => {
      setEntries(list)
      setEntry(list[0] ?? null)
    })
  }, [])

  useEffect(() => {
    if (!entry) return
    void api.listLabelScans(entry.id).then(setScans)
  }, [entry?.id])

  const stopMin = useMemo(
    () => entry?.hours.reduce((s, h) => s + Number(h.stopMinutes || 0), 0) ?? 0,
    [entry],
  )

  if (!entry) return <div className="page-pad">Carregando ficha F48…</div>

  function patch(partial: Partial<ProductionEntry>) {
    setEntry((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  function patchHour(index: number, partial: Partial<HourlyRecord>) {
    setEntry((prev) => {
      if (!prev) return prev
      const hours = prev.hours.map((h, i) => (i === index ? { ...h, ...partial } : h))
      return { ...prev, hours }
    })
  }

  async function save() {
    if (!entry) return
    const stored = await api.saveEntry(entry)
    setEntries(await api.listEntries())
    setEntry(stored)
    setSaved('Apontamento gravado (mock). Pronto para exportar ao SAP.')
  }

  async function validate() {
    if (!entry) return
    await api.validateEntry(entry.id)
    setEntries(await api.listEntries())
    setEntry({ ...entry, validated: true })
    setSaved('Lançamento validado pelo líder.')
  }

  return (
    <div className="page-pad">
      <AppHeader
        title="Apontamento digital F48"
        subtitle="Substituição da ficha de produção · apontamento hora a hora"
        actions={
          <>
            {canAccess(user!.role, 'sap') ? (
              <Button variant="ghost" onClick={() => downloadSapFile(entry)}>
                Exportar SAP
              </Button>
            ) : null}
            {user?.role === 'lider' || user?.role === 'gestao' ? (
              <Button variant="warn" onClick={() => void validate()}>
                Validar lançamento
              </Button>
            ) : null}
            <Button onClick={() => void save()}>Salvar turno</Button>
          </>
        }
      />
      {saved ? <p className="toast">{saved}</p> : null}

      <section className="panel form-grid">
        <label>
          Data
          <input type="date" value={entry.date} onChange={(e) => patch({ date: e.target.value })} />
        </label>
        <label>
          Turno
          <select value={entry.shift} onChange={(e) => patch({ shift: e.target.value as ProductionEntry['shift'] })}>
            {SHIFTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.window})
              </option>
            ))}
          </select>
        </label>
        <label>
          Máquina
          <select value={entry.machineCode} onChange={(e) => patch({ machineCode: e.target.value })}>
            {MACHINE_CODES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Operador
          <input value={entry.operatorName} onChange={(e) => patch({ operatorName: e.target.value })} />
        </label>
        <label>
          Líder
          <input value={entry.leaderName} onChange={(e) => patch({ leaderName: e.target.value })} />
        </label>
        <label>
          Status
          <div className="field-static">
            {entry.validated ? <Badge tone="green">Validado</Badge> : <Badge tone="yellow">Pendente</Badge>}
          </div>
        </label>
      </section>

      <section className="panel form-grid">
        <h2 className="span-all">Produto / OF</h2>
        <label>
          Peça / descrição
          <input value={entry.product} onChange={(e) => patch({ product: e.target.value })} />
        </label>
        <label>
          Peças por ciclo
          <input
            type="number"
            value={entry.partsPerCycle}
            onChange={(e) => patch({ partsPerCycle: Number(e.target.value) })}
          />
        </label>
        <label>
          Nº OF
          <input value={entry.ofNumber} onChange={(e) => patch({ ofNumber: e.target.value })} />
        </label>
        <label>
          Peças por etiqueta
          <input
            type="number"
            min={1}
            value={entry.packageQty ?? entry.partsPerCycle}
            onChange={(e) => patch({ packageQty: Math.max(1, Number(e.target.value)) })}
          />
        </label>
        <label>
          Etiqueta inicial
          <input value={entry.labelStart} onChange={(e) => patch({ labelStart: e.target.value })} />
        </label>
        <label>
          Etiqueta final
          <input value={entry.labelEnd} onChange={(e) => patch({ labelEnd: e.target.value })} />
        </label>
        <label>
          Extraviada / reutilizada
          <input
            type="number"
            value={entry.labelsLost}
            onChange={(e) => patch({ labelsLost: Number(e.target.value) })}
          />
        </label>
        <label>
          Início
          <input value={entry.startTime} onChange={(e) => patch({ startTime: e.target.value })} />
        </label>
        <label>
          Fim
          <input value={entry.endTime} onChange={(e) => patch({ endTime: e.target.value })} />
        </label>
        <label>
          Ciclo inicial
          <input
            type="number"
            value={entry.cycleCounterStart}
            onChange={(e) => patch({ cycleCounterStart: Number(e.target.value) })}
          />
        </label>
        <label>
          Ciclo final
          <input
            type="number"
            value={entry.cycleCounterEnd}
            onChange={(e) => patch({ cycleCounterEnd: Number(e.target.value) })}
          />
        </label>
      </section>

      <BarcodeScannerPanel entry={entry} scans={scans} onScansChange={setScans} />

      <section className="panel">
        <div className="row-between">
          <h2>Controle horário</h2>
          <span className="muted">Tempo de parada no turno: {stopMin} min</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Ciclo ini</th>
                <th>Ciclo fim</th>
                <th>Motivo</th>
                <th>Parada (min)</th>
                <th>Ciclo (s)</th>
                <th>Silo</th>
              </tr>
            </thead>
            <tbody>
              {entry.hours.map((h, i) => (
                <tr key={h.slot}>
                  <td>{h.slot}</td>
                  <td>
                    <input
                      className="cell"
                      type="number"
                      value={h.cycleStart}
                      onChange={(e) => patchHour(i, { cycleStart: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      className="cell"
                      type="number"
                      value={h.cycleEnd}
                      onChange={(e) => patchHour(i, { cycleEnd: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select
                      className="cell"
                      value={h.stopCode ?? ''}
                      onChange={(e) => patchHour(i, { stopCode: e.target.value || undefined })}
                    >
                      <option value="">—</option>
                      {STOP_REASONS.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.code} {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="cell"
                      type="number"
                      value={h.stopMinutes}
                      onChange={(e) => patchHour(i, { stopMinutes: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      className="cell"
                      type="number"
                      value={h.cycleTimeS}
                      onChange={(e) => patchHour(i, { cycleTimeS: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input className="cell" value={h.silo} onChange={(e) => patchHour(i, { silo: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="legend-grid">
        <article className="panel">
          <h3>Motivos técnicos</h3>
          <ul>
            {STOP_REASONS.filter((r) => r.category === 'tecnica').map((r) => (
              <li key={r.code}>
                <b>{r.code}</b> {r.label}
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h3>Fora de padrão</h3>
          <ul>
            {STOP_REASONS.filter((r) => r.category === 'fora_padrao').map((r) => (
              <li key={r.code}>
                <b>{r.code}</b> {r.label}
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h3>Fichas do dia</h3>
          <ul>
            {entries.map((e) => (
              <li key={e.id}>
                <button className="linkish" onClick={() => setEntry(e)}>
                  {e.machineCode} · T{e.shift} {e.validated ? '✓' : ''}
                </button>
              </li>
            ))}
            <li>
              <Button
                variant="ghost"
                onClick={() =>
                  setEntry({
                    ...entry,
                    id: `ap-${Date.now()}`,
                    validated: false,
                    hours: emptyHours(),
                    machineCode: 'P01',
                  })
                }
              >
                Nova ficha
              </Button>
            </li>
          </ul>
        </article>
      </section>
    </div>
  )
}
