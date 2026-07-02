import { useNavigate, getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, ChevronUpIcon, type BadgeProps } from '#shared/ui/index.ts'
import type { StatusTone } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

import { usePlanDetail } from '../plan-detail.binding.ts'
import { ConsolidatedMatrix } from '../components/consolidated-matrix.component.tsx'
import {
  screen,
  header,
  backButton,
  breadcrumb,
  resultCard,
  titleRow,
  title,
  totalPlan,
  totalValue,
  actionBar,
  filterGroup,
  stateSelect,
  municipioSelect,
  filterButton,
  actionsRight,
  secondaryButton,
  moreButton,
  notFound,
} from './plan-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/planejamento_/detalhes/$id')

const BADGE_VARIANT: Readonly<Record<StatusTone, BadgeProps['variant']>> = {
  neutral: 'outro',
  info: 'finished',
  success: 'active',
}

export function PlanDetailPage(): ReactNode {
  const params = routeApi.useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const { state, view, setView, prevSemester, nextSemester, filter } = usePlanDetail(id)

  const goBack = (): void => {
    void navigate({ to: '/planejamento' })
  }

  return (
    <div className={screen}>
      <div className={header}>
        <button
          type="button"
          className={backButton}
          aria-label={t('budget-plans.detail.back')}
          onClick={goBack}
        >
          <ChevronUpIcon size={18} />
        </button>
        <span className={breadcrumb}>{t('budget-plans.detail.breadcrumb')}</span>
      </div>

      {state.status === 'not-found' ? (
        <p className={notFound}>{t('budget-plans.detail.notFound')}</p>
      ) : (
        <>
          <div className={resultCard}>
            <div className={titleRow}>
              <h1 className={title}>
                {state.header.title}
                <Badge variant={BADGE_VARIANT[state.header.status.tone]} size="sm" uppercase>
                  {state.header.status.label}
                </Badge>
              </h1>
              <span className={totalPlan}>
                {t('budget-plans.detail.totalPlan')}{' '}
                <span className={totalValue}>{state.header.totalLabel}</span>
              </span>
            </div>
          </div>

          <div className={actionBar}>
            {/* Filtro por Rede: Estado + Município. Ao aplicar ("Filtrar") com ambos, a matriz troca os
                toggles por "Editar" (entrada da edição de Orçamento — US2.4, próxima parte). */}
            <div className={filterGroup}>
              <select
                className={stateSelect}
                aria-label={t('budget-plans.detail.stateFilter')}
                value={filter.estado}
                onChange={(e) => {
                  filter.setEstado(e.target.value)
                }}
              >
                <option value="">{t('budget-plans.detail.stateFilter')}</option>
                {filter.estadoOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className={municipioSelect}
                aria-label={t('budget-plans.detail.municipioFilter')}
                value={filter.municipio}
                disabled={filter.estado === ''}
                onChange={(e) => {
                  filter.setMunicipio(e.target.value)
                }}
              >
                <option value="">{t('budget-plans.detail.municipioFilter')}</option>
                {filter.municipioOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={filterButton}
                disabled={filter.estado === '' || filter.municipio === ''}
                onClick={filter.apply}
              >
                {t('budget-plans.detail.filter')}
              </button>
            </div>
            {/* 🔁 TODO(US2/US3): Insights, Adicionar Orçamento e menu "…" viram modais/fluxos reais. */}
            <div className={actionsRight}>
              <button type="button" className={secondaryButton} disabled>
                {t('budget-plans.detail.insights')}
              </button>
              <button type="button" className={secondaryButton} disabled>
                {t('budget-plans.detail.addBudget')}
              </button>
              <button
                type="button"
                className={moreButton}
                aria-label={t('budget-plans.detail.moreActions')}
                disabled
              >
                {'…'}
              </button>
            </div>
          </div>

          <ConsolidatedMatrix
            matrix={state.matrix}
            labels={{
              sectionTitle:
                view === 'month' ? t('budget-plans.matrix.byMonth') : t('budget-plans.matrix.byNetwork'),
              centroCusto: t('budget-plans.matrix.centroCusto'),
              porMes: t('budget-plans.matrix.porMes'),
              porRede: t('budget-plans.matrix.porRede'),
              prev: t('budget-plans.matrix.prev'),
              next: t('budget-plans.matrix.next'),
              centrosHeader: t('budget-plans.matrix.centrosHeader'),
              total: t('budget-plans.matrix.total'),
              expand: t('budget-plans.matrix.expand'),
              collapse: t('budget-plans.matrix.collapse'),
              edit: t('budget-plans.detail.edit'),
            }}
            editMode={filter.editMode}
            onEdit={() => {
              void navigate({
                to: '/planejamento/detalhes/$id/orcamento',
                params: { id: String(id) },
                search: { estado: filter.estado, municipio: filter.municipio },
              })
            }}
            onPrev={prevSemester}
            onNext={nextSemester}
            onSelectCentroCusto={() => {
              /* TODO(US2a-cont): modal de gestão de Centros de Custo */
            }}
            onSelectPorMes={() => {
              setView('month')
            }}
            onSelectPorRede={() => {
              setView('network')
            }}
          />
        </>
      )}
    </div>
  )
}
