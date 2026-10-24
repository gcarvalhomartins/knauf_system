import { useState, type FormEvent } from 'react'
import { STOP_REASONS } from '@entities/stop-reason/model/types'
import { MACHINE_CODES } from '@shared/config/constants'
import { Button } from '@shared/ui/Button'

type Props = {
  defaultMachine?: string
  author: string
  onSubmit: (payload: {
    machineCode: string
    type: 'corretiva' | 'preventiva' | 'tpm_ma'
    description: string
    stopCode?: string
  }) => Promise<void>
}

export function OpenWorkOrderForm({ defaultMachine = 'P03', author, onSubmit }: Props) {
  const [machineCode, setMachineCode] = useState(defaultMachine)
  const [type, setType] = useState<'corretiva' | 'preventiva' | 'tpm_ma'>('corretiva')
  const [stopCode, setStopCode] = useState('X')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSubmit({ machineCode, type, description, stopCode })
    setBusy(false)
    setDescription('')
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <p className="muted">Abertura por {author}</p>
      <label>
        Máquina
        <select value={machineCode} onChange={(e) => setMachineCode(e.target.value)}>
          {MACHINE_CODES.map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
      </label>
      <label>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="corretiva">Corretiva</option>
          <option value="preventiva">Preventiva</option>
          <option value="tpm_ma">TPM MA</option>
        </select>
      </label>
      <label>
        Motivo de parada
        <select value={stopCode} onChange={(e) => setStopCode(e.target.value)}>
          {STOP_REASONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Descrição
        <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <Button disabled={busy} type="submit">
        {busy ? 'Gerando OS…' : 'Gerar ordem de serviço'}
      </Button>
    </form>
  )
}
