# Spec 051 — Relatório "Análise de Pagamentos" (Relatórios)

- **Tamanho:** M/L (feature de tela + engine reutilizável, front-first, sem server function nova).
- **Módulo:** `src/modules/reports/client/` (mesmo módulo dos relatórios existentes).
- **Rota:** `/relatorios/analise-pagamentos` → `src/routes/_authenticated/relatorios/analise-pagamentos.tsx`.
- **Estado:** front-first — dados PLACEHOLDER sintéticos; endpoint core-api (#114/consolidated) ainda não existe.

## Objetivo

Entregar o relatório **Análise de Pagamentos** — uma **matriz TEMPO-orçamentária**: o cruzamento **Plano
Orçamentário → Centro de Custo** com uma **série MENSAL de valores** (agregado por mês de vencimento). Cada
célula é um **VALOR por mês** — NÃO é um snapshot de status (isso é a "Posição"). Na PELE visual do relatório
**Realizado × Planejado** (RxP): matriz árvore × meses com 1ª coluna sticky, passador de meses, 2 gráficos,
filtros recolhíveis e export PDF+CSV, identidade "brand", full-bleed. **RBAC não gateia** (modelado pós-entrega).

Fiel ao legado NestJS (relatório "Análise de Pagamentos"), com **uma correção deliberada**: o gráfico
"Distribuição Mensal" do legado exibia **"Invalid Date"** num rótulo de mês — aqui a série mensal é derivada de
um intervalo bem-formado e os rótulos saem **por índice de mês** (Jan..Dez), garantindo **zero "Invalid Date"**.

O núcleo é **plugável**: quando o core-api (#114/consolidated) subir, `loadAnalise('p'|'r')` troca a fonte; a
**Análise de Recebimentos** será o ESPELHO (mesmo engine/tela; placeholder vazio → empty state), como fizemos
na "Posição de Recebimentos".

## Escopo funcional (layout, de cima p/ baixo — molde Realizado × Planejado)

1. **Cabeçalho** full-bleed: botão voltar + título "Análise de Pagamentos" + **Filtros** + **Exportar**.
2. **Filtros recolhíveis**: Programa, Plano Orçamentário, Período, Conta bancária, Status, Centro de custo,
   Categoria, Subcategoria + **Filtrar** + **Exportar** (dropdown PDF+CSV, `report-export-dropdown`).
   Placeholders honestos (forma/estilo brand); não filtram o placeholder ainda (front-first).
3. **2 gráficos** (SVG + `realizado-charts-mount` p/ animação):
   - **"Distribuição por Centro de Custo"** — barras horizontais (`realizado-cost-center-bars`) com o total por
     centro de custo (ordenado desc), hover com valor + %.
   - **"Distribuição Mensal"** — barras VERTICAIS de valor (novo `analise-monthly-bars`, reusa a pele das
     barras verticais da "Equipe ABC"): o total por mês da série (ordem ASC), hover com valor + %.
4. **Tabela-matriz** (pele do `realizado-table` — tree com childBg por nível, nó-folha, 1ª coluna STICKY,
   passador de meses WIN=3): árvore **Plano Orçamentário (nível 0) → Centro de Custo (nível 1)**; colunas =
   **VALOR TOTAL** + uma coluna por **mês** (MM/AA) do período (ASC Jan→). Subtotal por Plano; rodapé
   **VALOR TOTAL DO PERÍODO** (soma geral). Expand/collapse por nó. Valores em tinta **NEUTRA** (não colore por
   célula — lição da Posição).

### Export

**Dropdown "Exportar" com PDF + CSV** (`report-export-dropdown`, mesmo do RxP). CSV header pt-BR:
`Plano Orçamentário;Centro de custo;Total` + uma coluna por mês (`Jan/26;Fev/26;…`), valores BRL. Uma linha por
folha (Centro de Custo). PDF via `window.print`.

## Bug do legado a NÃO reproduzir

O legado mostrava **"Invalid Date"** num rótulo de mês do gráfico "Distribuição Mensal". Garantia aqui: a série
mensal é gerada por `monthsInRange({start,end})` iterando ano/mês INTEIROS sobre chaves `YYYY-MM` (nunca
`new Date(stringInvalida)`); os rótulos saem de `formatMonthLabel` (abreviação por ÍNDICE de mês + sufixo de
ano), com fallback honesto (devolve a própria chave) — jamais "Invalid Date". Coberto por teste dedicado.

## Não-objetivos

- Server function / integração real com o core-api (só quando #114/consolidated existir).
- Filtro funcional dos campos (placeholders visuais front-first).
- RBAC (modelado pós-entrega).
- Análise de RECEBIMENTOS (o engine já suporta `'r'`, mas só Pagamentos é ligado agora).

## Critérios de aceite

- Matriz Plano → Centro de Custo × meses com Total por linha, subtotal por Plano e Total do Período corretos.
- Passador de meses (WIN=3) navega a janela; meses em ordem ASC; 1ª coluna sticky.
- 2 gráficos (por Centro de Custo desc; por mês) coerentes com a matriz; **zero "Invalid Date"**.
- Filtros recolhíveis abrem/fecham; Exportar CSV baixa arquivo; PDF via print.
- Rota + subitem de menu + PAGE_TITLE + i18n `reports.analise.*` + public-api.
- Gates verdes: `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` (lint 0 erros/115 warnings).
