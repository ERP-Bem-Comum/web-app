import { useNavigate, getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronUpIcon, CalculatorIcon } from '#shared/ui/index.ts'

import { useOrcamento } from './orcamento.binding.ts'
import { OrcamentoGrid } from './orcamento-grid.component.tsx'
import {
  screen,
  header,
  backButton,
  breadcrumb,
  card,
  titleRow,
  title,
  totalBudget,
  totalValue,
  actionBar,
  filterGroup,
  centroSelect,
  filterButton,
  discardButton,
  moreButton,
  actionsRight,
  saveButton,
  sectionHeader,
  centroTitle,
  controls,
  navButton,
  calcGastoButton,
  notFound,
} from './orcamento.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/planejamento_/detalhes/$id/orcamento')

export function OrcamentoPage(): ReactNode {
  const params = routeApi.useParams()
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const id = Number(params.id)
  const { state, centroOptions, centro, setCentro, apply, prevSemester, nextSemester } = useOrcamento(
    id,
    search.estado,
  )

  const goBack = (): void => {
    void navigate({ to: '/planejamento/detalhes/$id', params: { id: String(id) } })
  }

  const openCalcular = (): void => {
    // TODO(US2.4b): abrir a tela "Calculando Gastos" (aba do centro / linha selecionada).
  }

  return (
    <div className={screen}>
      <div className={header}>
        <button
          type="button"
          className={backButton}
          aria-label={t('budget-plans.orcamento.back')}
          onClick={goBack}
        >
          <ChevronUpIcon size={18} />
        </button>
        <span className={breadcrumb}>{t('budget-plans.orcamento.breadcrumb')}</span>
      </div>

      {state.status === 'not-found' ? (
        <p className={notFound}>{t('budget-plans.orcamento.notFound')}</p>
      ) : (
        <div className={card}>
          <div className={titleRow}>
            <h1 className={title}>{state.title}</h1>
            <span className={totalBudget}>
              {t('budget-plans.orcamento.totalBudget')} <span className={totalValue}>{state.totalLabel}</span>
            </span>
          </div>

          <div className={actionBar}>
            <div className={filterGroup}>
              <select
                className={centroSelect}
                aria-label={t('budget-plans.orcamento.centroCusto')}
                value={centro}
                onChange={(e) => {
                  setCentro(e.target.value)
                }}
              >
                {centroOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="button" className={filterButton} onClick={apply}>
                {t('budget-plans.orcamento.filter')}
              </button>
            </div>
            <div className={actionsRight}>
              <button type="button" className={discardButton} disabled>
                {t('budget-plans.orcamento.discard')}
              </button>
              {/* TODO(US2.4b/#113): Salvar persiste as alterações via server fn. */}
              <button type="button" className={saveButton} disabled>
                {t('budget-plans.orcamento.save')}
              </button>
              <button
                type="button"
                className={moreButton}
                aria-label={t('budget-plans.orcamento.moreActions')}
                disabled
              >
                {'…'}
              </button>
            </div>
          </div>

          <div className={sectionHeader}>
            <h2 className={centroTitle}>{state.centroName}</h2>
            <div className={controls}>
              <button
                type="button"
                className={navButton}
                aria-label={t('budget-plans.matrix.prev')}
                disabled={state.matrix.semester === 0}
                onClick={prevSemester}
              >
                {'‹'}
              </button>
              <button
                type="button"
                className={navButton}
                aria-label={t('budget-plans.matrix.next')}
                disabled={state.matrix.semester === 1}
                onClick={nextSemester}
              >
                {'›'}
              </button>
              <button type="button" className={calcGastoButton} onClick={openCalcular}>
                <CalculatorIcon size={16} />
                {t('budget-plans.orcamento.calcGasto')}
              </button>
            </div>
          </div>

          <OrcamentoGrid
            matrix={state.matrix}
            labels={{
              categoriesHeader: t('budget-plans.orcamento.categoriesHeader'),
              calcRow: t('budget-plans.orcamento.calcRow'),
              expand: t('budget-plans.matrix.expand'),
              collapse: t('budget-plans.matrix.collapse'),
            }}
            onCalcular={openCalcular}
          />
        </div>
      )}
    </div>
  )
}
