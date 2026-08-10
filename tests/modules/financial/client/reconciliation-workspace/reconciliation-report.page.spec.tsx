/**
 * ReconciliationReportView (Vitest/jsdom) — view BURRA do Relatório da Conciliação em PDF (#144). Renderiza
 * o cabeçalho (conta + NÚMERO + período), os 6 totalizadores e a tabela de movimentos a partir de um
 * `ReportViewState` FIXTURE (sem query/rota). A impressão é acionada pelo menu de export (não há botão na
 * view — ela vive num bloco só-print). Cobre o estado honesto "sem período" e a omissão do número quando
 * vazio. NBSP do Intl BRL nos asserts (via centsToBRL); sem `!` non-null; sem RegExp dinâmico.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { ReconciliationReportView } from '#modules/financial/client/reconciliation-workspace/page/reconciliation-report.page.tsx'
import {
  buildReconciliationReport,
  centsToBRL,
  type ReportViewState,
} from '#modules/financial/client/reconciliation-workspace/reconciliation-report.view-model.ts'
import type { AccountStatementPeriod } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k
// O Intl BRL usa NBSP (U+00A0) entre "R$" e o número; o Testing Library normaliza o texto do DOM (NBSP →
// espaço) mas NÃO o matcher — então o literal precisa vir com espaço normal p/ bater.
const brl = (cents: string): string => centsToBRL(cents).replace(/\u00A0/g, ' ')

const period: AccountStatementPeriod = {
  openingBalanceCents: '1000000',
  closingBalanceCents: '850000',
  totalInCents: '50000',
  totalOutCents: '200050',
  counters: { all: 2, in: 1, out: 1, reconciled: 1, pending: 1 },
  movements: [
    {
      id: 'a',
      fitid: 'FIT-a',
      date: '2026-05-18',
      movement: 'Credit',
      entryType: 'Other',
      payeeName: 'Recebido ACME',
      memo: '',
      valueCents: '50000',
      balanceAfterCents: '900000',
      reconciliationStatus: 'Reconciled',
    },
    {
      id: 'b',
      fitid: 'FIT-b',
      date: '2026-05-19',
      movement: 'Debit',
      entryType: 'Other',
      payeeName: 'Fornecedor XPTO',
      memo: '',
      valueCents: '150050',
      balanceAfterCents: '749950',
      reconciliationStatus: 'Pending',
    },
  ],
}

const readyState: ReportViewState = {
  tag: 'ready',
  report: buildReconciliationReport(period, '2026-05-01', '2026-05-31'),
}

afterEach(() => {
  cleanup()
})

describe('ReconciliationReportView (#144)', () => {
  it('renderiza cabeçalho (título + conta + NÚMERO + período); sem botão Imprimir (aciona pelo menu)', () => {
    render(
      <ReconciliationReportView
        state={readyState}
        accountLabel="Conta Corrente BB"
        accountNumber="Banco do Brasil · Ag. 1234 · C/C 56789-0"
      />,
    )
    expect(screen.getByText(tr('financial.recon.report.title'))).toBeTruthy()
    expect(screen.getByText('Conta Corrente BB')).toBeTruthy()
    expect(screen.getByText('Banco do Brasil · Ag. 1234 · C/C 56789-0')).toBeTruthy()
    expect(screen.getByText('01/05/2026 – 31/05/2026')).toBeTruthy()
    // A impressão migrou para o item PDF do menu de export → a view não tem mais botão próprio.
    expect(screen.queryByRole('button', { name: tr('financial.recon.report.print') })).toBeNull()
  })

  it('omite a linha do NÚMERO quando vazia (conta não resolvida — chrome honesto)', () => {
    render(<ReconciliationReportView state={readyState} accountLabel="Conta X" accountNumber="" />)
    expect(screen.getByText('Conta X')).toBeTruthy()
    expect(screen.queryByText('Banco do Brasil · Ag. 1234 · C/C 56789-0')).toBeNull()
  })

  it('renderiza os 6 totalizadores (rótulos + valores em BRL com NBSP)', () => {
    render(<ReconciliationReportView state={readyState} accountLabel="Conta X" accountNumber="" />)
    for (const key of [
      'financial.recon.report.opening',
      'financial.recon.report.closing',
      'financial.recon.report.totalIn',
      'financial.recon.report.totalOut',
      'financial.recon.report.reconciled',
      'financial.recon.report.pending',
    ]) {
      expect(screen.getByText(tr(key))).toBeTruthy()
    }
    // Valores formatados via o helper que normaliza o NBSP do Intl BRL (o DOM já vem normalizado).
    expect(screen.getByText(brl('1000000'))).toBeTruthy()
    expect(screen.getByText(brl('850000'))).toBeTruthy()
  })

  it('renderiza a tabela de movimentos (cabeçalhos + linhas + status)', () => {
    render(<ReconciliationReportView state={readyState} accountLabel="Conta X" accountNumber="" />)
    expect(screen.getByText(tr('financial.recon.report.colDate'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.colDescription'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.colValue'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.colBalance'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.colStatus'))).toBeTruthy()
    expect(screen.getByText('Recebido ACME')).toBeTruthy()
    expect(screen.getByText('Fornecedor XPTO')).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.statusReconciled'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.report.statusPending'))).toBeTruthy()
  })

  it('estado honesto: sem período → "Período não informado" (sem totalizadores)', () => {
    render(<ReconciliationReportView state={{ tag: 'no-period' }} accountLabel="Conta X" accountNumber="" />)
    expect(screen.getByText(tr('financial.recon.report.noPeriod'))).toBeTruthy()
    expect(screen.queryByText(tr('financial.recon.report.opening'))).toBeNull()
  })

  it('estado honesto: período resolvido sem movimentos → "Sem movimentos no período" (com totalizadores)', () => {
    const emptyState: ReportViewState = {
      tag: 'ready',
      report: buildReconciliationReport({ ...period, movements: [] }, '2026-05-01', '2026-05-31'),
    }
    render(<ReconciliationReportView state={emptyState} accountLabel="Conta X" accountNumber="" />)
    expect(screen.getByText(tr('financial.recon.report.emptyMovements'))).toBeTruthy()
    // Totalizadores continuam presentes (cabeçalho + números reais do período).
    expect(screen.getByText(tr('financial.recon.report.opening'))).toBeTruthy()
  })
})
