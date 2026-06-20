/**
 * Grid de contas-cedente (TELA 1) — PAGE (view burra §XI). Padrão do grid de **Contas a Pagar**: título
 * pelo PageHeader do shell ("Contas bancárias"); filter-bar (busca + chips segmentados com contadores +
 * ordenar); grid em card com borda; footer fixo (consolidado + Adicionar conta). A listagem real depende
 * de core-api#168 → estado `unavailable` honesto (sem fabricar, ADR-0011). Consome só o binding.
 */
import { Link, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { SearchIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import { useReconciliationAccounts, type ChipCounts } from '../reconciliation-accounts.binding.ts'
import type { SortKey, StatusFilter } from '../reconciliation-accounts.view-model.ts'
import { AccountsGrid } from '../components/accounts-grid.component.tsx'
import { AddAccountModal } from '../components/add-account-modal.component.tsx'
import * as s from './reconciliation-accounts.css.ts'

const t = createTranslator(ptBR)

// Conta de teste (placeholder) p/ destravar o workspace até #168 expor o cadastro de contas-cedente.
const PLACEHOLDER_ACCOUNT_REF = 'b1a7c0de-0000-4000-8000-000000000168'
const ISSUE_168 = 'core-api#168'

const CHIPS: readonly {
  id: StatusFilter
  tag: string
  countKey: keyof ChipCounts
  dot?: 'pending' | 'upToDate' | 'closed'
}[] = [
  { id: 'todas', tag: 'financial.recon.accounts.chip.todas', countKey: 'todas' },
  { id: 'pendentes', tag: 'financial.recon.accounts.chip.pendentes', countKey: 'pendentes', dot: 'pending' },
  { id: 'em-dia', tag: 'financial.recon.accounts.chip.emDia', countKey: 'emDia', dot: 'upToDate' },
  {
    id: 'encerradas',
    tag: 'financial.recon.accounts.chip.encerradas',
    countKey: 'encerradas',
    dot: 'closed',
  },
]

const SORTS: readonly SortKey[] = ['pendencias', 'saldo', 'nome', 'atualizacao']

export function ReconciliationAccountsPage() {
  const vm = useReconciliationAccounts()
  const navigate = useNavigate()

  return (
    <div className={s.screen}>
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
          {CHIPS.map((ch) => {
            const on = vm.status === ch.id
            return (
              <button
                key={ch.id}
                type="button"
                className={on ? s.chip.active : s.chip.inactive}
                aria-pressed={on}
                onClick={() => {
                  vm.setStatus(ch.id)
                }}
              >
                {ch.dot !== undefined ? <span className={s.chipDot[ch.dot]} aria-hidden="true" /> : null}
                {t(ch.tag)}
                <span className={on ? s.chipCount.active : s.chipCount.inactive}>
                  {String(vm.counts[ch.countKey])}
                </span>
              </button>
            )
          })}
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
          <div className={s.grid}>
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
          </div>
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

      {/* footer (padrão Contas a Pagar): consolidado à esquerda, Adicionar conta à direita */}
      <footer className={s.bottombar}>
        {vm.state.tag === 'ready' ? (
          <span className={s.footConsolidated}>
            {t('financial.recon.accounts.consolidated')}
            <span className={s.footConsolidatedVal}>{vm.state.consolidated.balanceBRL}</span>
            <span className={s.footPending}>
              {t('financial.recon.accounts.status.pending').replace(
                '{n}',
                String(vm.state.consolidated.pendingTotal),
              )}
            </span>
          </span>
        ) : null}
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
        binding={vm.add}
        onClose={() => {
          vm.closeAdd()
        }}
      />
    </div>
  )
}
