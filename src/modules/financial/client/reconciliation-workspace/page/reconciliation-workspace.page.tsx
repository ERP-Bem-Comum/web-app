/**
 * Workspace de Conciliação — PAGE (view burra §XI). Estrutura fiel ao mock `conciliacao_bancaria`:
 * acc-header (identidade + saldo + Período + Importar) · tabs (Extrato | Conciliação) com progresso e
 * toggle "Exibir palpites" · corpo · bottombar (Exportar + Fechar período). Consome só o binding; sem
 * data-hooks aqui. Identidade/saldo da conta = chrome honesto até #168; Importar (US2), Exportar (#173) e
 * Fechar período (US7) entram nas próximas fatias (desabilitados/anunciados por ora).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useReconciliationWorkspace } from '../reconciliation-workspace.binding.ts'
import { centsToBRL, isPending, type AssocTab } from '../reconciliation-workspace.view-model.ts'
import { ImportMenu } from '../components/import-menu.component.tsx'
import { ImportsList } from '../components/imports-list.component.tsx'
import { SuggestionPane } from '../components/suggestion-pane.component.tsx'
import { SearchCreatePane } from '../components/search-create-pane.component.tsx'
import { NewTransactionPane } from '../components/new-transaction-pane.component.tsx'
import { ReconciledBanner } from '../components/reconciled-banner.component.tsx'
import { StatementGrid } from '../components/statement-grid.component.tsx'
import { ChangeAccountModal } from '../components/change-account-modal.component.tsx'
import { MatchDetailsModal } from '../components/match-details-modal.component.tsx'
import { PeriodMenu } from '../components/period-menu.component.tsx'
import { ExportMenu } from '../components/export-menu.component.tsx'
import { PeriodActionsMenu } from '../components/period-actions-menu.component.tsx'
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
              <button type="button" className={s.changeAcc} onClick={vm.changeAccount.openModal}>
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
          <PeriodMenu menus={vm.headerMenus} />
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
            {t('financial.recon.guesses')}
            <span className={s.guessesHint}>{t('financial.recon.guessesHint')}</span>
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
              guesses={vm.guesses}
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
            hasStatement={vm.extrato.hasStatement}
            days={vm.extrato.days}
            totals={vm.extrato.totals}
            count={vm.extrato.count}
            counts={vm.extrato.counts}
            filter={ui.extratoFilter}
            onFilter={vm.setExtratoFilter}
            onOpenDetails={vm.matchDetails.openFor}
          />
        )}
      </div>

      {/* bottombar */}
      <footer className={s.bottombar}>
        <div className={s.legend}>
          <span className={s.legendItem}>
            <span className={s.legendDot.alta} aria-hidden />
            {t('financial.recon.legend.alta')}
          </span>
          <span className={s.legendItem}>
            <span className={s.legendDot.parcial} aria-hidden />
            {t('financial.recon.legend.parcial')}
          </span>
          <span className={s.legendItem}>
            <span className={s.legendDot.semMatch} aria-hidden />
            {t('financial.recon.legend.semMatch')}
          </span>
          <span className={s.legendItem}>
            <span className={s.legendDot.conciliado} aria-hidden />
            {t('financial.recon.legend.conciliado')}
          </span>
          <span className={s.legendSep} aria-hidden />
          <span className={s.auditNote}>
            <span className={s.auditDot} aria-hidden />
            {vm.closePeriod.closed
              ? t('financial.recon.close.success')
              : t('financial.recon.bottombar.audit')}
          </span>
        </div>
        <div className={s.bottomActions}>
          {vm.closePeriod.errorTag !== null ? (
            <span className={s.errorText}>{t(vm.closePeriod.errorTag)}</span>
          ) : null}
          {/* Exportar OFX/CSV reais (#173, exporta o período mais recente); PDF segue chrome (#145) */}
          <ExportMenu menus={vm.headerMenus} exportBinding={vm.exportConciliacao} />
          {/* Período (US7): dropdown Fechar/Abrir período. Fechar gated (sem extrato/pendências);
              Abrir = chrome até o backend (core-api#203). */}
          <PeriodActionsMenu
            menus={vm.headerMenus}
            canClose={vm.closePeriod.canClose}
            closeHint={
              ui.statementId === null
                ? t('financial.recon.close.noStatement')
                : vm.filterCounts.pendentes > 0
                  ? t('financial.recon.close.pendingBlocked')
                  : null
            }
            onClosePeriod={() => {
              vm.closePeriod.close()
            }}
          />
        </div>
      </footer>

      <ChangeAccountModal
        open={vm.changeAccount.open}
        search={vm.changeAccount.search}
        list={vm.changeAccount.list}
        onClose={vm.changeAccount.close}
        onSearch={vm.changeAccount.setSearch}
        onSelect={vm.changeAccount.select}
        onAdd={vm.changeAccount.add}
      />

      <MatchDetailsModal
        open={vm.matchDetails.open}
        view={vm.matchDetails.view}
        canUndo={vm.matchDetails.tx !== null && vm.matchDetails.reconciliationId !== null}
        undoing={vm.undo.undoing}
        onUndo={() => {
          const target = vm.matchDetails.tx
          const reconciliationId = vm.matchDetails.reconciliationId
          if (target === null || reconciliationId === null) return
          vm.undo.undo(reconciliationId, target.id)
          vm.matchDetails.close()
        }}
        onViewTitle={() => undefined}
        onClose={vm.matchDetails.close}
      />
    </div>
  )
}
