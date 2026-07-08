# Plan 054 — Relatório da Conciliação em PDF (#144)

Referências: ADR-0004 (split client×server), ADR-0009 (cliente agnóstico), ADR-0012 (shell root),
constituição §X/§XI; `.claude/rules/client.md`; padrão de PDF de Contratos/Relatórios (`window.print()` +
`@media print` escondendo `nav, header`).

## Abordagem

Caminho A do #144: **bloco de impressão OCULTO no workspace + `window.print()` DIRETO**, zero dependência nova.
O item PDF do menu dispara a impressão da própria tela (sem navegação). O relatório é alimentado pelo read do
período (#205) que já traz TODOS os totalizadores e os movimentos.

> **Revisão pós-UX (2 bugs da P.O.):** (1) o cabeçalho do relatório é `<div>` (não `<header>`) p/ escapar do
> `globalStyle('nav, header')` do print; (2) o PDF não navega mais — `window.print()` direto. A **rota foi
> REMOVIDA** e o container `ReconciliationReportPage` também; só `ReconciliationReportView` sobrou, renderizada
> num bloco `printOnly` no workspace. Cabeçalho ganhou a **identificação da conta com número**.

## Camadas (PURO → binding → view; sem rota)

1. **View-model PURO** `reconciliation-report.view-model.ts` (sem React/@tanstack, node:test-ável):
   - `buildReconciliationReport(period, from, to): ReconciliationReport` — deriva linhas (Data/Descrição/
     Valor/Saldo/Status) + totalizadores formatados (BRL) + rótulo do período. Datas por string fatiada.
   - `ReportViewState` (união discriminada: `no-period | loading | error | ready`).
   - `formatAccountNumber(account): string` — identificação COM NÚMERO (`banco · Ag · C/C número-dígito`);
     sem conta → `''` (a view omite a linha). PURA. _(Substituiu o `buildReportSearch`/`REPORT_ROUTE_PATH`,
     removidos com a rota.)_
   - `reportStatusTag` — tag i18n do status por linha.
2. **Binding** `reconciliation-report.binding.ts` (React/Query): `useReconciliationReport(accountId, from, to)`
   → roda `accountStatementPeriodQueryOptions` + resolve `accountLabel` (`alias`, fallback `accountId`) e
   `accountNumber` (`formatAccountNumber`); devolve `{ state, accountLabel, accountNumber }`.
3. **View burra** `page/reconciliation-report.page.tsx` + `.css.ts`:
   - `ReconciliationReportView({state, accountLabel, accountNumber})` = **burra** (cabeçalho em `<div>` com
     conta + número + período; 6 cards; tabela). SEM botão próprio (a impressão vem do menu). Estados honestos.
   - CSS: `printOnly` (`display:none`; print→`block`), `screenBody` (`display:contents`; print→`none`),
     mantém `globalStyle('nav, header')` do shell. _(Container `ReconciliationReportPage` e rota removidos.)_

## Ligação aditiva do PDF

- **Workspace binding** (`reconciliation-workspace.binding.ts`): expõe `reportPdf: { enabled, print, from, to }`
  derivado de `accountRef` + `periodRange`. `print()` = `window.print()`; `from`/`to` = período visualizado.
- **ExportMenu** (`components/export-menu.component.tsx`): prop `reportPdf` com `print` (antes `open`); o item
  PDF habilita por `reportPdf.enabled`, `onClick` fecha o menu + chama `reportPdf.print()`. OFX/CSV inalterados.
- **Page do workspace**: envolve o corpo em `screenBody`, renderiza o bloco `printOnly` com
  `<ReconciliationReportView>` alimentado por `useReconciliationReport(accountRef, reportPdf.from, reportPdf.to)`
  (mesma query #205 → cache dedup), e passa `reportPdf={vm.reportPdf}` ao `<ExportMenu/>`.

## i18n (novas chaves `financial.recon.report.*`)

Título, subtítulo, rótulos dos 6 totalizadores, cabeçalhos da tabela, status (conciliado/pendente), botão
Imprimir, "Período não informado", "Sem movimentos no período".

## Testes (espelham src em tests/)

- **node:test** `reconciliation-report-view-model.test.ts`: `buildReconciliationReport` com fixture de período
  (linhas + 6 totalizadores + status) e caso VAZIO; `formatAccountNumber` (com conta → `banco · Ag · C/C`;
  sem conta → `''`). _(Removidos os asserts de `buildReportSearch`.)_
- **vitest DOM** `reconciliation-report.page.spec.tsx`: `ReconciliationReportView` renderiza cabeçalho (conta
  - NÚMERO) + 6 totalizadores + tabela; omite a linha do número quando vazia; SEM botão Imprimir (aciona pelo
    menu); período vazio → estado honesto.
- **vitest DOM** `export-menu.spec.tsx`: item PDF HABILITA com `reportPdf.enabled` e chama `print`; OFX/CSV
  seguem chamando `exportAs`.
- **vitest DOM** `reconciliation-workspace.page.spec.tsx`: clicar PDF chama `window.print` (spy) SEM
  `window.open`; PDF habilitado com período (default last7). Sem `!` non-null; sem `x as HTMLElement` sobre
  `T|undefined`; sem `new RegExp` dinâmico.

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — TODOS verdes. Baseline lint 0/115.
Build regenera o `routeTree.gen.ts` (rota removida). NÃO commitar, NÃO rebuildar Docker.

## Riscos / mitigação

- **`routeTree.gen.ts` órfão:** ao remover a rota, o tree gerado ainda a referenciava → cascata de erros de
  typecheck. Mitigação: `pnpm build` regenera o tree antes do typecheck final.
- **Regressão de layout on-screen (`screenBody`):** usa `display: contents` (não gera caixa) → zero mudança
  visual na tela; só o `@media print` vira `none`. O bloco `printOnly` reusa a query #205 (sem rede extra).
- **Regressão na conciliação:** mudanças aditivas (nova prop/derivação + wrap); OFX/CSV e o resto do workspace
  intactos; node (1291) + dom (435) verdes antes de fechar.
