import type { LabelScan, ScanWarning } from '@entities/label/model/types'

/**
 * Formatos de etiqueta aceitos pelo leitor:
 *
 *  1) "KNF|OF-88421|ET-100230|CX40L|10"
 *     Formato completo (recomendado): prefixo | OF | etiqueta | produto | qtd/embalagem
 *
 *  2) "ET-100230"  -> etiqueta simples. A OF e a qtd/embalagem sao herdadas
 *     do apontamento (Ficha F48) em aberto.
 *
 * A leitura e normalizada e validada contra a faixa declarada na ficha.
 */

export type ParsedLabel = {
  code: string
  labelCode: string
  ofNumber?: string
  product?: string
  packageQty?: number
}

export type ScanValidation = {
  ok: boolean
  reason?: string
  warnings: ScanWarning[]
}

const LABEL_RE = /^ET-(\d{4,})$/i
const OF_RE = /^OF-?(\d{4,})$/i

export function parseLabel(raw: string): ParsedLabel | null {
  const code = raw.trim()
  if (!code) return null

  const parts = code.split('|').map((p) => p.trim())

  if (parts.length >= 4) {
    const [, ofRaw, labelRaw, productRaw, qtyRaw] = parts
    const label = labelRaw.match(LABEL_RE)
    const of = ofRaw.match(OF_RE)
    const qty = Number(qtyRaw)
    if (!label) return null
    return {
      code,
      labelCode: label[0].toUpperCase(),
      ofNumber: of ? `OF-${of[1]}` : undefined,
      product: productRaw || undefined,
      packageQty: Number.isFinite(qty) && qty > 0 ? qty : undefined,
    }
  }

  const simple = code.match(LABEL_RE)
  if (simple) {
    return { code, labelCode: simple[0].toUpperCase() }
  }

  return null
}

/** Converte "ET-100230" -> 100230 (para comparacao de faixa) */
export function labelSequence(labelCode: string): number | null {
  const m = labelCode.match(/^ET-(\d+)$/i)
  if (!m) return null
  return Number(m[1])
}

export function labelRange(from: string, to: string) {
  const a = labelSequence(from)
  const b = labelSequence(to)
  if (a == null || b == null) return null
  return { from: Math.min(a, b), to: Math.max(a, b) }
}

export function validateScan(
  parsed: ParsedLabel,
  context: {
    labelStart: string
    labelEnd: string
    ofNumber: string
    alreadyScanned: string[]
    packageQty: number
  },
): ScanValidation {
  const warnings: ScanWarning[] = []

  if (context.alreadyScanned.includes(parsed.labelCode)) {
    return { ok: false, reason: `Etiqueta ${parsed.labelCode} já escaneada neste turno.`, warnings }
  }

  if (parsed.ofNumber && parsed.ofNumber !== context.ofNumber) {
    return {
      ok: false,
      reason: `Etiqueta pertence a ${parsed.ofNumber}, mas a ficha aponta ${context.ofNumber}.`,
      warnings,
    }
  }

  const range = labelRange(context.labelStart, context.labelEnd)
  const seq = labelSequence(parsed.labelCode)
  if (range && seq != null && (seq < range.from || seq > range.to)) {
    warnings.push('fora_da_faixa')
  }

  return { ok: true, warnings }
}

export function buildScan(
  parsed: ParsedLabel,
  ctx: {
    entryId: string
    machineCode: string
    shift: string
    operatorName: string
    product: string
    ofNumber: string
    packageQty: number
    at?: Date
  },
): LabelScan {
  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entryId: ctx.entryId,
    code: parsed.code,
    labelCode: parsed.labelCode,
    ofNumber: parsed.ofNumber ?? ctx.ofNumber,
    product: parsed.product ?? ctx.product,
    packageQty: parsed.packageQty ?? ctx.packageQty,
    machineCode: ctx.machineCode,
    shift: ctx.shift,
    operatorName: ctx.operatorName,
    scannedAt: (ctx.at ?? new Date()).toISOString(),
  }
}

/**
 * Regra de negocio central do modulo:
 *   qtd de pecas = qtd por embalagem x numero de etiquetas escaneadas
 */
export function partsFromScans(scans: LabelScan[]): number {
  return scans.reduce((sum, s) => sum + s.packageQty, 0)
}

/**
 * Divergencia entre o que a maquina produziu (contador de ciclo) e o que
 * foi efetivamente etiquetado (leitor). Base para o indicador de perda
 * de rastreabilidade e para a conciliacao com o SAP.
 */
export function labelReconciliation(cycleParts: number, scannedParts: number) {
  const diff = scannedParts - cycleParts
  const diffPct = cycleParts > 0 ? (diff / cycleParts) * 100 : 0
  return {
    cycleParts,
    scannedParts,
    diff,
    diffPct,
    status: Math.abs(diffPct) <= 1 ? ('ok' as const) : Math.abs(diffPct) <= 3 ? ('atencao' as const) : ('divergente' as const),
  }
}
