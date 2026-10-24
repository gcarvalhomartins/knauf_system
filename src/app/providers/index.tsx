import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@features/auth/ui/AuthContext'

/** No GitHub Pages o app vive em /<repo>/ — o basename precisa acompanhar o base do Vite. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter basename={basename || undefined}>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}
