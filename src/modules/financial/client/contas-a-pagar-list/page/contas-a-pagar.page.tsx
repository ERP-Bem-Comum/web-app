/**
 * Contas a Pagar — PAGE (view burra §XI). Compõe o binding (lista real Fatia 2 + paginação) e renderiza
 * topbar + chips (chrome) + grid + paginação + "Novo Documento" (→ Lançar). Não usa data-hooks direto —
 * só o hook de binding. Chips de status e colunas ricas são chrome/gated (FIN-LIST-DTO #47).
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useContasAPagar } from '../contas-a-pagar.binding.ts'
import { STATUS_CHIPS } from '../contas-a-pagar.view-model.ts'
import { DocumentGrid } from '../components/document-grid.component.tsx'
import {
  screen,
  topbar,
  topTitle,
  count,
  newButton,
  chips,
  chip,
  chipActive,
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
      <header className={topbar}>
        <h1 className={topTitle}>{t('financial.list.title')}</h1>
        {page !== null ? (
          <span className={count}>
            {String(page.total)} {t('financial.list.count')}
          </span>
        ) : null}
        <Link to="/financeiro/contas-a-pagar/lancar" className={newButton}>
          {t('financial.list.new')}
        </Link>
      </header>

      <div className={chips}>
        {STATUS_CHIPS.map((c, i) => (
          <span key={c.key} className={i === 0 ? chipActive : chip}>
            {t(c.labelTag)}
          </span>
        ))}
      </div>

      <DocumentGrid state={state} />

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
    </div>
  )
}
