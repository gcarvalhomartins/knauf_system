import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@app/App'
import '@app/styles/index.css'

/**
 * GitHub Pages não possui fallback de SPA. O 404.html guarda a rota original
 * em sessionStorage e volta pra raiz; aqui restauramos a URL antes de montar
 * o React Router para que a rota correta seja carregada.
 */
function restoreRedirect() {
  try {
    const key = 'knauf.redirect'
    const saved = sessionStorage.getItem(key)
    if (!saved) return
    sessionStorage.removeItem(key)
    const target = new URL(saved, window.location.origin)
    const base = import.meta.env.BASE_URL
    if (!target.pathname.startsWith(base)) return
    window.history.replaceState({}, '', target.pathname + target.search + target.hash)
  } catch {
    /* ignora */
  }
}

restoreRedirect()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
