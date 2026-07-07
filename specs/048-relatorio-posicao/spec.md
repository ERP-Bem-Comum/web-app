# Spec 048 — Relatório "Posição de Pagamentos" (Relatórios)

- **Tamanho:** M/L (feature de tela + engine reutilizável, front-first, sem server function nova).
- **Módulo:** `src/modules/reports/client/` (mesmo módulo dos relatórios existentes).
- **Rota:** `/relatorios/posicao-pagamentos` → `src/routes/_authenticated/relatorios/posicao-pagamentos.tsx`.
- **Estado:** front-first — dados PLACEHOLDER sintéticos; endpoint core-api (#114) ainda não existe.

## Objetivo

Entregar o relatório **Posição de Pagamentos** — um SNAPSHOT da posição das obrigações a pagar em ÁRVORE
de 3 níveis (**Fornecedor → Centro de Custo → Categoria**), com **3 medidas DERIVADAS** (**Em atraso · Pago ·
A pagar**) somadas por nó, subtotais por Fornecedor e por Centro de Custo, e **Total Geral** — na PELE visual
do relatório **Realizado × Planejado** (filtros recolhíveis → 4 cards de valores → 2 gráficos → tabela
hierárquica → export PDF+CSV), identidade "brand", full-bleed. **RBAC não gateia** (modelado pós-entrega).

Esta é a **implementação de REFERÊNCIA de uma "engine de Posição"** que, quando o Contas a Receber subir,
renderizará também "Posição de Recebíveis" via um parâmetro `type: 'p' | 'r'` — por isso o núcleo é
estruturado para ser reutilizável, mas **só Pagamentos é ligado agora**.

## Contrato de derivação das 3 medidas (ratificado pela P.O. — 2026-07-07)

As medidas NÃO são status crus, e sim 3 buckets DERIVADOS do estado real de cada obrigação a pagar (máquina
title-centric: Rascunho → Aberto → Aprovado → Transmitido → Pago → Conciliado):

| Bucket        | Critério                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Pago**      | status **Pago** OU **Conciliado** (Conciliado conta como pago — já liquidado, só amarrado ao extrato). |
| **Em atraso** | **não pago** (Aberto/Aprovado/Transmitido) **E** vencido (`dueDate < hoje`).                           |
| **A pagar**   | **não pago** (Aberto/Aprovado/Transmitido) **E** a vencer (`dueDate ≥ hoje`).                          |
| **Total**     | soma das 3 (derivado).                                                                                 |

**Sutileza:** "Em atraso" e "A pagar" são o MESMO conjunto (não pagos), separado pela **DATA** — não pelo
status; o mesmo título Aberto/Aprovado cai em um ou no outro conforme já venceu. **EXCLUÍDOS de todos os
buckets e do Total:** **Rascunho** (não é obrigação firme) e **Recusado** (não pagável).

Quando o **core-api#114** subir, o backend/BFF deriva esses 3 buckets por esta regra e entrega o snapshot
pronto; hoje é **PLACEHOLDER sintético** (front-first) — o front só EXIBE, não deriva.

## Escopo funcional (layout, de cima p/ baixo — molde Realizado × Planejado)

1. **Cabeçalho** full-bleed: botão voltar + título "Posição de Pagamentos".
2. **Filtros recolhíveis** (`report-filters`): Plano Orçamentário, Período, Conta bancária, Status, Centro de
   custo, Categoria, Subcategoria, Fornecedor + **Filtrar** + **Exportar** (dropdown PDF+CSV, `report-export-dropdown`).
   Placeholders honestos (forma/estilo brand); não filtram o placeholder ainda (front-first).
3. **4 cards de valores (KPIs)** (`posicao-kpis`, pele dos KPIs do RxP — barra de acento colorida): **Atrasado**
   (vermelho) · **Pago** (verde) · **A pagar** (âmbar) · **Total** (azul), com o total formatado em BRL.
4. **2 gráficos** (SVG do RxP + `realizado-charts-mount` p/ animação):
   - **"Resumo total"** — donut (`realizado-donut`) com 3 fatias A pagar / Pago / Em atraso; centro = Total; hover valor/%.
   - **"Distribuição por Fornecedor"** — barras horizontais (`realizado-cost-center-bars`) com o total por
     fornecedor (ordenado desc), hover com valor.
5. **Tabela hierárquica** (pele do `realizado-table` — tree RxP com childBg por nível, nó-folha, 1ª coluna
   STICKY): Fornecedor → Centro de Custo → Categoria. A linha do fornecedor mostra **nome + total** (subtítulo)
   e as colunas **Em atraso · Pago · A pagar**. Expand/collapse por nó. Rodapé **Total Geral**.

### Export

**Dropdown "Exportar" com PDF + CSV** (`report-export-dropdown`, mesmo do RxP). CSV header pt-BR:
`Fornecedor;Centro de custo;Categoria;Em atraso;Pago;A pagar`, valores BRL. Uma linha por folha (Categoria).
PDF via `window.print`.

## Dados placeholder (SINTÉTICOS, fiéis ao legado)

~4-6 fornecedores, cada um com 1-3 centros de custo, cada CC com 2-4 categorias-folha. Valores em CENTAVOS
inteiros plausíveis, distribuídos nos 3 buckets (a maior parte em **Em atraso**, algum **A pagar**, **Pago**
baixo/0 — espelhando o print do legado). Nomes pt-BR realistas. SEM PII. NÃO é mock de teste (ADR-0011): são
constantes de domínio que a tela consome até #114 nascer.

## ViewModel PURO (forma REAL — plugável sem refactor)

```ts
type PosicaoLevel = 'supplier' | 'costCenter' | 'category'
type PosicaoMeasures = Readonly<{ emAtrasoCents: number; pagoCents: number; aPagarCents: number }>
type PosicaoNode = {
  id: string
  name: string
  level: PosicaoLevel
  measures: PosicaoMeasures
  children: readonly PosicaoNode[]
}
type PosicaoReport = { totals: PosicaoMeasures; suppliers: readonly PosicaoNode[] }
type SupplierTotal = { id: string; name: string; valueCents: number } // gráfico de barras
```

Agregações PURAS: somar folhas (Categoria) → Centro de Custo → Fornecedor → Total Geral (3 medidas).
`measureTotal(m)` = soma das 3. `supplierTotals(report)` = total por fornecedor em ordem decrescente (barras).
CSV builder (header acima, valores BRL). ZERO React/TanStack. Comentário/contrato de derivação no topo do
arquivo. Quando o #114 + Contas a Receber subirem, `loadPosicao('r')` mapeia os 3 buckets dos RECEBÍVEIS neste
MESMO shape neutro (Fornecedor↔Financiador) — agregações e View não mudam.

## Reutilização futura (`type: 'p' | 'r'`)

- `PosicaoNode`/`PosicaoReport` são NEUTROS (`level` é enum, `name` é string). A mesma árvore serve Pag e Rec.
- `loadPosicao(type = 'p')` é o único ponto que escolhe a FONTE. Hoje só `'p'` tem placeholder.
- Os rótulos de nível (Fornecedor vs Financiador) vêm por i18n/props — a View é a mesma.

## Fora de escopo

- Recebíveis (`type: 'r'`) — só a assinatura fica pronta; sem placeholder/rota agora.
- Filtragem real sobre o placeholder (front-first; a forma dos filtros basta).
- Server function / endpoint real (#114 não existe).

## Critérios de aceite

- Rota `/relatorios/posicao-pagamentos` renderiza a tela brand full-bleed.
- Filtros recolhíveis presentes (toggle abre/fecha) + Exportar (PDF+CSV).
- 4 cards (Atrasado/Pago/A pagar/Total) + 2 gráficos (Resumo total donut; Distribuição por Fornecedor barras).
- Tabela árvore de 3 níveis + Total Geral (colunas Em atraso/Pago/A pagar); expand/collapse; pele RxP.
- As 3 medidas seguem o **contrato de derivação** acima (Conciliado conta como Pago; Rascunho/Recusado fora).
- Export CSV dispara (Blob) com header pt-BR correto (3 medidas).
- ViewModel PURO (sem imports react/@tanstack); agregações + `supplierTotals` corretas.
- Menu, PAGE_TITLES, i18n, public-api atualizados.
- Gates verdes; lint sem regressão (0 erros / 115 warnings baseline).
