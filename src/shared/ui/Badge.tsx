import type { CSSProperties, ReactNode } from 'react'

const tones: Record<string, CSSProperties> = {
  green: { background: 'var(--k-green-soft)', color: '#2c6b21', borderColor: '#b9dfae' },
  yellow: { background: 'var(--k-orange-soft)', color: '#b06000', borderColor: '#f5d19a' },
  red: { background: 'var(--k-red-soft)', color: '#a8161c', borderColor: '#f4bcbc' },
  blue: { background: 'var(--k-cyan-soft)', color: 'var(--k-navy)', borderColor: '#bfe6f8' },
  gray: { background: 'var(--k-gray-soft)', color: 'var(--k-text-soft)', borderColor: 'var(--k-line-strong)' },
}

type Props = {
  tone?: keyof typeof tones
  children: ReactNode
}

export function Badge({ tone = 'blue', children }: Props) {
  return (
    <span className="badge" style={tones[tone]}>
      {children}
    </span>
  )
}
