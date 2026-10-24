import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@entities/user/model/types'
import { clearSession, loadSession, saveSession } from '../model/session'

type AuthCtx = {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession())

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      login: (next) => {
        saveSession(next)
        setUser(next)
      },
      logout: () => {
        clearSession()
        setUser(null)
      },
    }),
    [user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
