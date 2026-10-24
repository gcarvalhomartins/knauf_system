import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildScan,
  labelRange,
  labelReconciliation,
  parseLabel,
  partsFromScans,
  validateScan,
} from '../src/features/barcode-scanner/lib/label-parser.ts'

describe('parseLabel', () => {
  it('interpreta o formato completo com OF, produto e quantidade', () => {
    const parsed = parseLabel('KNF|OF-88421|ET-100230|CX40L|2')
    assert.ok(parsed)
    assert.equal(parsed.labelCode, 'ET-100230')
    assert.equal(parsed.ofNumber, 'OF-88421')
    assert.equal(parsed.product, 'CX40L')
    assert.equal(parsed.packageQty, 2)
  })

  it('interpreta a etiqueta simples', () => {
    const parsed = parseLabel('ET-100231')
    assert.ok(parsed)
    assert.equal(parsed.labelCode, 'ET-100231')
    assert.equal(parsed.packageQty, undefined)
  })

  it('rejeita codigo invalido', () => {
    assert.equal(parseLabel('lixo'), null)
    assert.equal(parseLabel(''), null)
  })
})

describe('labelRange', () => {
  it('ordena a faixa', () => {
    assert.deepEqual(labelRange('ET-100418', 'ET-100230'), { from: 100230, to: 100418 })
  })

  it('retorna null para faixa invalida', () => {
    assert.equal(labelRange('XX-1', 'ET-2'), null)
  })
})

describe('validateScan', () => {
  const ctx = {
    labelStart: 'ET-100230',
    labelEnd: 'ET-100418',
    ofNumber: 'OF-88421',
    alreadyScanned: [] as string[],
    packageQty: 2,
  }

  it('aceita etiqueta dentro da faixa', () => {
    const parsed = parseLabel('KNF|OF-88421|ET-100300|CX40L|2')!
    const res = validateScan(parsed, ctx)
    assert.equal(res.ok, true)
    assert.deepEqual(res.warnings, [])
  })

  it('bloqueia etiqueta duplicada', () => {
    const parsed = parseLabel('KNF|OF-88421|ET-100300|CX40L|2')!
    const res = validateScan(parsed, { ...ctx, alreadyScanned: ['ET-100300'] })
    assert.equal(res.ok, false)
    assert.match(res.reason ?? '', /já escaneada/)
  })

  it('bloqueia etiqueta de outra OF', () => {
    const parsed = parseLabel('KNF|OF-99999|ET-100300|CX40L|2')!
    const res = validateScan(parsed, ctx)
    assert.equal(res.ok, false)
    assert.match(res.reason ?? '', /OF-99999/)
  })

  it('aceita mas sinaliza etiqueta fora da faixa', () => {
    const parsed = parseLabel('KNF|OF-88421|ET-100900|CX40L|2')!
    const res = validateScan(parsed, ctx)
    assert.equal(res.ok, true)
    assert.deepEqual(res.warnings, ['fora_da_faixa'])
  })
})

describe('regra central: pecas = qtd por embalagem x nº de etiquetas', () => {
  it('multiplica corretamente', () => {
    const parsed = parseLabel('KNF|OF-88421|ET-100230|CX40L|4')!
    const scan = buildScan(parsed, {
      entryId: 'e1',
      machineCode: 'P04',
      shift: '1',
      operatorName: 'Carlos',
      product: 'Caixa EPS 40L',
      ofNumber: 'OF-88421',
      packageQty: 4,
    })
    assert.equal(partsFromScans([scan]), 4)

    const many = Array.from({ length: 10 }, () => scan)
    assert.equal(partsFromScans(many), 40)
  })

  it('usa a quantidade do codigo quando informada, senao a da ficha', () => {
    const withQty = buildScan(parseLabel('KNF|OF-88421|ET-100230|CX40L|10')!, {
      entryId: 'e1',
      machineCode: 'P04',
      shift: '1',
      operatorName: 'Carlos',
      product: 'Caixa',
      ofNumber: 'OF-88421',
      packageQty: 2,
    })
    assert.equal(withQty.packageQty, 10)

    const fallback = buildScan(parseLabel('ET-100231')!, {
      entryId: 'e1',
      machineCode: 'P04',
      shift: '1',
      operatorName: 'Carlos',
      product: 'Caixa',
      ofNumber: 'OF-88421',
      packageQty: 2,
    })
    assert.equal(fallback.packageQty, 2)
  })
})

describe('labelReconciliation', () => {
  it('classifica divergencia dentro de 1% como ok', () => {
    const r = labelReconciliation(1000, 995)
    assert.equal(r.status, 'ok')
  })

  it('classifica divergencia entre 1% e 3% como atencao', () => {
    const r = labelReconciliation(1000, 980)
    assert.equal(r.status, 'atencao')
  })

  it('classifica divergencia acima de 3% como divergente', () => {
    const r = labelReconciliation(1000, 950)
    assert.equal(r.status, 'divergente')
  })
})
