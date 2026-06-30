/**
 * PeriodBalanceBand — faixa de SALDO DO PERÍODO no topo da aba Extrato (#205). View burra: recebe o saldo
 * do período (abertura acumulada até `from` → fechamento) + entradas/saídas e o rótulo do período. Distinta
 * do saldo CORRENTE da conta (header) e dos totais do extrato importado (grid). Sem data-hooks.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { centsToBRL, type Conferencia } from '../reconciliation-workspace.view-model.ts'
import * as s from '../page/reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)

export type PeriodBalanceData = Readonly<{
  openingBalanceCents: string
  closingBalanceCents: string
  totalInCents: string
  totalOutCents: string
}>

export type PeriodBalanceBandProps = Readonly<{
  loading: boolean
  data: PeriodBalanceData | null
  rangeLabel: string
  // #205: apoio discreto p/ fechar o período (conciliado × diferença). Menos evidência que o saldo acima.
  conferencia: Conferencia | null
}>

export function PeriodBalanceBand({
  loading,
  data,
  rangeLabel,
  conferencia,
}: PeriodBalanceBandProps): ReactNode {
  return (
    <div className={s.periodBand}>
      <div className={s.periodBandHead}>
        <span className={s.periodBandTitle}>{t('financial.recon.period.balance.title')}</span>
        <span className={s.periodBandRange}>{rangeLabel}</span>
      </div>
      {data === null ? (
        <span className={s.periodBandMuted}>
          {loading
            ? t('financial.recon.period.balance.loading')
            : t('financial.recon.period.balance.pickRange')}
        </span>
      ) : (
        <>
          <div className={s.periodFig}>
            <span className={s.periodFigLbl}>{t('financial.recon.period.balance.opening')}</span>
            <span className={s.periodFigVal}>{centsToBRL(data.openingBalanceCents)}</span>
          </div>
          <div className={s.periodFig}>
            <span className={s.periodFigLbl}>{t('financial.recon.period.balance.in')}</span>
            <span
              className={`${s.periodFigVal} ${s.periodFigIn}`}
            >{`+ ${centsToBRL(data.totalInCents)}`}</span>
          </div>
          <div className={s.periodFig}>
            <span className={s.periodFigLbl}>{t('financial.recon.period.balance.out')}</span>
            <span
              className={`${s.periodFigVal} ${s.periodFigOut}`}
            >{`− ${centsToBRL(data.totalOutCents)}`}</span>
          </div>
          <div className={s.periodFig}>
            <span className={s.periodFigLbl}>{t('financial.recon.period.balance.closing')}</span>
            <span className={s.periodFigVal}>{centsToBRL(data.closingBalanceCents)}</span>
          </div>
          {/* Conferência junto da banda do Saldo, à DIREITA (saldo à esquerda) — apoio compacto p/ fechar
              o período: "confere" quando bate, ou quanto falta conciliar (diferença) quando não. */}
          {conferencia !== null ? (
            <div className={s.periodConferencia}>
              <span>{t('financial.recon.period.conf.label')}</span>
              {conferencia.pendingCount === 0 ? (
                <span className={s.periodConfOk}>{t('financial.recon.period.conf.done')}</span>
              ) : (
                <span>
                  {t('financial.recon.period.conf.pending')}{' '}
                  <span className={s.periodConfWarn}>
                    {centsToBRL(String(Math.abs(conferencia.diferencaCents)))}
                  </span>
                </span>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
