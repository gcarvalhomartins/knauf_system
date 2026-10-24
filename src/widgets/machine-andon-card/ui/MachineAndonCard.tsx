import { useEffect, useState } from 'react'
import type { Machine } from '@entities/machine/model/types'
import { STATUS_LABEL } from '@entities/machine/model/types'
import { formatDuration, formatPercent } from '@shared/lib/format'

type Props = {
  machine: Machine
  onOpenOs?: (code: string) => void
}

/**
 * Card da maquina no painel Andon.
 *
 * O tempo de parada e calculado a partir de `stopSince` (timestamp real),
 * de modo que o contador cresce continuamente no modo TV.
 */
export function MachineAndonCard({ machine, onOpenOs }: Props) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (machine.status === 'running') return
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [machine.status])

  const stopMinutes = machine.stopSince
    ? Math.max(0, Math.round((Date.now() - new Date(machine.stopSince).getTime()) / 60000))
    : machine.stopMinutes

  return (
    <article className={`andon-card status-${machine.status}`}>
      <header>
        <strong>{machine.code}</strong>
        <span>{STATUS_LABEL[machine.status]}</span>
      </header>
      <p className="andon-product">{machine.product}</p>
      <dl>
        <div>
          <dt>OEE</dt>
          <dd>{formatPercent(machine.oee)}</dd>
        </div>
        <div>
          <dt>Ciclo</dt>
          <dd>{machine.currentCycleS}s</dd>
        </div>
        <div>
          <dt>OF</dt>
          <dd>{machine.ofNumber}</dd>
        </div>
        <div>
          <dt>Operador</dt>
          <dd>{machine.operatorName.split(' ')[0]}</dd>
        </div>
      </dl>
      {machine.status !== 'running' ? (
        <div className="andon-alert">
          <b>
            {machine.stopReasonCode} · {machine.stopReasonLabel}
          </b>
          <span>Parada há {formatDuration(stopMinutes)}</span>
          {onOpenOs ? (
            <button type="button" onClick={() => onOpenOs(machine.code)}>
              Abrir OS
            </button>
          ) : null}
        </div>
      ) : (
        <div className="andon-ok">Produção dentro do ciclo</div>
      )}
    </article>
  )
}
