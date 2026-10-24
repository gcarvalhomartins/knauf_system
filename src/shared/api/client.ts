import { STOP_REASONS } from '@entities/stop-reason/model/types'
import type { Machine } from '@entities/machine/model/types'
import type { ProductionEntry } from '@entities/production/model/types'
import type { User } from '@entities/user/model/types'
import type { WorkOrder, WorkOrderStatus } from '@entities/work-order/model/types'
import type { LabelScan } from '@entities/label/model/types'
import {
  absenteeismLogs,
  absenteeismTrend,
  dailyKpis,
  labelScans,
  machines,
  monthlyKpis,
  productionEntries,
  sapMovements,
  tpmChecklists,
  users,
  workOrders,
} from './mock-db'

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  async listUsers() {
    await wait()
    return users
  },
  /** Autenticacao mock: aceita badge (ex.: OP-1021) ou nome, com senha de 1 a 6. */
  async authenticate(login: string, password: string) {
    await wait(220)
    const key = login.trim().toLowerCase()
    const user = users.find(
      (u) => u.badge.toLowerCase() === key || u.name.toLowerCase() === key,
    )
    if (!user) return { ok: false as const, reason: 'Usuario nao encontrado.' }
    if (user.password !== password.trim()) return { ok: false as const, reason: 'Senha incorreta.' }
    const { password: _p, ...safe } = user
    return { ok: true as const, user: safe }
  },
  async getUser(id: string) {
    await wait()
    return users.find((u) => u.id === id) ?? null
  },
  async listMachines() {
    await wait()
    return machines
  },
  async getMachine(code: string) {
    await wait()
    return machines.find((m) => m.code === code) ?? null
  },
  async plantSnapshot() {
    await wait()
    const running = machines.filter((m) => m.status === 'running').length
    const setup = machines.filter((m) => m.status === 'setup').length
    const down = machines.filter((m) => m.status === 'down').length
    const goodParts = machines.reduce((s, m) => s + m.goodParts, 0)
    const scrapParts = machines.reduce((s, m) => s + m.scrapParts, 0)
    const oee = machines.reduce((s, m) => s + m.oee, 0) / machines.length
    return { machines, running, setup, down, goodParts, scrapParts, oee }
  },
  async listKpis(period: 'diario' | 'mensal') {
    await wait()
    return period === 'diario' ? dailyKpis : monthlyKpis
  },
  async listEntries(filters?: { machine?: string; operator?: string }) {
    await wait()
    return productionEntries.filter((e) => {
      if (filters?.machine && filters.machine !== 'todas' && e.machineCode !== filters.machine) return false
      if (filters?.operator && filters.operator !== 'todos' && e.operatorId !== filters.operator) return false
      return true
    })
  },
  async saveEntry(entry: ProductionEntry) {
    await wait()
    const idx = productionEntries.findIndex((e) => e.id === entry.id)
    if (idx >= 0) productionEntries[idx] = entry
    else productionEntries.unshift(entry)
    return entry
  },
  async validateEntry(id: string) {
    await wait()
    const entry = productionEntries.find((e) => e.id === id)
    if (entry) entry.validated = true
    return entry
  },
  async listWorkOrders() {
    await wait()
    return workOrders
  },
  async createWorkOrder(payload: Omit<WorkOrder, 'id' | 'actions' | 'openedAt' | 'status'> & { status?: WorkOrderStatus }) {
    await wait()
    const id = `OS-${1046 + workOrders.length}`
    const wo: WorkOrder = {
      ...payload,
      id,
      openedAt: new Date().toLocaleString('pt-BR', { hour12: false }),
      status: payload.status ?? 'aberta',
      actions: [],
    }
    workOrders.unshift(wo)
    const machine = machines.find((m) => m.code === payload.machineCode)
    if (machine && payload.stopCode) {
      machine.status = STOP_REASONS.find((r) => r.code === payload.stopCode)?.planned ? 'setup' : 'down'
      machine.stopReasonCode = payload.stopCode
      machine.stopReasonLabel = STOP_REASONS.find((r) => r.code === payload.stopCode)?.label
    }
    return wo
  },
  async updateWorkOrder(id: string, patch: Partial<WorkOrder>) {
    await wait()
    const wo = workOrders.find((w) => w.id === id)
    if (!wo) return null
    Object.assign(wo, patch)
    return wo
  },
  async addWorkOrderAction(id: string, author: string, note: string) {
    await wait()
    const wo = workOrders.find((w) => w.id === id)
    if (!wo) return null
    wo.actions.push({
      id: `act-${wo.actions.length + 1}`,
      at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      author,
      note,
    })
    return wo
  },
  async listTpm() {
    await wait()
    return tpmChecklists
  },
  async toggleTpmItem(checklistId: string, itemId: string) {
    await wait()
    const cl = tpmChecklists.find((c) => c.id === checklistId)
    const item = cl?.items.find((i) => i.id === itemId)
    if (item) item.done = !item.done
    return cl
  },
  async listLabelScans(entryId?: string) {
    await wait()
    return entryId ? labelScans.filter((s) => s.entryId === entryId) : labelScans
  },
  async addLabelScan(scan: LabelScan) {
    await wait(60)
    labelScans.push(scan)
    return scan
  },
  async removeLabelScan(id: string) {
    await wait(60)
    const idx = labelScans.findIndex((s) => s.id === id)
    if (idx >= 0) labelScans.splice(idx, 1)
    return labelScans
  },
  async listSapMovements() {
    await wait()
    return sapMovements
  },
  async listAbsenteeism() {
    await wait()
    return { logs: absenteeismLogs, trend: absenteeismTrend }
  },
  async listStopReasons() {
    await wait()
    return STOP_REASONS
  },
}

export type PlantSnapshot = Awaited<ReturnType<typeof api.plantSnapshot>>
export type AuthUser = User
export type MachineList = Machine[]
