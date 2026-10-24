import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ABSENTEEISM_TARGET,
  absenteeismRate,
  computeOee,
  isPlannedStop,
  splitStopMinutes,
} from '../src/shared/lib/oee.ts'
import {
  buildConciliation,
  canCloseShift,
  partsFromCycles,
} from '../src/features/sap-reconciliation/lib/build-conciliation.ts'
import type { HourlyRecord, ProductionEntry } from '../src/entities/production/model/types.ts'
import type { LabelScan } from '../src/entities/label/model/types.ts'
import type { SapMovement } from '../src/entities/sap/model/types.ts'

const h = (over: Partial<HourlyRecord> = {}): HourlyRecord => ({
  slot: '06–07',
  cycleStart: 0,
  cycleEnd: 0,
  stopMinutes: 0,
  cycleTimeS: 48,
  silo: 'S2',
  ...over,
})

const entry = (over: Partial<ProductionEntry> = {}): ProductionEntry => ({
  id: 'e1',
  date: '2026-10-24',
  shift: '1',
  machineCode: 'P04',
  operatorId: 'u1',
  operatorName: 'Carlos',
  leaderName: 'Ricardo',
  product: 'Caixa',
  partsPerCycle: 2,
  ofNumber: 'OF-88421',
  labelStart: 'ET-100000',
  labelEnd: 'ET-100999',
  labelsLost: 0,
  startTime: '06:00',
  endTime: '14:00',
  cycleCounterStart: 0,
  cycleCounterEnd: 100,
  hours: [h()],
  validated: false,
  ...over,
})

describe('classificacao de paradas', () => {
  it('paradas tecnicas planejadas nao penalizam disponibilidade', () => {
    assert.equal(isPlannedStop('B'), true)
    assert.equal(isPlannedStop('T'), true)
    assert.equal(isPlannedStop('C'), true)
  })

  it('paradas fora de padrao penalizam', () => {
    assert.equal(isPlannedStop('X'), false)
    assert.equal(isPlannedStop('W'), false)
    assert.equal(isPlannedStop('Z'), false)
  })

  it('separa minutos planejados de nao planejados', () => {
    const r = splitStopMinutes([h({ stopMinutes: 30, stopCode: 'B' }), h({ stopMinutes: 12, stopCode: 'X' })])
    assert.equal(r.planned, 30)
    assert.equal(r.unplanned, 12)
  })
})

describe('motor de OEE', () => {
  it('calcula disponibilidade descartando paradas planejadas', () => {
    // 480 min planejados - 30 de refeicao (planejada) = 450 produtivos
    // 450 - 45 de pane = 405 produtivos -> 90% de disponibilidade
    const r = computeOee({
      plannedMinutes: 480,
      hours: [h({ stopMinutes: 30, stopCode: 'B' }), h({ stopMinutes: 45, stopCode: 'X' })],
      goodParts: 380,
      scrapParts: 20,
      idealCycleS: 60,
    })
    assert.equal(Math.round(r.availability), 90)
    // teóricas = 405 min * 60 / 60 = 405 pecas -> performance = 380/405
    assert.equal(Math.round(r.performance), 94)
    assert.equal(Math.round(r.quality), 95)
  })

  it('devolve oEE dentro de 0 a 100', () => {
    const r = computeOee({
      plannedMinutes: 480,
      hours: [h({ stopMinutes: 10, stopCode: 'X' })],
      goodParts: 400,
      scrapParts: 0,
      idealCycleS: 60,
    })
    assert.ok(r.oee >= 0 && r.oee <= 100)
  })
})

describe('absenteismo', () => {
  it('calcula a taxa sobre as horas produtivas', () => {
    // 60 min perdidos sobre 3000 min produtivos = 2%
    assert.equal(absenteeismRate(60, 3000), 2)
  })

  it('respeita a meta de 2%', () => {
    assert.equal(ABSENTEEISM_TARGET, 2)
    assert.ok(absenteeismRate(60, 3000) <= ABSENTEEISM_TARGET)
    assert.ok(absenteeismRate(90, 3000) > ABSENTEEISM_TARGET)
  })
})

describe('conciliacao SAP', () => {
  const movement = (over: Partial<SapMovement> = {}): SapMovement => ({
    id: 'm1',
    ofNumber: 'OF-88421',
    machineCode: 'P04',
    shift: '1',
    date: '2026-10-24',
    goodQty: 200,
    scrapQty: 0,
    postedBy: 'Ricardo',
    postedAt: '2026-10-24 14:00',
    ...over,
  })

  const scans = (n: number, qty = 2): LabelScan[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `s${i}`,
      entryId: 'e1',
      code: 'x',
      labelCode: `ET-${100000 + i}`,
      ofNumber: 'OF-88421',
      product: 'Caixa',
      packageQty: qty,
      machineCode: 'P04',
      shift: '1',
      operatorName: 'Carlos',
      scannedAt: '2026-10-24T06:00:00.000Z',
    }))

  it('calcula pecas pelo contador de ciclo', () => {
    assert.equal(partsFromCycles(entry({ cycleCounterEnd: 100, partsPerCycle: 2 })), 200)
  })

  it('concilia quando ciclo, etiquetas e SAP batem', () => {
    const rows = buildConciliation([entry()], scans(100), [movement()])
    assert.equal(rows[0].status, 'ok')
    assert.equal(canCloseShift(rows), true)
  })

  it('bloqueia o fechamento quando ha divergencia acima de 3%', () => {
    const rows = buildConciliation([entry()], scans(100), [movement({ goodQty: 150 })])
    assert.equal(rows[0].status, 'divergente')
    assert.equal(canCloseShift(rows), false)
  })

  it('sinaliza atencao entre 1% e 3%', () => {
    const rows = buildConciliation([entry()], scans(100), [movement({ goodQty: 195 })])
    assert.equal(rows[0].status, 'atencao')
  })

  it('marca pendente quando nao ha lancamento no SAP', () => {
    const rows = buildConciliation([entry()], scans(100), [])
    assert.equal(rows[0].status, 'pendente')
    assert.equal(canCloseShift(rows), false)
  })

  it('detecta perda de rastreabilidade entre ciclo e etiquetas', () => {
    const rows = buildConciliation([entry()], scans(50), [movement()])
    assert.equal(rows[0].internalDiffPct, -50)
    assert.equal(rows[0].status, 'divergente')
  })
})
