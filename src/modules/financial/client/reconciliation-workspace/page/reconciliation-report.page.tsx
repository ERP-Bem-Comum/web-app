/**
 * Relatório da Conciliação em PDF (#144, spec 132) — artefato de IMPRESSÃO (caminho A: `window.print()`). A
 * view é renderizada dentro de um bloco OCULTO no workspace (só visível no `@media print`); a impressão é
 * acionada pelo item PDF do menu de export (sem rota/nova aba). View BURRA (§XI): recebe o estado por props e
 * só apresenta, no modelo de extrato bancário, com os títulos de cada lote abertos sob a transação. O
 * cabeçalho usa `<div>` (não `<header>`) p/ não ser comido pelo `globalStyle('nav, header')` do print.
 */
import type { ReactNode } from 'react'

import { maskCnpj } from '#shared/document/cnpj.ts'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type {
  ReconciliationReport,
  ReportBatch,
  ReportBatchTitle,
  ReportRow,
  ReportStatusTag,
  ReportViewState,
} from '../reconciliation-report.view-model.ts'
import * as s from './reconciliation-report.css.ts'

const t = createTranslator(ptBR)
const LOGO_WIDTH = 120
const LOGO_HEIGHT = 56
const BATCH_MARK = '*'

const STATUS_TAG: Readonly<Record<ReportStatusTag, string>> = {
  reconciled: 'financial.recon.report.statusReconciled',
  pending: 'financial.recon.report.statusPending',
}

export type ReconciliationReportViewProps = Readonly<{
  state: ReportViewState
  accountLabel: string
  accountNumber: string
  accountDocument: string
  emission: Readonly<{ at: string; userName: string }>
}>

export function ReconciliationReportView({
  state,
  accountLabel,
  accountNumber,
  accountDocument,
  emission,
}: ReconciliationReportViewProps): ReactNode {
  const companyName = state.tag === 'ready' ? state.report.companyName : ''
  return (
    <div className={s.screen}>
      <div className={s.sheet}>
        <div className={s.header}>
          <div className={s.headText}>
            {companyName !== '' ? <p className={s.company}>{companyName}</p> : null}
            <h1 className={s.title}>{t('financial.recon.report.title')}</h1>
            <p className={s.account}>{accountLabel}</p>
            {accountNumber !== '' ? <p className={s.accountNumber}>{accountNumber}</p> : null}
            {accountDocument !== '' ? (
              <p className={s.accountNumber}>
                {t('financial.recon.report.cnpj')} {maskCnpj(accountDocument)}
              </p>
            ) : null}
            {state.tag === 'ready' ? <p className={s.period}>{state.report.periodLabel}</p> : null}
            <div className={s.emission}>
              <span className={s.emissionLabel}>{t('financial.recon.report.issuedAt')}</span>
              <span>{emission.at}</span>
              <span className={s.emissionLabel}>{t('financial.recon.report.issuedBy')}</span>
              <span>{emission.userName}</span>
            </div>
          </div>
          <img
            className={s.logo}
            src="/images/logo-bem-comum-email.png"
            alt="Bem Comum"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
          />
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

function Card({ labelTag, value }: Readonly<{ labelTag: string; value: string }>): ReactNode {
  return (
    <div className={s.card}>
      <span className={s.cardLabel}>{t(labelTag)}</span>
      <span className={s.cardValue}>{value}</span>
    </div>
  )
}

const titleFavored = (title: ReportBatchTitle): string =>
  title.nameTag !== null ? t(title.nameTag) : title.name

function BatchTitles({ batch, colSpan }: Readonly<{ batch: ReportBatch; colSpan: number }>): ReactNode {
  return (
    <tr className={s.batchRow}>
      <td colSpan={colSpan} className={s.batchCell}>
        <div className={s.batchBar}>
          <table className={s.batchTable}>
            <thead>
              <tr>
                <th className={s.batchThDoc}>{t('financial.recon.report.batch.colDocument')}</th>
                <th className={s.batchTh}>{t('financial.recon.report.batch.colPayee')}</th>
                <th className={s.batchThDue}>{t('financial.recon.report.batch.colDue')}</th>
                <th className={s.batchThValue}>{t('financial.recon.report.batch.colPaid')}</th>
              </tr>
            </thead>
            <tbody>
              {batch.titles.map((title) => (
                <tr key={title.id} className={s.batchTitleRow}>
                  <td className={s.batchTd}>{title.documento}</td>
                  <td className={s.batchTd}>{titleFavored(title)}</td>
                  <td className={s.batchTd}>{title.vencimento}</td>
                  <td className={s.batchTdRight}>{title.value}</td>
                </tr>
              ))}
              <tr>
                <td className={s.batchTd}>{t('financial.recon.report.batch.total')}</td>
                <td className={s.batchTd} colSpan={2}>
                  {batch.count} {t('financial.recon.report.batch.linked')}
                </td>
                <td className={s.batchTdRight}>{batch.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

function Row({ row, showIn }: Readonly<{ row: ReportRow; showIn: boolean }>): ReactNode {
  const colSpan = showIn ? 6 : 5
  return (
    <>
      <tr className={row.batch !== null ? s.rowBatch : s.row}>
        <td className={s.td}>{row.dateBR}</td>
        {/* O histórico é sempre o que veio do extrato do banco, também no lote. */}
        <td className={s.td}>{row.description}</td>
        {showIn ? <td className={s.tdRight}>{row.inValue}</td> : null}
        <td className={s.tdRight}>{row.outValue}</td>
        <td className={s.tdRight}>{row.balance}</td>
        <td className={s.td}>
          {t(STATUS_TAG[row.statusTag])}
          {row.batch !== null ? BATCH_MARK : null}
        </td>
      </tr>
      {row.batch !== null ? <BatchTitles batch={row.batch} colSpan={colSpan} /> : null}
    </>
  )
}

function ReportContent({ report }: Readonly<{ report: ReconciliationReport }>): ReactNode {
  const { totals, rows, isEmpty, showIn, hasBatch, movementCount } = report
  const colSpan = showIn ? 6 : 5
  return (
    <>
      <section className={s.totals}>
        <Card labelTag="financial.recon.report.opening" value={totals.openingBRL} />
        <Card labelTag="financial.recon.report.closing" value={totals.closingBRL} />
        <Card labelTag="financial.recon.report.totalIn" value={totals.totalInBRL} />
        <Card labelTag="financial.recon.report.totalOut" value={totals.totalOutBRL} />
      </section>

      <h2 className={s.sectionTitle}>{t('financial.recon.report.movements')}</h2>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr className={s.headRow}>
            <th className={s.thDate}>{t('financial.recon.report.colDate')}</th>
            <th className={s.th}>{t('financial.recon.report.colDescription')}</th>
            {showIn ? <th className={s.thValue}>{t('financial.recon.report.colIn')}</th> : null}
            <th className={s.thValue}>{t('financial.recon.report.colOut')}</th>
            <th className={s.thValue}>{t('financial.recon.report.colBalance')}</th>
            <th className={s.thStatus}>{t('financial.recon.report.colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td className={s.tdEmpty} colSpan={colSpan}>
                {t('financial.recon.report.emptyMovements')}
              </td>
            </tr>
          ) : (
            rows.map((row) => <Row key={row.id} row={row} showIn={showIn} />)
          )}
        </tbody>
        {isEmpty ? null : (
          <tfoot className={s.tfoot}>
            <tr className={s.footRow}>
              <td className={s.footTd} colSpan={2}>
                <span className={s.footLabel}>
                  {t(showIn ? 'financial.recon.report.totals' : 'financial.recon.report.totalOutBand')}
                </span>
                {movementCount} {t('financial.recon.report.movementsCount')}
              </td>
              {showIn ? <td className={s.footTdRight}>{totals.totalIn}</td> : null}
              <td className={s.footTdRight}>{totals.totalOut}</td>
              <td className={s.footTd} colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>
      {hasBatch ? (
        <p className={s.note}>
          {BATCH_MARK} {t('financial.recon.report.batch.note')}
        </p>
      ) : null}
    </>
  )
}
