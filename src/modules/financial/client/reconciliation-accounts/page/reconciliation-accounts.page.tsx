/**
 * Grid de contas-cedente (TELA 1) — PAGE (view burra §XI). Estrutura fiel ao mock `grid_conciliacao`:
 * topbar (consolidado) · filter-bar (busca + chips de status + ordenar) · grid (head + linhas) · footer ·
 * bottombar (Adicionar conta) · modal. A listagem real depende de core-api#168 → estado `unavailable`
 * honesto (sem fabricar linhas, ADR-0011), com CTA para a conta de teste. Consome só o binding.
 */
import { Link, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, SearchIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import { useReconciliationAccounts } from '../reconciliation-accounts.binding.ts'
import type { SortKey, StatusFilter } from '../reconciliation-accounts.view-model.ts'
import { AccountsGrid } from '../components/accounts-grid.component.tsx'
import { AddAccountModal } from '../components/add-account-modal.component.tsx'
import * as s from './reconciliation-accounts.css.ts'

const t = createTranslator(ptBR)

// Conta de teste (placeholder) p/ destravar o workspace até #168 expor o cadastro de contas-cedente.
// UUID v4 válido; o import NÃO valida o ref no backend (#152), então qualquer uuid consistente serve.
const PLACEHOLDER_ACCOUNT_REF = 'b1a7c0de-0000-4000-8000-000000000168'
const ISSUE_168 = 'core-api#168'

const CHIPS: readonly { id: StatusFilter; tag: string; dot?: 'pending' | 'upToDate' | 'closed' }[] = [
  { id: 'todas', tag: 'financial.recon.accounts.chip.todas' },
  { id: 'pendentes', tag: 'financial.recon.accounts.chip.pendentes', dot: 'pending' },
  { id: 'em-dia', tag: 'financial.recon.accounts.chip.emDia', dot: 'upToDate' },
  { id: 'encerradas', tag: 'financial.recon.accounts.chip.encerradas', dot: 'closed' },
]

const SORTS: readonly SortKey[] = ['pendencias', 'saldo', 'nome', 'atualizacao']

export function ReconciliationAccountsPage() {
  const vm = useReconciliationAccounts()
  const navigate = useNavigate()

  return (
    <div className={s.screen}>
      {/* topbar */}
      <header className={s.topbar}>
        <span className={s.topTitle}>{t('financial.recon.title')}</span>
        {vm.state.tag === 'ready' ? (
          <span className={s.countChip}>
            {t('financial.recon.accounts.foot.count').replace(
              '{n}',
              String(vm.state.consolidated.accountsCount),
            )}
          </span>
        ) : null}
        {vm.state.tag === 'ready' ? (
          <span className={s.summary}>
            <CheckCircleIcon />
            {vm.state.consolidated.balanceBRL}
          </span>
        ) : null}
      </header>

      {/* filter-bar */}
      <div className={s.filterBar}>
        <div className={s.search}>
          <SearchIcon />
          <input
            className={s.searchInput}
            placeholder={t('financial.recon.accounts.search')}
            aria-label={t('financial.recon.accounts.search')}
            value={vm.search}
            onChange={(e) => {
              vm.setSearch(e.target.value)
            }}
          />
        </div>
        <div className={s.statusChips} role="group" aria-label={t('financial.recon.accounts.col.status')}>
          {CHIPS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              className={vm.status === ch.id ? s.chip.active : s.chip.inactive}
              aria-pressed={vm.status === ch.id}
              onClick={() => {
                vm.setStatus(ch.id)
              }}
            >
              {ch.dot !== undefined ? <span className={s.chipDot[ch.dot]} aria-hidden="true" /> : null}
              {t(ch.tag)}
            </button>
          ))}
        </div>
        <div className={s.sortWrap}>
          <select
            className={s.sortBtn}
            aria-label={t('financial.recon.accounts.sort')}
            value={vm.sort}
            onChange={(e) => {
              vm.setSort(e.target.value as SortKey)
            }}
          >
            {SORTS.map((k) => (
              <option key={k} value={k}>
                {t(`financial.recon.accounts.sort.${k}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* grid / estados */}
      <div className={s.gridWrap}>
        {vm.state.tag === 'ready' ? (
          <>
            <AccountsGrid
              rows={vm.state.rows}
              onOpen={(row) => {
                if (row.openable) {
                  void navigate({
                    to: '/financeiro/conciliacao/$accountId',
                    params: { accountId: row.id },
                  })
                }
              }}
            />
            <div className={s.gridFoot}>
              <span className={s.ftLabel}>{t('financial.recon.accounts.consolidated')}</span>
              <span />
              <span className={s.ftVal}>{vm.state.consolidated.balanceBRL}</span>
              <span className={s.ftPending}>
                {t('financial.recon.accounts.status.pending').replace(
                  '{n}',
                  String(vm.state.consolidated.pendingTotal),
                )}
              </span>
              <span />
            </div>
          </>
        ) : vm.state.tag === 'loading' ? (
          <div className={s.stateBox}>
            <p className={s.stateBody}>{t('financial.recon.accounts.loading')}</p>
          </div>
        ) : vm.state.tag === 'empty' ? (
          <div className={s.stateBox}>
            <WalletIcon />
            <p className={s.stateBody}>{t('financial.recon.accounts.empty')}</p>
          </div>
        ) : vm.state.tag === 'error' ? (
          <div className={s.stateBox}>
            <p className={s.stateBody}>{t(vm.state.errorTag)}</p>
          </div>
        ) : (
          /* unavailable (#168) — chrome honesto */
          <div className={s.stateBox}>
            <WalletIcon />
            <h2 className={s.stateTitle}>{t('financial.recon.accounts.unavailable.title')}</h2>
            <p className={s.stateBody}>{t('financial.recon.accounts.unavailable.body')}</p>
            <span className={s.noticeChrome}>{ISSUE_168}</span>
            <Link
              to="/financeiro/conciliacao/$accountId"
              params={{ accountId: PLACEHOLDER_ACCOUNT_REF }}
              className={s.btnPrimary}
            >
              {t('financial.recon.accounts.openWorkspace')}
            </Link>
          </div>
        )}
      </div>

      {/* bottombar */}
      <footer className={s.bottombar}>
        <div className={s.bottomActions}>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={() => {
              vm.openAdd()
            }}
          >
            {t('financial.recon.accounts.addAccount')}
          </button>
        </div>
      </footer>

      <AddAccountModal
        open={vm.addOpen}
        onClose={() => {
          vm.closeAdd()
        }}
      />
    </div>
  )
}
