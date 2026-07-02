import { useNavigate, getRouteApi } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader, BarChartIcon } from '#shared/ui/index.ts'

import {
  usePlanejamentoList,
  PLANEJAMENTO_PROGRAM_OPTIONS,
  FILTER_YEARS,
  PLANEJAMENTO_GRAND_TOTAL_LABEL,
} from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import { useCreatePlan, IMPORT_YEARS } from '#modules/budget-plans/client/planejamento/create-plan.binding.ts'
import type { CreatePlanError } from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'

import { PlanFilters } from '../components/plan-filters.component.tsx'
import { PlanTreeTable } from '../components/plan-tree-table.component.tsx'
import { PlanPaginator } from '../components/plan-paginator.component.tsx'
import { CreatePlanModal } from '../components/create-plan-modal.component.tsx'
import { screen, card, titleIcon } from './planejamento-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/planejamento')

const actionKey = (action: PlanAction): string => {
  switch (action) {
    case 'share':
      return 'budget-plans.action.share'
    case 'planned-vs-actual':
      return 'budget-plans.action.plannedVsActual'
    case 'start-calibration':
      return 'budget-plans.action.startCalibration'
    case 'approve':
      return 'budget-plans.action.approve'
    case 'create-scenery':
      return 'budget-plans.action.createScenery'
    case 'export-csv':
      return 'budget-plans.action.exportCsv'
    case 'delete':
      return 'budget-plans.action.delete'
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export function PlanejamentoListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state } = usePlanejamentoList(search)
  const [createOpen, setCreateOpen] = useState(false)
  const createPlan = useCreatePlan(PLANEJAMENTO_PROGRAM_OPTIONS, () => {
    setCreateOpen(false)
  })

  const closeCreate = (): void => {
    createPlan.reset()
    setCreateOpen(false)
  }

  const emptyLabel = state.filtered ? t('budget-plans.list.noResults') : t('budget-plans.list.empty')

  return (
    <div className={screen}>
      <PageHeader
        title={t('budget-plans.list.title')}
        subtitle={t('budget-plans.list.subtitle')}
        icon={
          <span className={titleIcon}>
            <BarChartIcon size={24} />
          </span>
        }
      />

      <div className={card}>
        <PlanFilters
          value={{
            search: search.search ?? '',
            year: search.year !== undefined ? String(search.year) : '',
            program: search.program ?? '',
            status: search.status ?? '',
          }}
          years={FILTER_YEARS}
          programs={PLANEJAMENTO_PROGRAM_OPTIONS}
          labels={{
            filterToggle: t('budget-plans.filters.toggle'),
            searchPlaceholder: t('budget-plans.filters.search'),
            create: t('budget-plans.list.create'),
            year: t('budget-plans.filters.year'),
            program: t('budget-plans.filters.program'),
            status: t('budget-plans.filters.status'),
            all: t('budget-plans.filters.all'),
            apply: t('budget-plans.filters.apply'),
            clear: t('budget-plans.filters.clear'),
            statusRascunho: t('budget-plans.status.rascunho'),
            statusEmCalibracao: t('budget-plans.status.emCalibracao'),
            statusAprovado: t('budget-plans.status.aprovado'),
          }}
          onSearch={(value) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, search: value === '' ? undefined : value, page: 1 }),
            })
          }
          onApply={(v) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                year: v.year === '' ? undefined : Number(v.year),
                program: v.program === '' ? undefined : v.program,
                status: v.status === '' ? undefined : v.status,
                page: 1,
              }),
            })
          }
          onClear={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, year: undefined, program: undefined, status: undefined, page: 1 }),
            })
          }
          onCreate={() => {
            setCreateOpen(true)
          }}
        />

        <PlanTreeTable
          rows={state.rows}
          emptyLabel={emptyLabel}
          grandTotalLabel={PLANEJAMENTO_GRAND_TOTAL_LABEL}
          labels={{
            plan: t('budget-plans.columns.plan'),
            total: t('budget-plans.columns.total'),
            partners: t('budget-plans.columns.partners'),
            status: t('budget-plans.columns.status'),
            audit: t('budget-plans.columns.audit'),
            actionsHeader: t('budget-plans.columns.actions'),
            actionsTrigger: t('budget-plans.list.rowActions'),
            expand: t('budget-plans.list.expand'),
            collapse: t('budget-plans.list.collapse'),
            totalRow: t('budget-plans.list.totalRow'),
          }}
          actionLabelFor={(action) => t(actionKey(action))}
          onOpenPlan={(id) => {
            void navigate({
              to: '/planejamento/detalhes/$id',
              params: { id: String(id) },
            })
          }}
          onAction={() => {
            // TODO(#113): executar a ação (aprovar/excluir/calibração/cenário) — depende das mutations do BFF.
          }}
        />

        <PlanPaginator
          page={state.page}
          totalPages={state.totalPages}
          perPage={search.limit}
          total={state.total}
          labels={{
            perPage: t('budget-plans.paginator.perPage'),
            previous: t('budget-plans.paginator.previous'),
            next: t('budget-plans.paginator.next'),
            rangeTemplate: t('budget-plans.paginator.range'),
          }}
          onPrev={() =>
            void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, state.page - 1) }) })
          }
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: state.page + 1 }) })}
          onPerPage={(perPage) =>
            void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
          }
        />
      </div>

      <CreatePlanModal
        open={createOpen}
        form={createPlan.form}
        errorTag={createPlan.errorTag}
        programOptions={PLANEJAMENTO_PROGRAM_OPTIONS}
        importYears={IMPORT_YEARS}
        labels={{
          title: t('budget-plans.create.title'),
          close: t('budget-plans.create.close'),
          year: t('budget-plans.create.year'),
          program: t('budget-plans.create.program'),
          programPlaceholder: t('budget-plans.create.programPlaceholder'),
          importData: t('budget-plans.create.importData'),
          importFromYear: t('budget-plans.create.importFromYear'),
          add: t('budget-plans.create.add'),
          cancel: t('budget-plans.create.cancel'),
        }}
        translateError={(tag: CreatePlanError) => t(tag)}
        onClose={closeCreate}
        onYear={createPlan.setYear}
        onProgram={createPlan.setProgram}
        onToggleImport={createPlan.toggleImport}
        onImportFromYear={createPlan.setImportFromYear}
        onSubmit={createPlan.submit}
      />
    </div>
  )
}
