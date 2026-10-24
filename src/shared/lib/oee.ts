import { STOP_REASONS } from '@entities/stop-reason/model/types'
import type { HourlyRecord } from '@entities/production/model/types'

/**
 * Motor de calculo do OEE da planta.
 *
 * Disponibilidade = tempo produtivo / tempo produtivo planejado
 * Performance     = (pecas boas / pecas teóricas no tempo produtivo) x 100
 * Qualidade       = pecas boas / (pecas boas + refugos) x 100
 * OEE             = Disponibilidade x Performance x Qualidade
 *
 * Regra Knauf: paradas PLANEJADAS (refeicao, troca de molde, limpeza, etc.)
 * nao penalizam a disponibilidade — sao removidas do tempo produtivo
 * planejado. Apenas paradas nao planejadas (W, Z, panes) penalizam.
 */

export type OeeBreakdown = {
  availability: number
  performance: number
  quality: number
  oee: number
  plannedMinutes: number
  downtimeMinutes: number
  unplannedMinutes: number
  goodParts: number
  scrapParts: number
  idealCycleS: number
}

export function isPlannedStop(code?: string) {
  if (!code) return false
  return STOP_REASONS.find((r) => r.code === code)?.planned ?? false
}

export function splitStopMinutes(hours: HourlyRecord[]) {
  let unplanned = 0
  let planned = 0
  for (const h of hours) {
    const min = Number(h.stopMinutes || 0)
    if (isPlannedStop(h.stopCode)) planned += min
    else unplanned += min
  }
  return { planned, unplanned }
}

export function computeOee(params: {
  /** Minutos de producao planejada do turno (ex.: 480 = 8h) */
  plannedMinutes: number
  hours: HourlyRecord[]
  /** Pecas boas do turno */
  goodParts: number
  /** Refugos do turno */
  scrapParts: number
  /** Ciclo ideal (s) da referencia */
  idealCycleS: number
}): OeeBreakdown {
  const { plannedMinutes, hours, goodParts, scrapParts, idealCycleS } = params
  const { planned, unplanned } = splitStopMinutes(hours)

  // Paradas planejadas sao descontadas do tempo produtivo planejado.
  const productivePlanned = Math.max(plannedMinutes - planned, 1)
  const runMinutes = Math.max(productivePlanned - unplanned, 0)

  const availability = (runMinutes / productivePlanned) * 100

  const theoreticalParts = (runMinutes * 60) / (idealCycleS > 0 ? idealCycleS : 1)
  const performance = theoreticalParts > 0 ? Math.min((goodParts / theoreticalParts) * 100, 100) : 0

  const totalParts = goodParts + scrapParts
  const quality = totalParts > 0 ? (goodParts / totalParts) * 100 : 0

  const oee = (availability * performance * quality) / 10_000

  return {
    availability,
    performance,
    quality,
    oee,
    plannedMinutes: productivePlanned,
    downtimeMinutes: planned + unplanned,
    unplannedMinutes: unplanned,
    goodParts,
    scrapParts,
    idealCycleS,
  }
}

/** Meta da planta (PRD): OEE >= 88% */
export const OEE_TARGET = 88

export function oeeTone(oee: number) {
  if (oee >= OEE_TARGET) return 'ok' as const
  if (oee >= OEE_TARGET - 5) return 'warn' as const
  return 'bad' as const
}

/**
 * Absenteismo operacional (motivos W e Z) medido sobre as horas
 * produtivas planejadas das maquinas. Meta: <= 2%.
 */
export function absenteeismRate(absenteeMinutes: number, productivePlannedMinutes: number) {
  if (productivePlannedMinutes <= 0) return 0
  return (absenteeMinutes / productivePlannedMinutes) * 100
}

export const ABSENTEEISM_TARGET = 2
