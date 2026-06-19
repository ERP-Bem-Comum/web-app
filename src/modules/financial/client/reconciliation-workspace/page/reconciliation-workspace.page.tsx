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
  ChevronDownIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  UploadIcon,
  WalletIcon,
} from '#shared/ui/icons/index.ts'

import { useReconciliationWorkspace } from '../reconciliation-workspace.binding.ts'
import * as s from './reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)

export type ReconciliationWorkspacePageProps = Readonly<{ accountRef: string }>

export function ReconciliationWorkspacePage({ accountRef }: ReconciliationWorkspacePageProps) {
  const vm = useReconciliationWorkspace(accountRef)
  const { ui, progress } = vm

  return (
    <div className={s.screen}>
      {/* acc-header */}
      <header className={s.accHeader}>
        <div className={s.accId}>
          <span className={s.bankMark} aria-hidden="true">
            <WalletIcon />
          </span>
          <div className={s.accInfo}>
            <span className={s.overline}>{t('financial.recon.account.overline')}</span>
            <span className={s.accName}>{t('financial.recon.account.unavailable')}</span>
            <span className={s.accMeta}>{accountRef}</span>
          </div>
        </div>

        <div className={s.balanceBlock}>
          <span className={s.overline}>{t('financial.recon.account.balanceUnavailable')}</span>
          <span className={s.balanceVal}>—</span>
        </div>

        <div className={s.accActions}>
          <span className={s.pill}>
            <CalendarDaysIcon />
            {t('financial.recon.period')}
          </span>
          {/* Importar: a costura (server fn) já existe; a UI de upload entra na US2 */}
          <button
            type="button"
            className={s.btnPrimary}
            disabled
            aria-disabled="true"
            title={t('financial.recon.empty.workspace')}
          >
            <UploadIcon />
            {t('financial.recon.import')}
            <ChevronDownIcon />
          </button>
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

      {/* corpo — vazio honesto até a importação (US2) trazer movimentações */}
      <div className={s.workspace} role="tabpanel">
        <div className={s.emptyState}>
          <p>
            {ui.activeTab === 'conciliacao'
              ? t('financial.recon.empty.workspace')
              : t('financial.recon.empty.extrato')}
          </p>
        </div>
      </div>

      {/* bottombar */}
      <footer className={s.bottombar}>
        <span className={s.auditNote}>{t('financial.recon.bottombar.audit')}</span>
        <div className={s.bottomActions}>
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
          {/* Fechar período = US7 */}
          <button type="button" className={s.btnPrimary} disabled aria-disabled="true">
            <CheckCircleIcon />
            {t('financial.recon.bottombar.close')}
          </button>
        </div>
      </footer>
    </div>
  )
}
