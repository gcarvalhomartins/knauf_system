import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Gauge, Lock, MonitorPlay, UserRound } from 'lucide-react'
import { ROLE_LABEL, type User } from '@entities/user/model/types'
import { useAuth } from '@features/auth/ui/AuthContext'
import { api } from '@shared/api/client'
import { brand } from '@shared/config/brand'
import { BrandLogo } from '@shared/ui/BrandLogo'
import { Button } from '@shared/ui/Button'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login: signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    void api.listUsers().then(setUsers)
  }, [])

  function homeFor(role: User['role']) {
    if (role === 'manutencao') return '/manutencao'
    if (role === 'operador') return '/apontamento'
    return '/dashboard'
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await api.authenticate(login, password)
    setBusy(false)
    if (!res.ok) {
      setError(res.reason)
      return
    }
    signIn(res.user)
    navigate(homeFor(res.user.role))
  }

  function quickFill(u: User) {
    setLogin(u.badge)
    setPassword(u.password ?? '')
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-head">
          <BrandLogo tone="brand" height={34} />
        </div>

        <h2>
          {brand.company}
          <br />
          {brand.product}
        </h2>
        <p>
          Acompanhamento em tempo real das 14 injetoras, apontamento digital F48, manutencao TPM MA e
          indicadores de OEE e absenteismo operacional para a fabrica.
        </p>

        <div className="login-highlights">
          <div className="login-highlight">
            <MonitorPlay size={20} />
            <div>
              <strong>Painel Andon para TV</strong>
              <span>Status das maquinas em vermelho, amarelo e verde, com tempo de parada.</span>
            </div>
          </div>
          <div className="login-highlight">
            <Gauge size={20} />
            <div>
              <strong>OEE e absenteismo em tempo real</strong>
              <span>Metas de 88% de OEE e 2% de absenteismo acompanhadas por turno.</span>
            </div>
          </div>
          <div className="login-highlight">
            <Lock size={20} />
            <div>
              <strong>Permissoes por perfil</strong>
              <span>Operador, lider, manutencao e gestao com acessos distintos.</span>
            </div>
          </div>
        </div>

        <p className="login-foot">
          {brand.company} · Uso interno da fabrica · Prototipo com dados de demonstracao
        </p>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <h1>Acessar o sistema</h1>
            <p className="lead">Informe sua matricula e a senha para entrar no Gestor da Manufatura.</p>
          </div>

          {error ? (
            <div className="login-error">
              <AlertCircle size={17} />
              {error}
            </div>
          ) : null}

          <label className="field">
            <span>Usuario / matricula</span>
            <div className="input-wrap">
              <UserRound size={17} />
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="OP-1021 ou nome"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="input-wrap">
              <Lock size={17} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label="Mostrar senha">
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <Button type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className="demo-box">
            <header>
              <strong>Acessos de demonstracao</strong>
              <span>Clique para preencher</span>
            </header>
            <div className="demo-list">
              {users.map((u) => (
                <button key={u.id} type="button" className="demo-user" onClick={() => quickFill(u)}>
                  <span className="demo-avatar">{initials(u.name)}</span>
                  <span>
                    <strong>{u.name}</strong>
                    <small>
                      {ROLE_LABEL[u.role]}
                      {u.shift ? ` · ${u.shift}º turno` : ''} · {u.badge}
                    </small>
                  </span>
                  <span className="demo-pwd">{u.password}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}
