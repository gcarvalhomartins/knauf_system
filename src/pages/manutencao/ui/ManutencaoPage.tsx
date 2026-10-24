import { useEffect, useState } from 'react'
import { AppHeader } from '@widgets/app-header/ui/AppHeader'
import { OpenWorkOrderForm } from '@features/work-order/ui/OpenWorkOrderForm'
import { useAuth } from '@features/auth/ui/AuthContext'
import { api } from '@shared/api/client'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Modal } from '@shared/ui/Modal'
import {
  WO_STATUS_LABEL,
  type TpmChecklist,
  type WorkOrder,
  type WorkOrderStatus,
} from '@entities/work-order/model/types'

const tone: Record<WorkOrderStatus, 'red' | 'yellow' | 'blue' | 'green'> = {
  aberta: 'red',
  em_atendimento: 'yellow',
  aguardando_peca: 'blue',
  concluida: 'green',
}

const STATUS_FLOW: WorkOrderStatus[] = ['aberta', 'em_atendimento', 'aguardando_peca', 'concluida']

export function ManutencaoPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [tpms, setTpms] = useState<TpmChecklist[]>([])
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [selected, setSelected] = useState<WorkOrder | null>(null)
  const [filter, setFilter] = useState<'todas' | WorkOrderStatus>('todas')

  async function refresh() {
    setOrders(await api.listWorkOrders())
    setTpms(await api.listTpm())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function changeStatus(id: string, status: WorkOrderStatus) {
    await api.updateWorkOrder(id, { status })
    await refresh()
  }

  const visible = filter === 'todas' ? orders : orders.filter((o) => o.status === filter)
  const openCount = orders.filter((o) => o.status !== 'concluida').length

  return (
    <div className="page-pad">
      <AppHeader
        title="Manutenção & TPM MA"
        subtitle="Ordens de serviço e checklist autônomo por turno"
        actions={
          <>
            <Button variant="ghost" onClick={() => void refresh()}>
              Atualizar
            </Button>
            <Button onClick={() => setOpen(true)}>Nova OS</Button>
          </>
        }
      />

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span>OS abertas</span>
          </div>
          <strong>{openCount}</strong>
          <small>de {orders.length} ordens no total</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Em atendimento</span>
          </div>
          <strong>{orders.filter((o) => o.status === 'em_atendimento').length}</strong>
          <small>técnico de manutenção ativo</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Aguardando peça</span>
          </div>
          <strong>{orders.filter((o) => o.status === 'aguardando_peca').length}</strong>
          <small>reserva pendente no SAP</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Checklists TPM</span>
          </div>
          <strong>{tpms.length}</strong>
          <small>
            {tpms.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0)} itens concluídos
          </small>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="row-between">
            <h2>Ordens de serviço</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="todas">Todas</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {WO_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="os-list">
            {visible.map((wo) => (
              <article key={wo.id} className="os-card">
                <header>
                  <strong>
                    {wo.id} · {wo.machineCode}
                  </strong>
                  <Badge tone={tone[wo.status]}>{WO_STATUS_LABEL[wo.status]}</Badge>
                </header>
                <p>{wo.description}</p>
                <small className="muted">
                  {wo.openedAt} · {wo.openedBy} · {wo.type}
                  {wo.stopCode ? ` · motivo ${wo.stopCode}` : ''}
                </small>
                <ul className="actions">
                  {wo.actions.map((a) => (
                    <li key={a.id}>
                      <b>{a.at}</b> {a.author}: {a.note}
                    </li>
                  ))}
                </ul>
                {user?.role !== 'operador' ? (
                  <div className="row gap">
                    <select value={wo.status} onChange={(e) => void changeStatus(wo.id, e.target.value as WorkOrderStatus)}>
                      {Object.entries(WO_STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(wo)}>
                      Registrar ação
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
            {visible.length === 0 ? <p className="muted">Nenhuma OS neste filtro.</p> : null}
          </div>
        </section>

        <section className="panel">
          <h2>Checklist TPM MA</h2>
          {tpms.map((cl) => {
            const done = cl.items.filter((i) => i.done).length
            const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0
            return (
              <div key={cl.id} className="tpm">
                <p>
                  <b>{cl.machineCode}</b> · {cl.date} · {cl.shift}º turno · {cl.operatorName}
                </p>
                <div className="tpm-progress">
                  <div className="tpm-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <small>
                    {done}/{cl.items.length} ({pct}%)
                  </small>
                </div>
                {cl.items.map((item) => (
                  <label key={item.id} className="check">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => void api.toggleTpmItem(cl.id, item.id).then(() => refresh())}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            )
          })}
        </section>
      </div>

      <Modal open={open} title="Nova ordem de serviço" onClose={() => setOpen(false)}>
        <OpenWorkOrderForm
          author={user?.name ?? ''}
          onSubmit={async (payload) => {
            await api.createWorkOrder({ ...payload, openedBy: user?.name ?? '' })
            setOpen(false)
            await refresh()
          }}
        />
      </Modal>

      <Modal open={Boolean(selected)} title={`Ação · ${selected?.id ?? ''}`} onClose={() => setSelected(null)}>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!selected || !user) return
            void api.addWorkOrderAction(selected.id, user.name, note).then(() => {
              setNote('')
              setSelected(null)
              void refresh()
            })
          }}
        >
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} required placeholder="Ação tomada" />
          <Button type="submit">Salvar ação</Button>
        </form>
      </Modal>
    </div>
  )
}
