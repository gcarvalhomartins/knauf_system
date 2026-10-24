import type { Machine } from '@entities/machine/model/types'
import type { AbsenteeismLog, DailyKpi, ProductionEntry } from '@entities/production/model/types'
import type { LabelScan } from '@entities/label/model/types'
import type { SapMovement } from '@entities/sap/model/types'
import type { User } from '@entities/user/model/types'
import type { TpmChecklist, WorkOrder } from '@entities/work-order/model/types'

export const users: User[] = [
  { id: 'u1', name: 'Carlos Oliveira', role: 'operador', shift: '1', badge: 'OP-1021', password: '1' },
  { id: 'u2', name: 'Fernanda Souza', role: 'operador', shift: '2', badge: 'OP-1188', password: '2' },
  { id: 'u3', name: 'Igor Mendes', role: 'operador', shift: '3', badge: 'OP-1304', password: '3' },
  { id: 'u4', name: 'Ricardo Alves', role: 'lider', shift: '1', badge: 'LD-044', password: '4' },
  { id: 'u5', name: 'Juliana Costa', role: 'manutencao', badge: 'MT-017', password: '5' },
  { id: 'u6', name: 'Amanda', role: 'gestao', badge: 'GF-001', password: '6' },
]

const products = [
  { of: 'OF-88421', name: 'Caixa EPS 40L', ppc: 2, silo: 'S2', packQty: 2 },
  { of: 'OF-88455', name: 'Bandeja Hortifruti', ppc: 4, silo: 'S1', packQty: 4 },
  { of: 'OF-88502', name: 'Isolador Térmico', ppc: 1, silo: 'S3', packQty: 1 },
  { of: 'OF-88540', name: 'Embalagem Automotiva', ppc: 2, silo: 'S4', packQty: 2 },
]

function machine(
  code: string,
  status: Machine['status'],
  extras: Partial<Machine>,
): Machine {
  const product = products[Number(code.replace('P', '')) % products.length]
  return {
    id: code,
    code,
    name: `Injetora ${code}`,
    area: 'Injeção EPS',
    status,
    cycleTimeS: 48,
    currentCycleS: 47,
    stopMinutes: 0,
    oee: 91.2,
    goodParts: 1840,
    scrapParts: 22,
    operatorName: 'Carlos Oliveira',
    ofNumber: product.of,
    product: product.name,
    silo: product.silo,
    ...extras,
  }
}

export const machines: Machine[] = [
  machine('P01', 'running', { oee: 93.4, goodParts: 1920, scrapParts: 12 }),
  machine('P02', 'running', { oee: 90.1, goodParts: 1760, scrapParts: 18, operatorName: 'Fernanda Souza' }),
  machine('P03', 'down', {
    oee: 61.0,
    stopReasonCode: 'X',
    stopReasonLabel: 'Pane mecânica',
    stopMinutes: 47,
    stopSince: new Date(Date.now() - 47 * 60000).toISOString(),
    goodParts: 820,
    scrapParts: 40,
  }),
  machine('P04', 'running', { oee: 89.8, goodParts: 1888, scrapParts: 16 }),
  machine('P05', 'setup', {
    oee: 72.4,
    stopReasonCode: 'T',
    stopReasonLabel: 'Troca de Molde',
    stopMinutes: 22,
    stopSince: new Date(Date.now() - 22 * 60000).toISOString(),
  }),
  machine('P06', 'running', { oee: 94.1, goodParts: 2010, scrapParts: 8 }),
  machine('P07', 'down', {
    oee: 54.2,
    stopReasonCode: 'F',
    stopReasonLabel: 'Falta MP silo',
    stopMinutes: 18,
    stopSince: new Date(Date.now() - 18 * 60000).toISOString(),
    operatorName: 'Igor Mendes',
  }),
  machine('P08', 'running', { oee: 88.6, goodParts: 1704, scrapParts: 28 }),
  machine('P09', 'setup', {
    oee: 79.0,
    stopReasonCode: 'B',
    stopReasonLabel: 'Refeição',
    stopMinutes: 12,
    stopSince: new Date(Date.now() - 12 * 60000).toISOString(),
  }),
  machine('P10', 'running', { oee: 91.7, goodParts: 1860, scrapParts: 14 }),
  machine('P11', 'down', {
    oee: 48.5,
    stopReasonCode: 'E',
    stopReasonLabel: 'Pane elétrica',
    stopMinutes: 63,
    stopSince: new Date(Date.now() - 63 * 60000).toISOString(),
  }),
  machine('P12', 'running', { oee: 92.0, goodParts: 1944, scrapParts: 10 }),
  machine('P14', 'running', { oee: 87.3, goodParts: 1680, scrapParts: 31 }),
  machine('P16', 'setup', {
    oee: 74.8,
    stopReasonCode: 'C',
    stopReasonLabel: 'Troca de MP',
    stopMinutes: 16,
    stopSince: new Date(Date.now() - 16 * 60000).toISOString(),
    operatorName: 'Fernanda Souza',
  }),
]

const hourBase = [
  { slot: '06–07', cycleStart: 120440, cycleEnd: 120512, stopMinutes: 0, cycleTimeS: 48, silo: 'S2' },
  { slot: '07–08', cycleStart: 120512, cycleEnd: 120586, stopMinutes: 4, cycleTimeS: 48, silo: 'S2', stopCode: 'L' },
  { slot: '08–09', cycleStart: 120586, cycleEnd: 120658, stopMinutes: 0, cycleTimeS: 47, silo: 'S2' },
  { slot: '09–10', cycleStart: 120658, cycleEnd: 120700, stopMinutes: 18, cycleTimeS: 49, silo: 'S2', stopCode: 'R' },
  { slot: '10–11', cycleStart: 120700, cycleEnd: 120772, stopMinutes: 0, cycleTimeS: 48, silo: 'S2' },
  { slot: '11–12', cycleStart: 120772, cycleEnd: 120790, stopMinutes: 32, cycleTimeS: 48, silo: 'S2', stopCode: 'B' },
  { slot: '12–13', cycleStart: 120790, cycleEnd: 120862, stopMinutes: 0, cycleTimeS: 48, silo: 'S2' },
  { slot: '13–14', cycleStart: 120862, cycleEnd: 120910, stopMinutes: 8, cycleTimeS: 48, silo: 'S2', stopCode: 'H' },
]

export let productionEntries: ProductionEntry[] = [
  {
    id: 'ap-p04-hoje',
    date: '2026-10-24',
    shift: '1',
    machineCode: 'P04',
    operatorId: 'u1',
    operatorName: 'Carlos Oliveira',
    leaderName: 'Ricardo Alves',
    product: 'Caixa EPS 40L',
    partsPerCycle: 2,
    ofNumber: 'OF-88421',
    labelStart: 'ET-100230',
    labelEnd: 'ET-100699',
    labelsLost: 0,
    startTime: '06:02',
    endTime: '14:00',
    cycleCounterStart: 120440,
    cycleCounterEnd: 120910,
    hours: hourBase,
    validated: true,
    packageQty: 2,
  },
  {
    id: 'ap-p02-hoje',
    date: '2026-10-24',
    shift: '1',
    machineCode: 'P02',
    operatorId: 'u2',
    operatorName: 'Fernanda Souza',
    leaderName: 'Ricardo Alves',
    product: 'Bandeja Hortifruti',
    partsPerCycle: 4,
    ofNumber: 'OF-88455',
    labelStart: 'ET-200101',
    labelEnd: 'ET-200481',
    labelsLost: 1,
    startTime: '06:00',
    endTime: '14:00',
    cycleCounterStart: 88010,
    cycleCounterEnd: 88390,
    hours: hourBase.map((h) => ({ ...h, cycleStart: h.cycleStart + 67570, cycleEnd: h.cycleEnd + 67570, silo: 'S1' })),
    validated: false,
    packageQty: 4,
  },
]

/**
 * Etiquetas escaneadas do turno 1 da P04.
 * Regra: qtd de pecas = qtd por embalagem (2) x nº de etiquetas escaneadas.
 * A ultima etiqueta da faixa (ET-100699) fica sem leitura para simular
 * uma perda de rastreabilidade detectada na conciliacao SAP.
 */
export const labelScans: LabelScan[] = Array.from({ length: 469 }, (_, i) => {
  const seq = 100230 + i
  const labelCode = `ET-${seq}`
  return {
    id: `scan-${seq}`,
    entryId: 'ap-p04-hoje',
    code: `KNF|OF-88421|${labelCode}|CX40L|2`,
    labelCode,
    ofNumber: 'OF-88421',
    product: 'Caixa EPS 40L',
    packageQty: 2,
    machineCode: 'P04',
    shift: '1',
    operatorName: 'Carlos Oliveira',
    scannedAt: new Date(Date.UTC(2026, 9, 24, 6, 12 + i * 0.6)).toISOString(),
  }
})

export const sapMovements: SapMovement[] = [
  {
    id: 'mov-1',
    ofNumber: 'OF-88421',
    machineCode: 'P04',
    shift: '1',
    date: '2026-10-24',
    goodQty: 940,
    scrapQty: 0,
    postedBy: 'Ricardo Alves',
    postedAt: '2026-10-24 14:05',
  },
  {
    id: 'mov-2',
    ofNumber: 'OF-88455',
    machineCode: 'P02',
    shift: '1',
    date: '2026-10-24',
    goodQty: 1520,
    scrapQty: 18,
    postedBy: 'Ricardo Alves',
    postedAt: '2026-10-24 14:10',
  },
  {
    id: 'mov-3',
    ofNumber: 'OF-88502',
    machineCode: 'P07',
    shift: '2',
    date: '2026-10-23',
    goodQty: 800,
    scrapQty: 40,
    postedBy: 'Ricardo Alves',
    postedAt: '2026-10-24 06:15',
  },
]

export const dailyKpis: DailyKpi[] = [
  { date: '01', oee: 86.2, oer: 84.1, productivity: 87.0, quality: 98.1, goodParts: 21400, scrapParts: 410, runHours: 86, stopHours: 18 },
  { date: '04', oee: 87.4, oer: 85.0, productivity: 88.2, quality: 98.4, goodParts: 22110, scrapParts: 360, runHours: 88, stopHours: 16 },
  { date: '08', oee: 85.1, oer: 83.2, productivity: 85.8, quality: 97.9, goodParts: 20880, scrapParts: 448, runHours: 82, stopHours: 22 },
  { date: '12', oee: 89.6, oer: 87.4, productivity: 90.1, quality: 98.8, goodParts: 23140, scrapParts: 280, runHours: 91, stopHours: 13 },
  { date: '16', oee: 90.2, oer: 88.0, productivity: 90.8, quality: 98.9, goodParts: 23600, scrapParts: 262, runHours: 92, stopHours: 12 },
  { date: '20', oee: 88.4, oer: 86.5, productivity: 89.0, quality: 98.6, goodParts: 22850, scrapParts: 324, runHours: 89, stopHours: 15 },
  { date: '24', oee: 86.9, oer: 85.2, productivity: 87.6, quality: 98.3, goodParts: 22312, scrapParts: 386, runHours: 87, stopHours: 17 },
]

export const monthlyKpis: DailyKpi[] = [
  { date: 'Mai', oee: 84.1, oer: 82.0, productivity: 85.2, quality: 97.8, goodParts: 480000, scrapParts: 10800, runHours: 2100, stopHours: 420 },
  { date: 'Jun', oee: 85.6, oer: 83.4, productivity: 86.4, quality: 98.0, goodParts: 492000, scrapParts: 10040, runHours: 2140, stopHours: 380 },
  { date: 'Jul', oee: 86.8, oer: 84.9, productivity: 87.5, quality: 98.2, goodParts: 505200, scrapParts: 9240, runHours: 2188, stopHours: 332 },
  { date: 'Ago', oee: 87.9, oer: 86.1, productivity: 88.6, quality: 98.4, goodParts: 518800, scrapParts: 8440, runHours: 2220, stopHours: 300 },
  { date: 'Set', oee: 88.7, oer: 86.8, productivity: 89.4, quality: 98.6, goodParts: 526400, scrapParts: 7480, runHours: 2254, stopHours: 266 },
  { date: 'Out', oee: 86.9, oer: 85.2, productivity: 87.6, quality: 98.3, goodParts: 401216, scrapParts: 6948, runHours: 1764, stopHours: 306 },
]

export let workOrders: WorkOrder[] = [
  {
    id: 'OS-1044',
    machineCode: 'P03',
    openedAt: '2026-10-24 08:16',
    openedBy: 'Carlos Oliveira',
    type: 'corretiva',
    status: 'em_atendimento',
    description: 'Ruído anormal no conjunto de fechamento. Máquina parou em pane mecânica.',
    stopCode: 'X',
    actions: [
      { id: 'a1', at: '08:22', author: 'Juliana Costa', note: 'OS assumida. Inspeção no cilindro de fechamento.' },
    ],
  },
  {
    id: 'OS-1045',
    machineCode: 'P11',
    openedAt: '2026-10-24 07:41',
    openedBy: 'Ricardo Alves',
    type: 'corretiva',
    status: 'aguardando_peca',
    description: 'Falha no quadro elétrico — disjuntor do aquecimento disparando.',
    stopCode: 'E',
    actions: [
      { id: 'a2', at: '07:50', author: 'Juliana Costa', note: 'Diagnóstico: contator queimado. Aguardando peça do estoque SAP.' },
    ],
  },
  {
    id: 'OS-1038',
    machineCode: 'P07',
    openedAt: '2026-10-23 22:18',
    openedBy: 'Igor Mendes',
    type: 'corretiva',
    status: 'aberta',
    description: 'Silo sem MP. Verificar alimentação e sensor de nível.',
    stopCode: 'F',
    actions: [],
  },
  {
    id: 'OS-1021',
    machineCode: 'P04',
    openedAt: '2026-10-22 10:05',
    openedBy: 'Ricardo Alves',
    type: 'preventiva',
    status: 'concluida',
    description: 'Preventiva semanal — lubrificação e inspeção de vedações.',
    actions: [
      { id: 'a3', at: '11:40', author: 'Juliana Costa', note: 'Checklist preventivo concluído. Sem não conformidades.' },
    ],
  },
]

export let tpmChecklists: TpmChecklist[] = [
  {
    id: 'tpm-p04-1',
    machineCode: 'P04',
    date: '2026-10-24',
    shift: '1',
    operatorName: 'Carlos Oliveira',
    items: [
      { id: 'i1', label: 'Limpeza da área da injetora e piso', done: true },
      { id: 'i2', label: 'Inspeção visual de vazamentos (óleo/água/vapor)', done: true },
      { id: 'i3', label: 'Verificar níveis e sensores do silo', done: true },
      { id: 'i4', label: 'Conferir proteções e botão de emergência', done: false },
      { id: 'i5', label: 'Limpeza de filtros e dreno de condensado', done: false },
    ],
  },
]

export const absenteeismLogs: AbsenteeismLog[] = [
  { id: 'ab1', date: '2026-10-24', shift: '1', machineCode: 'P08', reason: 'W', minutes: 48, operatorName: '—' },
  { id: 'ab2', date: '2026-10-23', shift: '2', machineCode: 'P14', reason: 'Z', minutes: 90, operatorName: 'Paulo Lima' },
  { id: 'ab3', date: '2026-10-23', shift: '3', machineCode: 'P02', reason: 'W', minutes: 120 },
  { id: 'ab4', date: '2026-10-22', shift: '1', machineCode: 'P16', reason: 'Z', minutes: 40, operatorName: 'Ana Dias' },
  { id: 'ab5', date: '2026-10-21', shift: '2', machineCode: 'P05', reason: 'W', minutes: 60 },
  { id: 'ab6', date: '2026-10-20', shift: '1', machineCode: 'P09', reason: 'W', minutes: 30 },
]

export const absenteeismTrend = [
  { date: 'Sem 1', value: 1.4 },
  { date: 'Sem 2', value: 1.8 },
  { date: 'Sem 3', value: 2.4 },
  { date: 'Sem 4', value: 1.9 },
]
