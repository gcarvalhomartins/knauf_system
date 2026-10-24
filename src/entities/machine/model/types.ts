export type MachineStatus = 'running' | 'setup' | 'down'

export type Machine = {
  id: string
  code: string
  name: string
  area: string
  status: MachineStatus
  cycleTimeS: number
  currentCycleS: number
  stopReasonCode?: string
  stopReasonLabel?: string
  stopMinutes: number
  /** Timestamp real de inicio da parada — base do contador ao vivo do Andon */
  stopSince?: string
  oee: number
  goodParts: number
  scrapParts: number
  operatorName: string
  ofNumber: string
  product: string
  silo: string
}

export const STATUS_LABEL: Record<MachineStatus, string> = {
  running: 'Produzindo',
  setup: 'Alerta / Setup',
  down: 'Parada / Problema',
}
