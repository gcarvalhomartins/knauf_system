export type HourlyRecord = {
  slot: string
  cycleStart: number
  cycleEnd: number
  stopCode?: string
  stopMinutes: number
  cycleTimeS: number
  silo: string
}

export type ProductionEntry = {
  id: string
  date: string
  shift: '1' | '2' | '3'
  machineCode: string
  operatorId: string
  operatorName: string
  leaderName: string
  product: string
  partsPerCycle: number
  ofNumber: string
  labelStart: string
  labelEnd: string
  labelsLost: number
  startTime: string
  endTime: string
  cycleCounterStart: number
  cycleCounterEnd: number
  hours: HourlyRecord[]
  validated: boolean
  /** Quantidade de pecas contidas em cada etiqueta (packaging) - base do leitor */
  packageQty?: number
}

export type DailyKpi = {
  date: string
  oee: number
  oer: number
  productivity: number
  quality: number
  goodParts: number
  scrapParts: number
  runHours: number
  stopHours: number
}

export type AbsenteeismLog = {
  id: string
  date: string
  shift: string
  machineCode: string
  reason: 'W' | 'Z'
  minutes: number
  operatorName?: string
}
