# knauf_system

**Knauf Industries — Gestor da Manufatura & Painel Andon**

Protótipo de apresentação (frontend only) do sistema descrito em [`docs/PRD.md`](docs/PRD.md).

- React 19 + TypeScript + Vite
- Arquitetura **Feature-Sliced Design (FSD)**
- Dados **mocados** em `src/shared/api`
- Backend e banco entram **após a validação do cliente** — a camada `api` já está isolada para receber HTTP

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm test         # suíte do domínio (node:test + esbuild)
```

Faça login com **matrícula + senha** (senhas de demonstração: `1` a `6`, uma por usuário).

## Módulos

| Rota | Conteúdo |
| --- | --- |
| `/dashboard` | KPIs, OEE/OER, peças boas/ruins, filtros, quebra do OEE em disponibilidade × performance × qualidade |
| `/andon` | Painel TV das 14 injetoras (verde / amarelo / vermelho) com tempo de parada ao vivo |
| `/apontamento` | Ficha F48 digital, **leitor de etiquetas**, controle horário, exportação SAP |
| `/conciliacao-sap` | Cruzamento apontamento × etiquetas × SAP e fechamento de turno |
| `/manutencao` | OS (TPM MA) + checklist autônomo com progresso |
| `/absenteismo` | Motivos W e Z vs. meta 2%, horas perdidas por máquina |

## Regras de domínio implementadas

- **Leitor de etiquetas:** `qtd de peças = qtd por embalagem × nº de etiquetas escaneadas`.
  Formato `KNF|OF-88421|ET-100230|CX40L|2` ou `ET-100230`. Valida duplicidade, OF divergente e faixa declarada.
- **OEE:** `disponibilidade × performance × qualidade`. Paradas planejadas (H, C, T, M, R, L, B) não penalizam a disponibilidade; fora de padrão (E, X, S, Q, I, A, G, F, V, Z, W) penalizam. Meta ≥ 88%.
- **Conciliação SAP:** ≤ 1% conciliado · 1–3% atenção · > 3% divergente bloqueia o fechamento do turno.
- **Absenteísmo:** medido sobre as horas produtivas das 14 máquinas × 3 turnos. Meta ≤ 2%.

## Depois da validação

Substituir `src/shared/api/client.ts` pela solução de backend aprovada pelo cliente, persistindo as entidades do PRD (`Usuarios`, `Maquinas`, `Apontamentos`, `Registro_Paradas`, `Ordens_Servico_Manutencao`, `Logs_Absenteismo`, `Etiquetas`, `Movimentos_SAP`).
