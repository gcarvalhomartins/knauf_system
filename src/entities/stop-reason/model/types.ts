export type StopCategory = 'tecnica' | 'fora_padrao'

export type StopReason = {
  code: string
  label: string
  category: StopCategory
  planned: boolean
}

export const STOP_REASONS: StopReason[] = [
  { code: 'H', label: 'Horário de pico', category: 'tecnica', planned: true },
  { code: 'C', label: 'Troca de MP', category: 'tecnica', planned: true },
  { code: 'T', label: 'Troca de Molde', category: 'tecnica', planned: true },
  { code: 'M', label: 'Manutenção', category: 'tecnica', planned: true },
  { code: 'R', label: 'Regulagem', category: 'tecnica', planned: true },
  { code: 'L', label: 'Limpeza', category: 'tecnica', planned: true },
  { code: 'B', label: 'Refeição', category: 'tecnica', planned: true },
  { code: 'E', label: 'Pane elétrica', category: 'fora_padrao', planned: false },
  { code: 'X', label: 'Pane mecânica', category: 'fora_padrao', planned: false },
  { code: 'S', label: 'Pane molde', category: 'fora_padrao', planned: false },
  { code: 'Q', label: 'Qualidade', category: 'fora_padrao', planned: false },
  { code: 'I', label: 'Falta de ar', category: 'fora_padrao', planned: false },
  { code: 'A', label: 'Falta embalagem', category: 'fora_padrao', planned: false },
  { code: 'G', label: 'Falta MP expandida', category: 'fora_padrao', planned: false },
  { code: 'F', label: 'Falta MP silo', category: 'fora_padrao', planned: false },
  { code: 'V', label: 'Falta vapor', category: 'fora_padrao', planned: false },
  { code: 'Z', label: 'Operador outra função', category: 'fora_padrao', planned: false },
  { code: 'W', label: 'Falta de Operador', category: 'fora_padrao', planned: false },
]
