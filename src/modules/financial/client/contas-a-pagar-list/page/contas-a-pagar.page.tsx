/**
 * Contas a Pagar — PAGE (view burra §XI). Estrutura fiel ao Figma 205-638: filter-bar (busca + status-chips
 * segmented-control) + grid + bottombar (footer no padrão Contratos: paginação + Novo Documento). O TÍTULO
 * vem do PageHeader do shell (padrão Contratos, Nunito). Busca e contadores por-aba = CHROME no v1 (a Fatia 2
 * não faz busca textual nem agrega por status); só o "Todos" mostra o total real. Não usa data-hooks direto.
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { SearchIcon } from '#shared/ui/icons/index.ts'

import { useContasAPagar } from '../contas-a-pagar.binding.ts'
import { STATUS_CHIPS } from '../contas-a-pagar.view-model.ts'
import { DocumentGrid } from '../components/document-grid.component.tsx'
import {
  screen,
  filterBar,
  searchWrap,
  searchIcon,
  searchInput,
  kbd,
  statusChips,
  chip,
  chipActive,
  chipCountOnActive,
  gridWrap,
  bottombar,
  newButton,
  pagination,
  pageRange,
  pageNav,
  pageBtn,
} from './contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export function ContasAPagarPage(): ReactNode {
  const { state, onPrev, onNext } = useContasAPagar()
  const page = state.tag === 'ready' ? state.page : null

  return (
    <div className={screen}>
      <div className={filterBar}>
        <div className={searchWrap}>
          <span className={searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          {/* Busca = CHROME no v1 (Fatia 2 não tem busca textual). */}
          <input
            className={searchInput}
            type="text"
            placeholder={t('financial.list.search')}
            aria-label={t('financial.list.search')}
          />
          <span className={kbd}>⌘K</span>
        </div>

        <div className={statusChips}>
          {STATUS_CHIPS.map((c, i) => {
            const active = i === 0 // "Todos" ativo (chrome — chips não filtram no v1)
            return (
              <span key={c.key} className={active ? chipActive : chip}>
                {t(c.labelTag)}
                {active && page !== null ? (
                  <span className={chipCountOnActive}>{String(page.total)}</span>
                ) : null}
              </span>
            )
          })}
        </div>
      </div>

      <div className={gridWrap}>
        <DocumentGrid state={state} />
      </div>

      <footer className={bottombar}>
        {page !== null ? (
          <nav className={pagination} aria-label={t('financial.list.pagination')}>
            <span className={pageRange}>{page.rangeLabel}</span>
            <div className={pageNav}>
              <button
                type="button"
                className={pageBtn}
                onClick={onPrev}
                disabled={!page.hasPrev}
                aria-label={t('financial.list.prev')}
              >
                ‹
              </button>
              <button
                type="button"
                className={pageBtn}
                onClick={onNext}
                disabled={!page.hasNext}
                aria-label={t('financial.list.next')}
              >
                ›
              </button>
            </div>
          </nav>
        ) : null}
        <Link to="/financeiro/contas-a-pagar/lancar" className={newButton}>
          {t('financial.list.new')}
        </Link>
      </footer>
    </div>
  )
}
