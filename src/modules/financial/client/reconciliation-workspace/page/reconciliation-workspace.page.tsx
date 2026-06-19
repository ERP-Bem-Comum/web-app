/**
 * Workspace de Conciliação — PAGE (view burra §XI). Estrutura fiel ao mock `conciliacao_bancaria`:
 * acc-header (identidade + saldo + Período + Importar) · tabs (Extrato | Conciliação) com progresso e
 * toggle "Exibir palpites" · corpo · bottombar (Exportar + Fechar período). Consome só o binding; sem
 * data-hooks aqui. Identidade/saldo da conta = chrome honesto até #168; Importar (US2), Exportar (#173) e
 * Fechar período (US7) entram nas próximas fatias (desabilitados/anunciados por ora).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
} from '#shared/ui/icons/index.ts'

import { useReconciliationWorkspace } from '../reconciliation-workspace.binding.ts'
import { centsToBRL, isPending, type AssocTab } from '../reconciliation-workspace.view-model.ts'
import { ImportMenu } from '../components/import-menu.component.tsx'
import { ImportsList } from '../components/imports-list.component.tsx'
import { SuggestionPane } from '../components/suggestion-pane.component.tsx'
import { SearchCreatePane } from '../components/search-create-pane.component.tsx'
import { NewTransactionPane } from '../components/new-transaction-pane.component.tsx'
import { ReconciledBanner } from '../components/reconciled-banner.component.tsx'
import { StatementGrid } from '../components/statement-grid.component.tsx'
import * as s from './reconciliation-workspace.css.ts'

const ASSOC_TABS: readonly { id: AssocTab; tag: string }[] = [
  { id: 'sugestao', tag: 'financial.recon.assoc.sugestao' },
  { id: 'nova', tag: 'financial.recon.assoc.nova' },
  { id: 'multi', tag: 'financial.recon.assoc.multi' },
]

const t = createTranslator(ptBR)
const DASH = '—'
const DOT = '·'

export type ReconciliationWorkspacePageProps = Readonly<{ accountRef: string }>

export function ReconciliationWorkspacePage({ accountRef }: ReconciliationWorkspacePageProps) {
  const vm = useReconciliationWorkspace(accountRef)
  const { ui, progress, account } = vm
  const balanceParts = account !== null ? centsToBRL(account.currentBalanceCents).split(',') : null
  const bankInitials = account !== null ? account.bankName.slice(0, 2).toUpperCase() : DASH

  return (
    <div className={s.screen}>
      {/* acc-header (hero) */}
      <header className={s.accHeader}>
        <div className={s.accId}>
          <span className={s.bankMark} aria-hidden="true">
            {bankInitials}
          </span>
          <div className={s.accInfo}>
            <span className={s.overline}>{t('financial.recon.account.overline')}</span>
            <span className={s.accName}>{account?.alias ?? t('financial.recon.account.unavailable')}</span>
            <span className={s.accMeta}>
              {account !== null ? (
                <>
                  <span>{`${account.bankCode} ${account.bankName}`}</span>
                  <span className={s.accMetaDot}>{DOT}</span>
                  <span>{`Ag ${account.branch}`}</span>
                  <span className={s.accMetaDot}>{DOT}</span>
                  <span>{`CC ${account.accountNumber}-${account.accountDv}`}</span>
                </>
              ) : (
                <span>{t('financial.recon.account.metaPlaceholder')}</span>
              )}
              <button type="button" className={s.changeAcc}>
                {t('financial.recon.account.changeAcc')}
              </button>
            </span>
          </div>
        </div>

        <div className={s.balanceBlock}>
          <span className={s.balanceLbl}>{t('financial.recon.account.balanceLbl')}</span>
          {balanceParts !== null ? (
            <span className={s.balanceVal}>
              {balanceParts[0]}
              {balanceParts[1] !== undefined ? (
                <span className={s.balanceCents}>{`,${balanceParts[1]}`}</span>
              ) : null}
            </span>
          ) : (
            <span className={s.balanceVal}>{DASH}</span>
          )}
          {account !== null ? (
            <span className={s.balanceUpd}>
              <span className={s.pulseDot} aria-hidden="true" />
              {`${t('financial.recon.account.updated')} ${DOT} ${account.lastUpdatedAt}`}
            </span>
          ) : (
            <span className={s.balanceUpd}>{t('financial.recon.account.balanceUnavailable')}</span>
          )}
        </div>

        <div className={s.accActions}>
          <button type="button" className={s.periodBtn}>
            <CalendarDaysIcon />
            <span className={s.periodLbl}>{t('financial.recon.period')}</span>
          </button>
          {/* Importar OFX/CSV (US2); PDF via OCR fica anunciado (#145) */}
          <ImportMenu
            importing={vm.import.importing}
            summary={vm.import.summary}
            errorTag={vm.import.errorTag}
            onPickFile={vm.import.importFile}
          />
        </div>
      </header>

      {/* tabs-bar */}
      <div className={s.tabsBar}>
        <div className={s.tabs} role="tablist" aria-label={t('financial.recon.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={ui.activeTab === 'extrato'}
            className={ui.activeTab === 'extrato' ? s.tab.active : s.tab.inactive}
            onClick={() => {
              vm.setTab('extrato')
            }}
          >
            {t('financial.recon.tab.extrato')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ui.activeTab === 'conciliacao'}
            className={ui.activeTab === 'conciliacao' ? s.tab.active : s.tab.inactive}
            onClick={() => {
              vm.setTab('conciliacao')
            }}
          >
            {t('financial.recon.tab.conciliacao')}
          </button>
        </div>

        <div className={s.tabsRight}>
          <div className={s.progressMini}>
            <span>{t('financial.recon.progress')}</span>
            <span className={s.progressBar}>
              <span className={s.progressFill} style={{ inlineSize: `${String(progress.percent)}%` }} />
            </span>
            <span className={s.progressNum}>{progress.label}</span>
          </div>
          <button
            type="button"
            className={s.toggle}
            aria-pressed={ui.showGuesses}
            onClick={() => {
              vm.toggleGuesses()
            }}
          >
            <span className={ui.showGuesses ? s.switchTrack.on : s.switchTrack.off} aria-hidden="true" />
            {ui.showGuesses ? <EyeIcon /> : <EyeOffIcon />}
            {t('financial.recon.guesses')}
          </button>
        </div>
      </div>

      {/* corpo — conciliação (US1: lista + sugestão); extrato (US8) entra depois */}
      <div className={s.workspace} role="tabpanel">
        {ui.activeTab === 'conciliacao' ? (
          <div className={s.conciliacaoView}>
            <ImportsList
              state={vm.txList}
              filter={ui.listFilter}
              counts={vm.filterCounts}
              selectedId={ui.selectedTransactionId}
              onFilter={vm.setListFilter}
              onSelect={vm.selectTransaction}
            />
            {vm.selectedTx !== null && !isPending(vm.selectedTx) ? (
              <ReconciledBanner
                undo={vm.undo}
                reconciliationId={vm.reconciliationIdFor(vm.selectedTx.id)}
                transactionId={vm.selectedTx.id}
              />
            ) : vm.selectedTx === null ? (
              <SuggestionPane
                state={{ tag: 'idle' }}
                selectedTx={null}
                reconciling={false}
                rejecting={false}
                errorTag={null}
                onReconcile={() => undefined}
                onReject={() => undefined}
              />
            ) : (
              <div className={s.importsCol}>
                <div className={s.assocTabs} role="tablist" aria-label={t('financial.recon.assoc.sugestao')}>
                  {ASSOC_TABS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="tab"
                      aria-selected={ui.assocTab === a.id}
                      className={ui.assocTab === a.id ? s.assocTab.active : s.assocTab.inactive}
                      onClick={() => {
                        vm.setAssocTab(a.id)
                      }}
                    >
                      {t(a.tag)}
                    </button>
                  ))}
                </div>
                {ui.assocTab === 'sugestao' ? (
                  <SuggestionPane
                    state={ui.showGuesses ? vm.suggestions : { tag: 'idle' }}
                    selectedTx={vm.selectedTx}
                    reconciling={vm.reconcile.reconciling}
                    rejecting={vm.reconcile.rejecting}
                    errorTag={vm.reconcile.errorTag}
                    onReconcile={(payableId) => {
                      if (ui.selectedTransactionId !== null) {
                        vm.reconcile.reconcileOne(ui.selectedTransactionId, payableId)
                      }
                    }}
                    onReject={(payableId) => {
                      if (ui.selectedTransactionId !== null) {
                        vm.reconcile.rejectOne(ui.selectedTransactionId, payableId)
                      }
                    }}
                  />
                ) : ui.assocTab === 'nova' ? (
                  <NewTransactionPane binding={vm.manualEntry} />
                ) : (
                  <SearchCreatePane
                    binding={vm.searchCreate}
                    payables={vm.payables}
                    extratoValueCents={vm.selectedTx.valueCents}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <StatementGrid
            hasStatement={ui.statementId !== null}
            items={vm.extrato.items}
            totals={vm.extrato.totals}
            filter={ui.extratoFilter}
            onFilter={vm.setExtratoFilter}
          />
        )}
      </div>

      {/* bottombar */}
      <footer className={s.bottombar}>
        <span className={s.auditNote}>
          {vm.closePeriod.closed ? t('financial.recon.close.success') : t('financial.recon.bottombar.audit')}
        </span>
        <div className={s.bottomActions}>
          {vm.closePeriod.errorTag !== null ? (
            <span className={s.errorText}>{t(vm.closePeriod.errorTag)}</span>
          ) : null}
          {/* Exportar = chrome até #173 (sem endpoint p/ obter o periodId) */}
          <button
            type="button"
            className={s.btnSecondary}
            disabled
            aria-disabled="true"
            title={t('financial.recon.bottombar.exportUnavailable')}
          >
            <DownloadIcon />
            {t('financial.recon.bottombar.export')}
          </button>
          {/* Fechar período (US7) — bloqueado se há pendentes ou sem extrato */}
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!vm.closePeriod.canClose}
            aria-disabled={!vm.closePeriod.canClose}
            title={
              ui.statementId === null
                ? t('financial.recon.close.noStatement')
                : vm.filterCounts.pendentes > 0
                  ? t('financial.recon.close.pendingBlocked')
                  : undefined
            }
            onClick={() => {
              vm.closePeriod.close()
            }}
          >
            <CheckCircleIcon />
            {t('financial.recon.bottombar.close')}
          </button>
        </div>
      </footer>
    </div>
  )
}
