# 📄 Product Requirement Document (PRD)

## 1. Visão Geral do Produto

* **Nome do Projeto:** Sistema Gestor da Manufatura & Painel Andon (Knauf Industries)
* **Cliente / Usuário-Chave:** Amanda (Chefe de Manufatura)
* **Desenvolvedor Responsável:** Gabriel Martins
* **Objetivo:** Digitalizar e centralizar o acompanhamento da produção de 14 máquinas injetoras (atendendo 3 turnos), automatizar o cálculo de OEE/OER, gerenciar Ordens de Serviço (Manutenção Autônoma - TPM MA), monitorar absenteísmo operacional e exibir alertas em tempo real em uma TV na fábrica (Andon visual).

---

## 2. Objetivos e Metas (KPIs)

1. **Meta de OEE (Eficiência Global da Planta):** ≥ 88%
2. **Meta de Absenteísmo Operacional (nas máquinas):** ≤ 2%
3. **Andon em Tempo Real:** Sinalização visual instantânea do status das 14 injetoras (destaque em **vermelho** para máquinas em parada ou com falha).
4. **Integração com SAP:** Facilitar a digitação/apontamento no SAP a partir dos dados consolidados pelo formulário digital.

---

## 3. Perfis de Usuários (Personas & Permissões)

| Perfil | Descrição e Permissões |
| --- | --- |
| **Operador (3 Turnos)** | Lança dados diários por hora/turno (ciclo inicial/final, paradas, motivos, etiquetas, trocas). |
| **Líder / Processo** | Valida os lançamentos de produção, cadastra ordens de serviço e acompanha andamento. |
| **Manutenção** | Visualiza e atualiza chamados de manutenção, registra ações tomadas (TPM MA). |
| **Gestão / Amanda** | Acesso completo a dashboards, relatórios de absenteísmo, parametrização de metas e visualização Andon. |

---

## 4. Requisitos Funcionais

### 4.1. Módulo 1: Apontamento Digital de Produção (Substituição da Ficha F48)

* **Acompanhamento por Máquina (P01 a P16 / 14 Injetoras Ativas):**
* **Cabeçalho:** Data, Turno (1º, 2º, 3º), Máquina (ex: P04), Operador, Líder.
* **Dados do Produto/OF:** Peça/Descrição, Peças por Ciclo, Nº da Ordem de Fabricação (OF), Faixa de Etiquetas (Inicial, Final, Extraviada/Reutilizada).
* **Controle Horário de Produção:**
* Horário de início/fim e Contador de Ciclo inicial/final.
* Registro hora a hora: **Motivos de Parada**, **Tempo de Parada**, **Tempo de Ciclo (s)** e **Silo**.

* **Tabela Padronizada de Motivos de Parada:**
* *Técnicas:* Horário de pico (H), Troca de MP (C), Troca de Molde (T), Manutenção (M), Regulagem (R), Limpeza (L), Refeição (B).
* *Fora de Padrão:* Pane elétrica (E), Pane mecânica (X), Pane molde (S), Qualidade (Q), Falta de ar (I), Falta embalagem (A), Falta MP expandida (G), Falta MP silo (F), Falta vapor (V), Operador outra função (Z), Falta de Operador (W).

### 4.2. Módulo 2: Painel Andon para TV (Monitoramento de Chão de Fábrica)

* **Modo TV (Full Screen):** Exibição em grade com os cartões das 14 máquinas injetoras.
* **Indicadores Visuais de Status:**
* 🟢 **Verde (Produzindo):** Operação normal dentro do tempo de ciclo.
* 🟡 **Amarelo (Alerta/Setup):** Parada planejada (Ex: Troca de molde, refeição).
* 🔴 **Vermelho (Parada / Problema):** Máquina parada por quebra, pane ou falta de insumo. Exibe o motivo da parada e o tempo decorrido.

* **Métricas Globais do Painel:**
* OEE Atual vs. Meta (88%).
* Total de peças boas vs. refugos.

### 4.3. Módulo 3: Manutenção & TPM MA (Ordens de Serviço)

* **Abertura de Chamados (OS):** Operador ou Líder pode gerar uma OS diretamente na tela da máquina parada.
* **Acompanhamento de Ações:**
* Registro de ações corretivas e preventivas.
* Status da OS: *Aberta, Em Atendimento, Aguardando Peça, Concluída*.

* **Manutenção Autônoma (TPM MA):** Checklists diários/por turno para operadores executarem inspeção e limpeza preventiva.

### 4.4. Módulo 4: Dashboard & Relatórios Executivos

* **Visão de Desempenho (Estilo Dashboard de Referência):**
* Total de Peças Boas vs. Peças Ruins.
* Horas Produtivas vs. Horas Paradas.
* Evolução do OER/OEE Diário e Mensal (Gráfico de Linha).
* Indicador de **% Produtividade** e **% Qualidade**.
* Filtros por Operador, Máquina e Mês.

* **Módulo de Absenteísmo Operacional:**
* Medição de horas/turnos parados por **Falta de Operador (Motivo W)** ou **Operador em outra função (Motivo Z)**.
* Comparação contínua contra a meta de **2%**.

---

## 5. Requisitos Não-Funcionais & UX/UI

* **Identidade Visual:** Seguir as cores institucionais e logo da **Knauf Industries** (tons corporativos em azul/cinza com alto contraste para modo escuro no Andon).
* **Interface Responsiva:** Otimizada para digitação rápida em tablets/PCs no chão de fábrica e exibição em Smart TVs (Full HD).
* **Consistência de Dados:** Estruturação para facilitar a exportação/imputação manual ou automática no sistema **SAP**.

---

## 6. Arquitetura do Banco de Dados (Entidades Principais)

```
[Máquinas] 1 ─── N [Apontamentos_Diarios]
   │                       │
   ├── N [Ordens_Servico]  ├── N [Registros_Horarios_Paradas]
   │                       │
[Operadores] 1 ────────────┘
```

* **Tabelas Chave:** `Usuarios`, `Maquinas` (14 un), `Produtos_OF`, `Apontamentos`, `Registro_Paradas`, `Ordens_Servico_Manutencao`, `Logs_Absenteismo`.

---

## 7. Cronograma Prévia / Entregáveis

* **Fase 1 (Sábado):** Protótipo da interface (Dashboard de Produção + Tela do Andon em Vermelho/Verde para as 14 injetoras).
* **Fase 2:** Módulo de Apontamento Horário (F48) + Regras do OEE/Absenteísmo.
* **Fase 3:** Módulo de Ordens de Serviço (TPM MA) + Ajustes para integração/exportação SAP.

---

## 8. Estratégia de implementação (protótipo)

Esta entrega é um **protótipo de apresentação** com frontend React + TypeScript, arquitetura **Feature-Sliced Design (FSD)** e **dados mocados**. Não há persistência real nem backend nesta fase.

Quando o cliente validar, as camadas `shared/api` e `entities` serão conectadas à solução de backend e banco de dados **definida após validação do cliente**, substituindo os mocks sem reescrever as telas.

### 8.1 Identidade Visual (referência Knauf)

Paleta e logotipo extraídos do site oficial Knauf Brasil (`knauf.com/pt-BR`):

| Token | Hex | Uso |
| --- | --- | --- |
| Navy | `#003778` | Menu lateral, títulos, botões primários |
| Navy profundo | `#00244F` | Gradientes e painel Andon |
| Azul | `#0099DE` | Gráficos, ícones, destaques |
| Azul ciano | `#00A0E6` | Logotipo oficial |
| Laranja | `#ED8000` | Alertas, série OER |
| Verde | `#3C8A2E` | Status "produzindo" |
| Vermelho | `#D92027` | Paradas e falhas |

### 8.2 Acessos de demonstração

O login exige **matrícula** (ex.: `OP-1021`) e **senha** (1 a 6, uma senha por usuário mock). A lista de usuários aparece na própria tela de login para preenchimento rápido.

---

## 9. Arquitetura do Protótipo (FSD)

```
src/
├─ app/          # providers, router, layout, design tokens (CSS)
├─ pages/        # telas: dashboard, andon, apontamento, manutencao, absenteismo, sap
├─ widgets/      # blocos de UI reaproveitados (card Andon, header, sidebar)
├─ features/     # logica de negocio isolada por capacidade
│  ├─ barcode-scanner/      # leitor de etiquetas + regra pecas = qtd x n etiquetas
│  ├─ sap-reconciliation/   # conciliacao apontamento x SAP
│  ├─ sap-export/           # payload de exportacao
│  ├─ work-order/           # abertura de OS
│  ├─ filters/  └─ auth/
├─ entities/     # modelos de dominio (machine, production, label, sap, work-order)
└─ shared/       # api (mock), config (brand/constants), lib (oee, format), ui
```

### 9.1 Leitor de etiquetas (modulo 1)

* **Entrada:** leitor USB HID (wedge) — o codigo chega como keystrokes e e finalizado com `Enter`.
* **Formato suportado:** `KNF|OF-88421|ET-100230|CX40L|2` (completo) ou `ET-100230` (simples).
* **Regra central:** `qtd de pecas = qtd por embalagem x n de etiquetas escaneadas`.
* **Validacoes:** duplicidade na ficha, OF divergente, etiqueta fora da faixa declarada (aviso).
* **Saidas:** pecas apuradas, divergencia interna contra o contador de ciclo e base da conciliacao SAP.

### 9.2 Conciliacao com o SAP (modulo 3)

Cruzamento de tres origens por turno/maquina/OF:

| Origem | Fonte |
| --- | --- |
| Real (ciclo) | contador de ciclo da injetora x pecas por ciclo |
| Rastreavel | soma das etiquetas lidas x quantidade por embalagem |
| SAP | quantidade confirmada na ordem de fabricacao |

Tolerancias: **ate 1%** conciliado · **1–3%** atencao (justificativa) · **acima de 3%** divergente.
Turno com linha divergente ou sem lancamento no SAP **nao pode ser fechado**.

### 9.3 Motor de OEE (modulo 5)

`OEE = Disponibilidade x Performance x Qualidade`

* Paradas **planejadas** (H, C, T, M, R, L, B) sao removidas do tempo produtivo planejado e **nao** penalizam a disponibilidade.
* Paradas **nao planejadas** (E, X, S, Q, I, A, G, F, V, Z, W) penalizam integralmente.
* Meta da planta: **OEE >= 88%** · **Absenteismo <= 2%**.

### 9.4 Testes

`npm test` executa a suite do dominio (parser de etiquetas, motor de OEE, conciliacao SAP,
calculo de absenteismo) com o test runner nativo do Node sobre bundles esbuild.

