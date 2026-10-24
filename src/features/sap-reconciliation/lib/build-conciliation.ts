import type { ProductionEntry } from '@entities/production/model/types'
import type { LabelScan } from '@entities/label/model/types'
import type { SapMovement } from '@entities/sap/model/types'
import { partsFromScans } from '@features/barcode-scanner/lib/label-parser'
import { splitStopMinutes } from '@shared/lib/oee'

export type ConciliationStatus = 'ok' | 'atencao' | 'divergente' | 'pendente'

export type ConciliationRow = {
  id: string
  machineCode: string
  shift: string
  date: string
  ofNumber: string
  operatorName: string
  /** Pecas calculadas pelo contador de ciclo da maquina */
  cycleParts: number
  /** Pecas apuradas pelo leitor de etiquetas */
  scannedParts: number
  /** Pecas confirmadas no SAP */
  sapParts: number
  /** Divergencia SAP x apontamento real, em % */
  sapDiffPct: number
  /** Divergencia interna: ciclo x etiquetas, em % */
  internalDiffPct: number
  status: ConciliationStatus
  notes: string[]
}

/**
 * Conciliacao SAP: cruzamento entre o apontamento real (contadores de
 * ciclo + etiquetas escaneadas) e o realizado no SAP.
 *
 * Tolerancias (PRD / gestao):
 *  - |divergencia| <= 1%  -> ok
 *  - |divergencia| <= 3%  -> atencao (liberado com justificativa)
 *  - acima de 3%         -> divergente (bloqueia fechamento de turno)
 */
export const TOLERANCE_OK = 1
export const TOLERANCE_ATTENTION = 3

export function partsFromCycles(entry: ProductionEntry) {
  const cycles = Math.max(entry.cycleCounterEnd - entry.cycleCounterStart, 0)
  return cycles * entry.partsPerCycle
}

export function buildConciliation(
  entries: ProductionEntry[],
  scans: LabelScan[],
  movements: SapMovement[],
): ConciliationRow[] {
  return entries.map((entry) => {
    const notes: string[] = []
    const cycleParts = partsFromCycles(entry)
    const entryScans = scans.filter((s) => s.entryId === entry.id)
    const scannedParts = partsFromScans(entryScans)

    const movement = movements.find(
      (m) =>
        m.ofNumber === entry.ofNumber &&
        m.machineCode === entry.machineCode &&
        m.shift === entry.shift &&
        m.date === entry.date,
    )

    const sapParts = movement?.goodQty ?? 0

    const internalDiffPct = cycleParts > 0 ? ((scannedParts - cycleParts) / cycleParts) * 100 : 0
    const sapDiffPct = sapParts > 0 ? ((cycleParts - sapParts) / sapParts) * 100 : 0

    let status: ConciliationStatus
    if (!movement) {
      status = 'pendente'
      notes.push('Sem lancamento correspondente no SAP.')
    } else if (Math.abs(sapDiffPct) > TOLERANCE_ATTENTION || Math.abs(internalDiffPct) > TOLERANCE_ATTENTION) {
      status = 'divergente'
      notes.push('Divergencia acima de 3% — fechamento de turno bloqueado.')
    } else if (Math.abs(sapDiffPct) > TOLERANCE_OK || Math.abs(internalDiffPct) > TOLERANCE_OK) {
      status = 'atencao'
      notes.push('Divergencia entre 1% e 3% — liberada com justificativa.')
    } else {
      status = 'ok'
    }

    if (entryScans.length === 0) {
      status = status === 'ok' ? 'atencao' : status
      notes.push('Nenhuma etiqueta escaneada no turno.')
    }

    return {
      id: entry.id,
      machineCode: entry.machineCode,
      shift: entry.shift,
      date: entry.date,
      ofNumber: entry.ofNumber,
      operatorName: entry.operatorName,
      cycleParts,
      scannedParts,
      sapParts,
      sapDiffPct,
      internalDiffPct,
      status,
      notes,
    }
  })
}

export function canCloseShift(rows: ConciliationRow[]) {
  return rows.length > 0 && rows.every((r) => r.status !== 'divergente' && r.status !== 'pendente')
}

export function sumStopMinutes(entry: ProductionEntry) {
  return splitStopMinutes(entry.hours)
}
