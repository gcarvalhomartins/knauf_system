export type UserRole = 'operador' | 'lider' | 'manutencao' | 'gestao'

export type User = {
  id: string
  name: string
  role: UserRole
  shift?: '1' | '2' | '3'
  badge: string
  /** credencial de demonstracao (mock) - removida quando houver backend */
  password?: string
}

export const ROLE_LABEL: Record<UserRole, string> = {
  operador: 'Operador',
  lider: 'Líder / Processo',
  manutencao: 'Manutenção',
  gestao: 'Gestão',
}
