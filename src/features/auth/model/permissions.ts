import type { UserRole } from '@entities/user/model/types'

export type AppModule =
  | 'dashboard'
  | 'andon'
  | 'apontamento'
  | 'os'
  | 'tpm'
  | 'absenteismo'
  | 'sap'

const ALL: AppModule[] = ['dashboard', 'andon', 'apontamento', 'os', 'tpm', 'absenteismo', 'sap']

const MAP: Record<UserRole, AppModule[]> = {
  operador: ['andon', 'apontamento', 'os', 'tpm'],
  lider: ['dashboard', 'andon', 'apontamento', 'os', 'tpm', 'sap'],
  manutencao: ['andon', 'os', 'tpm'],
  gestao: ALL,
}

export function canAccess(role: UserRole, module: AppModule) {
  return MAP[role].includes(module)
}

export function modulesFor(role: UserRole) {
  return MAP[role]
}
