/**
 * Entidade: Etiqueta de lote/pacote escaneada na linha de producao.
 *
 * O leitor de codigo de barras (USB HID / wedge) envia o codigo como
 * keystrokes terminadas em Enter. O sistema interpreta o codigo, valida
 * contra a faixa declarada na Ficha F48 e contabiliza:
 *
 *   qtd de pecas = qtd por embalagem  x  numero de etiquetas escaneadas
 */
export type LabelScan = {
  id: string
  /** Apontamento (Ficha F48) ao qual a leitura pertence */
  entryId: string
  /** Codigo bruto lido do leitor */
  code: string
  /** Codigo normalizado da etiqueta (ex.: ET-100230) */
  labelCode: string
  /** Ordem de fabricacao impressa na etiqueta */
  ofNumber: string
  /** Descricao do produto/embalagem impressa na etiqueta */
  product: string
  /** Quantidade de pecas contidas em UMA etiqueta (packaging) */
  packageQty: number
  machineCode: string
  shift: string
  operatorName: string
  /** ISO timestamp da leitura */
  scannedAt: string
}

export type ScanWarning = 'duplicada' | 'fora_da_faixa' | 'of_divergente' | 'fora_da_turno'
