export type WorkOrderStatus = 'aberta' | 'em_atendimento' | 'aguardando_peca' | 'concluida'
export type WorkOrderType = 'corretiva' | 'preventiva' | 'tpm_ma'

export type WorkOrderAction = {
  id: string
  at: string
  author: string
  note: string
}

export type WorkOrder = {
  id: string
  machineCode: string
  openedAt: string
  openedBy: string
  type: WorkOrderType
  status: WorkOrderStatus
  description: string
  stopCode?: string
  actions: WorkOrderAction[]
}

export const WO_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando_peca: 'Aguardando Peça',
  concluida: 'Concluída',
}

export type TpmChecklistItem = {
  id: string
  label: string
  done: boolean
}

export type TpmChecklist = {
  id: string
  machineCode: string
  date: string
  shift: string
  operatorName: string
  items: TpmChecklistItem[]
}
