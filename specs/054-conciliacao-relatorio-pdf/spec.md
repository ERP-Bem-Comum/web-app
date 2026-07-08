# Spec 054 — Relatório da Conciliação em PDF (#144)

- **Tamanho:** M (bloco de relatório print-friendly embutido no workspace + ligação do item PDF do menu de export).
- **Módulo:** `src/modules/financial/client/reconciliation-workspace/` (mesmo módulo da Conciliação).
- **Rota:** nenhuma nova — a impressão acontece **na própria tela** (sem navegação/nova aba). _(Revisão pós-UX
  da P.O.: a rota `/financeiro/conciliacao/relatorio` foi REMOVIDA; o relatório virou um bloco só-print no
  workspace.)_
- **Estado:** front-first, **ZERO dependência nova**. Caminho A do #144: bloco de impressão OCULTO +
  `window.print()` DIRETO. O PDF impresso é só o relatório (o corpo do workspace some no `@media print`).
- **⚠️ Conciliação é código do TECH LEAD** — mudanças **ADITIVAS**, sem regressão. OFX/CSV intactos.

## Objetivo

Ligar o item **PDF** do menu "Exportar conciliação" para disparar `window.print()` **DIRETO** na própria tela
(sem navegação/nova aba). O artefato impresso é um relatório print-friendly do **período atualmente
selecionado** (conta + intervalo), com o cabeçalho (conta **com número**), os 6 totalizadores e a tabela de
movimentos. O relatório vive num bloco OCULTO no workspace (`printOnly`, só visível no `@media print`); o
corpo do workspace é envolto em `screenBody` e some no print. O chrome do shell (`nav, header`) segue oculto —
o PDF contém só o relatório.

> **Correção de 2 bugs de UX (validados em tela pela P.O.):**
>
> 1. O PDF impresso perdia o cabeçalho porque o `globalStyle('nav, header')` do print escondia o `<header>` do
>    próprio relatório → o cabeçalho agora é um `<div>` (não é mais comido pelo global).
> 2. Clicar PDF abria uma **nova aba** (rota do relatório) → agora dispara `window.print()` direto, sem navegar.
>    Adicionalmente, o cabeçalho passou a mostrar a conta **com número** (banco · Ag · C/C número-dígito).

## Fonte dos dados (reuso, sem endpoint novo)

Tudo vem do read do período (#205): `accountStatementPeriodQueryOptions(accountId, {from,to})` →
`AccountStatementPeriod`:

- `openingBalanceCents`, `closingBalanceCents`, `totalInCents`, `totalOutCents`
- `counters { reconciled, pending, all, in, out }`
- `movements: StatementTransaction[]` = `{ id, date, movement, payeeName, memo, valueCents,
balanceAfterCents, reconciliationStatus }`

## Escopo funcional (de cima p/ baixo)

1. **Cabeçalho:** conta-cedente (`alias`) + **identificação COM NÚMERO** (`{bankName} · Ag. {branch} · C/C
{accountNumber}-{accountDv}` via `formatAccountNumber`; enquanto core-api#168 não expõe o cadastro, a linha
   fica vazia e é omitida — chrome honesto) + **período** (`from – to` em DD/MM/AAAA).
2. **Totalizações (6):** saldo de abertura · saldo de fechamento · total de entradas · total de saídas ·
   **conciliadas** (`counters.reconciled`) · **pendentes** (`counters.pending`).
3. **Tabela de movimentos:** Data (DD/MM/AAAA) · Descrição (payeeName / memo) · Valor (BRL) · Saldo corrente
   (`balanceAfterCents`) · Status (Conciliado/Pendente por `reconciliationStatus`).
4. **Impressão:** acionada pelo item PDF do menu de export → `window.print()`. O cabeçalho do relatório é
   `<div>` (não `<header>`) p/ não ser ocultado pelo `globalStyle('nav, header')`. Sem botão próprio na view.
5. **Estados honestos:** sem `from`/`to` → "Período não informado"; período resolvido mas sem movimentos →
   "Sem movimentos no período" (cabeçalho + totalizadores ainda aparecem).

## Ligação do item PDF (aditiva)

- O PDF é um **caminho separado** do `exportAs` de texto (OFX/CSV) — não baixa Blob e **não navega**: dispara
  `window.print()` DIRETO. O relatório do período ATUALMENTE selecionado (`accountRef` + `periodRange` do
  workspace) já está montado num bloco OCULTO (`printOnly`), alimentado pela MESMA query #205 (cache dedup).
- **Habilita** quando há conta + período resolvido; senão fica desabilitado com o motivo honesto (`noPeriod`).
- OFX/CSV permanecem **intactos** (mesmo binding, mesmo comportamento).

## Fora de escopo

- Endpoint de PDF server-side (não é o caminho A) · filtros novos no relatório · escolha de colunas ·
  qualquer mudança no comportamento de import/export OFX/CSV.

## Arquitetura (invariantes)

- **§XI MVVM:** derivação PURA no `reconciliation-report.view-model.ts` (node:test-ável, sem React/@tanstack);
  a page é **burra** (recebe o estado por props/binding); o acoplamento React/Query vive no `*.binding.ts`.
- **ADR-0009:** núcleo agnóstico de framework. **ADR-0012/0004:** rota = composition root; boundaries do client.
- **§X só-tokens:** `*.css.ts` com `vars.*`; sem hex/px cru. **i18n (PT)** para todo texto ao humano.
- **Datas por string PRONTA** (`YYYY-MM-DD` fatiada) — NUNCA `new Date(string)` (evita "Invalid Date"/fuso).

## Critérios de aceite

- CA-1: item PDF do menu HABILITA com conta + período e dispara `window.print()` DIRETO (sem nova aba/
  navegação); OFX/CSV intactos.
- CA-2: o artefato impresso mostra cabeçalho (conta + **número** + período), os **6 totalizadores** e a
  **tabela de movimentos**; o cabeçalho NÃO some no print (é `<div>`, não `<header>`).
- CA-3: no `@media print` o corpo do workspace some (`screenBody`) e só o relatório (`printOnly`) aparece;
  nav/header do shell ocultos.
- CA-4: sem período → "Período não informado"; período vazio → "Sem movimentos no período".
- CA-5: `pnpm verify` verde; baseline lint 0 erros / 115 warnings; sem regressão na conciliação.
