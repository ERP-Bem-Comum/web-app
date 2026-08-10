/**
 * Relatório da Conciliação em PDF (#144) — artefato de IMPRESSÃO (caminho A: `window.print()`). A view é
 * renderizada dentro de um bloco OCULTO no workspace (só visível no `@media print`); a impressão é acionada
 * pelo item PDF do menu de export (sem rota/nova aba). `ReconciliationReportView` é a **view burra** (§XI):
 * recebe o estado por props e só apresenta (cabeçalho com conta + NÚMERO + período + 6 totalizadores + tabela).
 * O cabeçalho usa `<div>` (não `<header>`) p/ não ser comido pelo `globalStyle('nav, header')` do print. Sem
 * data-hooks aqui. Datas/valores já vêm formatados da view-model PURA. i18n (PT).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type {
  ReconciliationReport,
  ReportStatusTag,
  ReportViewState,
} from '../reconciliation-report.view-model.ts'
import * as s from './reconciliation-report.css.ts'

const t = createTranslator(ptBR)

const STATUS_TAG: Readonly<Record<ReportStatusTag, string>> = {
  reconciled: 'financial.recon.report.statusReconciled',
  pending: 'financial.recon.report.statusPending',
}

export type ReconciliationReportViewProps = Readonly<{
  state: ReportViewState
  accountLabel: string
  accountNumber: string
}>

export function ReconciliationReportView({
  state,
  accountLabel,
  accountNumber,
}: ReconciliationReportViewProps): ReactNode {
  return (
    <div className={s.screen}>
      <div className={s.sheet}>
        <div className={s.header}>
          <div className={s.headText}>
            <h1 className={s.title}>{t('financial.recon.report.title')}</h1>
            <p className={s.account}>{accountLabel}</p>
            {accountNumber !== '' ? <p className={s.accountNumber}>{accountNumber}</p> : null}
            {state.tag === 'ready' ? <p className={s.period}>{state.report.periodLabel}</p> : null}
          </div>
        </div>

        <ReportBody state={state} />
      </div>
    </div>
  )
}

function ReportBody({ state }: Readonly<{ state: ReportViewState }>): ReactNode {
  switch (state.tag) {
    case 'no-period':
      return <p className={s.empty}>{t('financial.recon.report.noPeriod')}</p>
    case 'loading':
      return <p className={s.empty}>{t('financial.recon.report.loading')}</p>
    case 'error':
      return <p className={s.empty}>{t(state.errorTag)}</p>
    case 'ready':
      return <ReportContent report={state.report} />
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

function ReportContent({ report }: Readonly<{ report: ReconciliationReport }>): ReactNode {
  const { totals, rows, isEmpty } = report
  return (
    <>
      <section className={s.totals}>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.opening')}</span>
          <span className={s.cardValue}>{totals.openingBRL}</span>
        </div>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.closing')}</span>
          <span className={s.cardValue}>{totals.closingBRL}</span>
        </div>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.totalIn')}</span>
          <span className={s.cardValue}>{totals.totalInBRL}</span>
        </div>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.totalOut')}</span>
          <span className={s.cardValue}>{totals.totalOutBRL}</span>
        </div>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.reconciled')}</span>
          <span className={s.cardValue}>{String(totals.reconciledCount)}</span>
        </div>
        <div className={s.card}>
          <span className={s.cardLabel}>{t('financial.recon.report.pending')}</span>
          <span className={s.cardValue}>{String(totals.pendingCount)}</span>
        </div>
      </section>

      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>{t('financial.recon.report.colDate')}</th>
            <th className={s.th}>{t('financial.recon.report.colDescription')}</th>
            <th className={s.thRight}>{t('financial.recon.report.colValue')}</th>
            <th className={s.thRight}>{t('financial.recon.report.colBalance')}</th>
            <th className={s.th}>{t('financial.recon.report.colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td className={s.tdEmpty} colSpan={5}>
                {t('financial.recon.report.emptyMovements')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className={s.td}>{row.dateBR}</td>
                <td className={s.td}>{row.description}</td>
                <td className={s.value[row.movement]}>{row.valueBRL}</td>
                <td className={s.tdRight}>{row.balanceBRL}</td>
                <td className={s.td}>
                  <span className={s.badge[row.statusTag]}>{t(STATUS_TAG[row.statusTag])}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}
