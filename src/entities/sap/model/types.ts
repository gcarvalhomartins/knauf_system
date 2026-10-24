/**
 * Entidade: Ordem de Fabricacao no SAP (lado "realizado").
 *
 * A conciliacao cruz o apontamento real (contadores de ciclo + etiquetas
 * escaneadas) com a quantidade confirmada no SAP para o fechamento de turno.
 */
export type SapOrder = {
  id: string
  ofNumber: string
  materialCode: string
  materialName: string
  machineCode: string
  shift: string
  /** Quantidade theoretically planejada (planejamento MRP) */
  plannedQty: number
  /** Quantidade confirmada/lancada no SAP */
  sapQty: number
  /** Quantidade de refugos lancada no SAP (centro de rejeitos) */
  sapScrapQty: number
  status: 'aberta' | 'parcial' | 'confirmada'
}

export type SapMovement = {
  id: string
  ofNumber: string
  machineCode: string
  shift: string
  /** Data de referencia do turno (YYYY-MM-DD) */
  date: string
  goodQty: number
  scrapQty: number
  /** Usuario que lancou no SAP */
  postedBy: string
  postedAt: string
}
