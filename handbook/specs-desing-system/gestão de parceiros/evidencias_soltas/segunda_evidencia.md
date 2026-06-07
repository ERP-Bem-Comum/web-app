Coletei todos os artefatos necessários. Aqui está o `reconstructed-spec.md` completo para a tela **Dashboard - Resumo Mensal**:

---

```markdown
# reconstructed-spec.md — Dashboard - Resumo Mensal

> Gerado via reverse-specs a partir de screenshots e leitura de DOM (read_page).
> Data da captura: 2026-06-05 | URL: /

---

## 1. Contexto

Tela inicial do ERP Financeiro. Exibe um resumo executivo mensal com KPIs, gráfico de
visão geral orçamentária, últimos pagamentos, distribuição de gastos por centro de custo
e alertas de fornecedores sem contrato. É a landing page após login.

---

## 2. Layout Geral

### Shell da aplicação (persistente em todas as telas)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo B]                  [Olá, {Nome} - {Empresa}] [AC▾]│  ← Topbar (altura ~55px)
├──────┬───────────────────────────────────────────────────┤
│      │                                                   │
│Sidebar│            Main Content Area                     │
│(~70px│                                                   │
│collapsed│                                                │
│~235px│                                                   │
│expanded)                                                 │
└──────┴───────────────────────────────────────────────────┘
```

**Topbar:**
- Esquerda: logo da marca (ícone "B" azul escuro, fundo branco)
- Direita: saudação textual "Olá, {nome completo} - {empresa}" + avatar circular com iniciais (ex: "AC") + ícone de chevron (dropdown de conta)

**Sidebar (colapsável):**
- Fundo: azul escuro (#2E3A59 aproximado)
- Estado padrão: colapsada (só ícones, ~70px de largura)
- Estado hover/expandido: abre com labels (~235px), fundo azul mais escuro na entrada ativa
- Item ativo: destaque em azul ciano/turquesa com texto branco

**Itens de navegação (ordem):**
| Ícone | Label | Sub-itens |
|---|---|---|
| 🏠 | Dashboard | — |
| 🤝 | Gestão de Parceiros | Colaboradores, Fornecedores, Financiadores, Estados, Municípios |
| ⚙️ | Gestão de Programas | Programas |
| 📋 | Gestão de Contratos | Contratos |
| 📅 | Plano Orçamentário | Planejamento |
| 📈 | Relatórios | Análise de Pagamentos, Análise de Recebimentos, Equipe ABC, Fluxo de caixa, Fornecedores sem contrato, Posição Pagamentos |
| 📄 | Financeiro | Contas a Pagar, Contas a Receber, Contas Bancárias |
| 👥 | Gestão de Usuários | Usuários, Minha Conta |

---

## 3. Conteúdo da Tela — Dashboard - Resumo Mensal

### 3.1 Cabeçalho de página

```
Dashboard - Resumo Mensal
```
- Tipografia: heading grande, peso semibold, cor escura (~#1A1A2E)
- Sem botão de ação no cabeçalho

---

### 3.2 Faixa de KPI Cards (4 cards em linha)

Grid de 4 colunas, cards brancos com sombra suave, border-radius ~12px.

| Card | Label | Valor | Ícone | Comparativo |
|---|---|---|---|---|
| 1 | Gastos | R$ 0,00 | Círculo vermelho-coral com ícone de "mão pagando" | ↑ 0% · Último mês |
| 2 | Arrecadação | R$ 0,00 | Círculo verde/teal com ícone de cifra | ↑ 0% · Último mês |
| 3 | Top Financiador | 0% (nome do financiador) | Círculo roxo com ícone de handshake | ↑ 0% · Financiador |
| 4 | Top Centro de Custo | R$ 0,00 (nome do CC) | Círculo laranja com ícone de grupo/equipe | ↑ 0% · Centro de Custo |

**Anatomia de cada KPI Card:**
```
┌─────────────────────────────────┐
│ Label (heading sm, cinza)       │
│ Valor (heading lg, preto bold)  [Ícone circular]
│ ↑ Δ%  Período (caption, cinza)  │
└─────────────────────────────────┘
```
- O comparativo tem ícone de seta (↑ verde quando positivo / ↓ vermelho quando negativo)
- Cards 3 e 4 exibem o nome da entidade (financiador / centro de custo) no subtexto

**Estado vazio:** valor R$ 0,00 / 0%, sem nome de entidade no subtexto, variação ↑ 0%

---

### 3.3 Coluna principal (esquerda, ~60% da largura)

#### 3.3.1 Widget "Visão Geral" — Gráfico de linha Previsto vs Realizado

```
┌────────────────────────────────────────────────────────┐
│ Visão geral                           [Ver tudo]       │
│ Previsto × Realizado                                   │
│                                                        │
│  R$4 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│  R$3 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│  R$2 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│  R$1 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│  R$0 ───────────────────────────────────────────────  │
│       Jan Fev Mar Abr Mai Jun Jul Ago Set Out Nov Dez  │
└────────────────────────────────────────────────────────┘
```

- Legenda: "Previsto" (link/texto ciano) × "Realizado" (texto normal)
- Eixo Y: valores em R$ (R$0, R$1, R$2, R$3, R$4 no estado vazio — escala automática)
- Eixo X: 12 meses (Jan–Dez), todos visíveis
- Linhas pontilhadas horizontais como guias (dashed)
- Botão "Ver tudo" no canto superior direito: azul ciano (#00BCD4 aproximado), texto branco, border-radius ~8px
- Estado vazio: linha reta em R$0 (linha verde/teal)

#### 3.3.2 Widget "Últimos Pagamentos Realizados"

```
┌────────────────────────────────────────────────────────┐
│ Últimos pagamentos realizados                          │
│                                                        │
│ NOME        VENCIMENTO    CONTA         VALOR          │
│ ──────────────────────────────────────────────────     │
│ (sem dados)                                            │
└────────────────────────────────────────────────────────┘
```

- Heading "Últimos pagamentos realizados" (semibold)
- Tabela com 4 colunas: NOME, VENCIMENTO, CONTA, VALOR
- Cabeçalhos em maiúsculas, cor ciano/teal
- Estado vazio: tabela sem linhas de dados (só header)
- Estado preenchido: linhas de pagamentos ordenadas por data desc (inferido)

---

### 3.4 Coluna lateral (direita, ~40% da largura)

#### 3.4.1 Widget "Pagamentos por Centro de Custo em %"

- Heading: "Pagamentos por Centro de Custo em %"
- Tipo: provavelmente gráfico de pizza/donut (não renderizado no estado vazio observado)
- Estado vazio: texto centralizado "Sem gastos no mês anterior" (fundo branco, sem gráfico)

#### 3.4.2 Widget "Fornecedores sem Contrato"

```
┌──────────────────────────────────────────────────┐
│ Fornecedores sem Contrato                        │
│                                                  │
│ [Fornecedor dashboard]    R$ 386.333,34          │  ← linha vermelha/salmão
│                                                  │
│ [        Ver todas        ]                      │  ← botão outline
└──────────────────────────────────────────────────┘
```

- Heading: "Fornecedores sem Contrato"
- Lista de fornecedores sem contrato ativo: cada item em card/linha com fundo vermelho-salmão (#E57373 aprox), nome à esquerda e valor à direita (bold)
- Botão "Ver todas" outline (borda fina, fundo branco, texto azul) — navega para listagem de fornecedores sem contrato

---

## 4. Estados da Tela

| Estado | Descrição | Observado |
|---|---|---|
| **Loading** | Spinner circular ciano centralizado na área de conteúdo, sidebar colapsada, topbar visível, título "Dashboard - Resumo Mensal" já renderizado | ✅ Capturado |
| **Vazio (zero data)** | KPIs com R$ 0,00 / 0%, gráfico com linha reta em R$0, tabela de pagamentos sem linhas, widget de donut com fallback textual | ✅ Capturado |
| **Preenchido** | KPIs com valores reais, gráfico com curvas Previsto/Realizado, linhas na tabela, donut renderizado, lista de fornecedores sem contrato | ⚠️ Não observado (sem dados no ambiente de teste) |
| **Sidebar expandida** | Hover/click expande sidebar com labels completos e sub-menus dropdown; item ativo destacado em ciano | ✅ Capturado |

---

## 5. Modelo de Dados Implícito

Inferido a partir dos KPIs e widgets:

```typescript
// KPI Summary (retornado pela API de dashboard)
interface DashboardSummary {
  gastos: {
    valor: number;          // R$ formatado
    variacaoPercentual: number;  // vs mês anterior
  };
  arrecadacao: {
    valor: number;
    variacaoPercentual: number;
  };
  topFinanciador: {
    nome: string;
    percentual: number;     // participação em %
    variacaoPercentual: number;
  };
  topCentroDeCusto: {
    nome: string;
    valor: number;
    variacaoPercentual: number;
  };
}

// Gráfico Previsto vs Realizado (12 meses)
interface VersusData {
  mes: string;              // "Jan" | "Fev" | ... | "Dez"
  previsto: number;
  realizado: number;
}
type GraficoVisaoGeral = VersusData[];

// Últimos Pagamentos
interface Pagamento {
  nome: string;
  vencimento: string;       // ISO date → formatado DD/MM/YYYY
  conta: string;
  valor: number;            // formatado R$
}

// Pagamentos por Centro de Custo (donut)
interface CentroCustoPagamento {
  nome: string;
  percentual: number;
}

// Fornecedores sem Contrato
interface FornecedorSemContrato {
  nome: string;
  valor: number;            // valor total de pagamentos
}
```

---

## 6. Comportamentos e Interações

| Elemento | Ação | Resultado |
|---|---|---|
| Sidebar (colapsada) | Hover sobre item | Expande sidebar mostrando labels e sub-menus |
| Sidebar item com sub-menu | Click | Expande/colapsa sub-menu (accordion) |
| Sidebar item de rota | Click | Navega para a rota correspondente; item fica ativo (highlight ciano) |
| Botão "Ver tudo" (gráfico) | Click | Navega para tela de detalhes do relatório (rota inferida: /relatorios ou /visao-geral) |
| Botão "Ver todas" (fornecedores sem contrato) | Click | Navega para /relatorios/fornecedores-sem-contrato |
| Avatar "AC" no topbar | Click | Abre dropdown de conta (opções: Minha Conta, Logout — inferido) |
| KPI Cards | — | Somente leitura, sem interação (possível tooltip no hover — não confirmado) |
| Linha do fornecedor sem contrato | Click | Comportamento não observado (possível navegação para detalhe do fornecedor) |

---

## 7. Design Tokens Observados

| Token | Valor Aproximado |
|---|---|
| Cor primária (sidebar, header) | `#2E3A59` (azul marinho escuro) |
| Cor de destaque / CTA | `#00BCD4` (ciano/turquesa) |
| Cor de ícone Gastos | `#EF5350` (vermelho-coral) |
| Cor de ícone Arrecadação | `#26A69A` (verde-teal) |
| Cor de ícone Top Financiador | `#7B1FA2` (roxo) |
| Cor de ícone Top Centro de Custo | `#FF7043` (laranja) |
| Cor de alerta (fornecedor sem contrato) | `#EF9A9A` (salmão/rosa-vermelho) |
| Background principal | `#F0F2F5` (cinza claro) |
| Card background | `#FFFFFF` |
| Texto primário | `#1A1A2E` (preto quase azulado) |
| Texto secundário/caption | `#9E9E9E` (cinza médio) |
| Seta de variação positiva | `#4CAF50` (verde) |
| Border radius cards | ~12px |
| Sombra cards | `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` (estimado) |

---

## 8. Breakdown de Componentes

```
DashboardPage
├── AppShell (layout)
│   ├── Topbar
│   │   ├── Logo
│   │   └── UserMenu (avatar + dropdown)
│   └── Sidebar
│       ├── NavItem (ícone + label + indicador ativo)
│       └── NavGroup (accordion com sub-itens)
│
└── DashboardContent
    ├── PageTitle ("Dashboard - Resumo Mensal")
    ├── KPIStrip (grid 4 colunas)
    │   ├── KPICard (Gastos)
    │   ├── KPICard (Arrecadação)
    │   ├── KPICard (Top Financiador)
    │   └── KPICard (Top Centro de Custo)
    │       Props: label, valor, icone, variacaoPercentual, periodo
    │
    ├── MainRow (2 colunas: ~60/40)
    │   ├── LeftColumn
    │   │   ├── VisaoGeralChart
    │   │   │   ├── ChartHeader (título + legenda + botão "Ver tudo")
    │   │   │   └── LineChart (eixo Y: R$, eixo X: meses, 2 séries)
    │   │   └── UltimosPagamentosTable
    │   │       ├── SectionTitle
    │   │       └── DataTable (cols: NOME, VENCIMENTO, CONTA, VALOR)
    │   │           Estado vazio: sem EmptyState visual — só tabela vazia
    │   │
    │   └── RightColumn
    │       ├── PagamentosDonutChart
    │       │   ├── SectionTitle
    │       │   ├── DonutChart (ou PieChart)
    │       │   └── EmptyState ("Sem gastos no mês anterior")
    │       └── FornecedoresSemContratoWidget
    │           ├── SectionTitle
    │           ├── FornecedorItem[] (fundo salmão, nome + valor)
    │           └── Button "Ver todas" (variant: outline)
    │
    └── LoadingOverlay (spinner ciano, exibido durante fetch inicial)
```

---

## 9. Rotas e Navegação

| Item de menu | Rota observada |
|---|---|
| Dashboard | `/` |
| Financiadores | `/financiadores` |
| Contas Bancárias | `/contas-bancarias` |
| Demais rotas | Não navegadas — inferidas pelo label do menu |

---

## 10. Observações e Lacunas

- O gráfico usa uma biblioteca de charts (provavelmente Recharts ou Chart.js) — não foi possível confirmar sem DOM completo.
- O estado "preenchido" do gráfico e do donut não foi observado (ambiente sem dados reais no período).
- Não foi testado o comportamento de responsividade mobile.
- O dropdown do UserMenu (avatar AC) não foi explorado.
- A interação de click nas linhas da tabela de pagamentos não foi testada.
- O botão "Ver tudo" do gráfico e "Ver todas" dos fornecedores têm destinos de rota ainda não confirmados.
- O widget de "Fornecedor dashboard - R$ 386.333,34" parece ser dado de seed/teste, não produção.
```

---

**Resumo do que foi capturado e mapeado:**

- **2 estados** da tela: loading e vazio/zerado
- **Estrutura completa de navegação**: 8 módulos, 18 sub-rotas mapeadas
- **4 widgets** do dashboard completamente especificados
- **Modelo de dados** TypeScript inferido do que os widgets exibem
- **8 interações** documentadas
- **Design tokens** com cores, raios e sombras aproximados
- **Breakdown de componentes** pronto para implementação em React 19

Quer que eu continue navegando em outras telas (ex: Financiadores, Contas a Pagar) para gerar specs delas também? Ou prefere que eu explore algum estado específico do Dashboard (como abrir o menu do usuário ou clicar em "Ver tudo")?
