import { useEffect, useMemo, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { MachineAndonCard } from '@widgets/machine-andon-card/ui/MachineAndonCard'
import { OpenWorkOrderForm } from '@features/work-order/ui/OpenWorkOrderForm'
import { useAuth } from '@features/auth/ui/AuthContext'
import { api, type PlantSnapshot } from '@shared/api/client'
import { brand } from '@shared/config/brand'
import { formatNumber, formatPercent } from '@shared/lib/format'
import { Button } from '@shared/ui/Button'
import { Modal } from '@shared/ui/Modal'

export function AndonPage() {
  const { user } = useAuth()
  const [data, setData] = useState<PlantSnapshot | null>(null)
  const [clock, setClock] = useState(() => new Date())
  const [osMachine, setOsMachine] = useState<string | null>(null)

  useEffect(() => {
    void api.plantSnapshot().then(setData)
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Atualizacao periodica do estado da planta (simula o MES/OPC-UA na TV)
  useEffect(() => {
    const t = setInterval(() => {
      void api.plantSnapshot().then(setData)
    }, 15000)
    return () => clearInterval(t)
  }, [])

  const oeeTone = useMemo(() => {
    if (!data) return 'warn'
    return data.oee >= brand.kpis.oeeTarget ? 'ok' : 'warn'
  }, [data])

  if (!data) return <div className="page-pad">Carregando Andon…</div>

  return (
    <div className="andon-page">
      <header className="andon-bar">
        <div>
          <strong>ANDON · CHÃO DE FÁBRICA</strong>
          <span>14 injetoras ativas · P01 a P16</span>
        </div>
        <div className={`andon-oee ${oeeTone}`}>
          OEE {formatPercent(data.oee)} <small>meta {brand.kpis.oeeTarget}%</small>
        </div>
        <div className="andon-metrics">
          <span>Boas {formatNumber(data.goodParts)}</span>
          <span>Refugos {formatNumber(data.scrapParts)}</span>
          <span className="dot green">{data.running} OK</span>
          <span className="dot yellow">{data.setup} Setup</span>
          <span className="dot red">{data.down} Parada</span>
        </div>
        <time>{clock.toLocaleTimeString('pt-BR')}</time>
        <Button
          variant="ghost"
          onClick={() => {
            const params = new URLSearchParams(window.location.search)
            if (params.get('tv') === '1') {
              window.history.replaceState({}, '', '/andon')
              window.location.reload()
            } else {
              window.location.search = 'tv=1'
              void document.documentElement.requestFullscreen?.()
            }
          }}
        >
          <Maximize2 size={16} /> TV
        </Button>
      </header>
      <div className="andon-grid">
        {data.machines.map((m) => (
          <MachineAndonCard key={m.code} machine={m} onOpenOs={setOsMachine} />
        ))}
      </div>
      <Modal open={Boolean(osMachine)} title={`Abrir OS · ${osMachine ?? ''}`} onClose={() => setOsMachine(null)}>
        {osMachine && user ? (
          <OpenWorkOrderForm
            defaultMachine={osMachine}
            author={user.name}
            onSubmit={async (payload) => {
              await api.createWorkOrder({ ...payload, openedBy: user.name })
              setOsMachine(null)
              setData(await api.plantSnapshot())
            }}
          />
        ) : null}
      </Modal>
    </div>
  )
}
