import type { User } from '@entities/user/model/types'

const KEY = 'knauf.session'

export function saveSession(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function loadSession(): User | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
