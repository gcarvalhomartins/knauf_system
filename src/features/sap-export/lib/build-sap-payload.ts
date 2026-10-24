import type { ProductionEntry } from '@entities/production/model/types'

export function buildSapPayload(entry: ProductionEntry) {
  const cycles = entry.cycleCounterEnd - entry.cycleCounterStart
  const produced = cycles * entry.partsPerCycle
  const stopMin = entry.hours.reduce((s, h) => s + h.stopMinutes, 0)
  return {
    WERKS: 'BR01',
    ARBPL: entry.machineCode,
    AUFNR: entry.ofNumber,
    SHIFT: entry.shift,
    BUDAT: entry.date.replaceAll('-', ''),
    GAMNG: produced,
    XMNGA: entry.labelsLost,
    PERNR: entry.operatorId,
    STOPS: entry.hours
      .filter((h) => h.stopCode)
      .map((h) => ({ GRUND: h.stopCode, MIN: h.stopMinutes, SLOT: h.slot })),
    STOP_MIN: stopMin,
    LABEL_FROM: entry.labelStart,
    LABEL_TO: entry.labelEnd,
  }
}

export function downloadSapFile(entry: ProductionEntry) {
  const payload = buildSapPayload(entry)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SAP_${entry.machineCode}_${entry.date}_T${entry.shift}.json`
  a.click()
  URL.revokeObjectURL(url)
}
