import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanLine, Trash2, AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react'
import type { LabelScan } from '@entities/label/model/types'
import type { ProductionEntry } from '@entities/production/model/types'
import { api } from '@shared/api/client'
import { formatNumber } from '@shared/lib/format'
import {
  buildScan,
  labelRange,
  labelReconciliation,
  parseLabel,
  partsFromScans,
  validateScan,
} from '../lib/label-parser'

type Props = {
  entry: ProductionEntry
  scans: LabelScan[]
  onScansChange: (scans: LabelScan[]) => void
}

type Feedback = { type: 'ok' | 'error' | 'warn'; text: string }

/**
 * Painel do leitor de codigo de barras.
 *
 * O leitor fisico (USB HID) digita o codigo e envia <Enter>. O componente
 * escuta o teclado globalmente e, ao detectar Enter com buffer preenchido,
 * interpreta a etiqueta. Tambem aceita digitacao manual para operacao
 * em tablet (quando o leitor nao esta disponivel).
 */
export function BarcodeScannerPanel({ entry, scans, onScansChange }: Props) {
  const [manual, setManual] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const bufferRef = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)

  const packageQty = entry.packageQty ?? entry.partsPerCycle
  const alreadyScanned = scans.map((s) => s.labelCode)

  const processCode = useCallback(
    async (raw: string) => {
      const parsed = parseLabel(raw)
      if (!parsed) {
        setFeedback({ type: 'error', text: 'Codigo de etiqueta nao reconhecido.' })
        return
      }

      const validation = validateScan(parsed, {
        labelStart: entry.labelStart,
        labelEnd: entry.labelEnd,
        ofNumber: entry.ofNumber,
        alreadyScanned,
        packageQty,
      })

      if (!validation.ok) {
        setFeedback({ type: 'error', text: validation.reason ?? 'Leitura invalida.' })
        return
      }

      const scan = buildScan(parsed, {
        entryId: entry.id,
        machineCode: entry.machineCode,
        shift: entry.shift,
        operatorName: entry.operatorName,
        product: entry.product,
        ofNumber: entry.ofNumber,
        packageQty,
      })

      await api.addLabelScan(scan)
      onScansChange([...scans, scan])

      if (validation.warnings.includes('fora_da_faixa')) {
        setFeedback({
          type: 'warn',
          text: `Etiqueta ${scan.labelCode} lida fora da faixa ${entry.labelStart}–${entry.labelEnd}.`,
        })
      } else {
        setFeedback({
          type: 'ok',
          text: `Etiqueta ${scan.labelCode} registrada (${scan.packageQty} pcas).`,
        })
      }
    },
    [alreadyScanned, entry, onScansChange, packageQty, scans],
  )

  // Leitor HID: buffer de teclas + Enter = leitura
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typingInField = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (typingInField) return
      if (e.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          e.preventDefault()
          const code = bufferRef.current
          bufferRef.current = ''
          void processCode(code)
        }
        return
      }
      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [processCode])

  const range = labelRange(entry.labelStart, entry.labelEnd)
  const expectedLabels = range ? range.to - range.from + 1 : 0
  const scannedParts = partsFromScans(scans)
  const cycleParts = Math.max(entry.cycleCounterEnd - entry.cycleCounterStart, 0) * entry.partsPerCycle
  const recon = labelReconciliation(cycleParts, scannedParts)

  async function removeScan(id: string) {
    await api.removeLabelScan(id)
    onScansChange(scans.filter((s) => s.id !== id))
  }

  return (
    <section className="panel scanner-panel">
      <div className="row-between">
        <h2>
          <ScanLine size={18} /> Leitor de etiquetas
        </h2>
        <span className="muted">
          Faixa {entry.labelStart} → {entry.labelEnd} · {expectedLabels} etiquetas
        </span>
      </div>

      <form
        className="scanner-input"
        onSubmit={(e) => {
          e.preventDefault()
          if (!manual.trim()) return
          void processCode(manual)
          setManual('')
        }}
      >
        <ScanLine size={20} />
        <input
          ref={inputRef}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Escaneie a etiqueta ou digite o codigo (ex.: KNF|OF-88421|ET-100230|CX40L|2)"
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Registrar
        </button>
      </form>
      <p className="scanner-hint">
        O leitor USB HID envia <kbd>Enter</kbd> ao termino da leitura. O campo acima mantem o foco para
        digitacao manual em tablet.
      </p>

      {feedback ? (
        <div className={`scanner-feedback ${feedback.type}`}>
          {feedback.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {feedback.text}
        </div>
      ) : null}

      <div className="scanner-summary">
        <div>
          <span>Etiquetas lidas</span>
          <strong>
            {scans.length}
            {expectedLabels ? ` / ${expectedLabels}` : ''}
          </strong>
        </div>
        <div>
          <span>Pecas por embalagem</span>
          <strong>{packageQty}</strong>
        </div>
        <div>
          <span>Pecas apuradas (leitor)</span>
          <strong>{formatNumber(scannedParts)}</strong>
        </div>
        <div>
          <span>Pecas pelo contador de ciclo</span>
          <strong>{formatNumber(cycleParts)}</strong>
        </div>
        <div className={recon.status}>
          <span>Divergencia interna</span>
          <strong>{recon.diffPct.toFixed(2)}%</strong>
        </div>
      </div>

      <div className="table-wrap scroller">
        <table>
          <thead>
            <tr>
              <th>Etiqueta</th>
              <th>OF</th>
              <th>Produto</th>
              <th>Pecas/etiq.</th>
              <th>Leitura</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {scans.slice(-50).reverse().map((s) => (
              <tr key={s.id}>
                <td>
                  <PackageCheck size={14} /> {s.labelCode}
                </td>
                <td>{s.ofNumber}</td>
                <td>{s.product}</td>
                <td>{s.packageQty}</td>
                <td>{new Date(s.scannedAt).toLocaleTimeString('pt-BR')}</td>
                <td>
                  <button className="icon-btn" onClick={() => void removeScan(s.id)} title="Remover">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 ? (
          <p className="muted" style={{ padding: 14 }}>
            Nenhuma etiqueta lida neste turno.
          </p>
        ) : null}
      </div>
    </section>
  )
}
