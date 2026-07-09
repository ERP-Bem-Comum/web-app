import { useNavigate, getRouteApi } from '@tanstack/react-router'
import { useState, useEffect, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { BarChartIcon } from '#shared/ui/index.ts'

import {
  usePlanejamentoList,
  FILTER_YEARS,
} from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import type {
  PlanRow,
  PlanAction,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import { useCreatePlan, IMPORT_YEARS } from '#modules/budget-plans/client/planejamento/create-plan.binding.ts'
import type { CreatePlanError } from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'
import {
  confirmSpecFor,
  type ConfirmableAction,
} from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'

import { PlanFilters } from '../components/plan-filters.component.tsx'
import { PlanTreeTable } from '../components/plan-tree-table.component.tsx'
import { PlanPaginator } from '../components/plan-paginator.component.tsx'
import { CreatePlanModal } from '../components/create-plan-modal.component.tsx'
import { ConfirmActionModal, PlanFeedbackToast } from '../components/confirm-action-modal.component.tsx'
import { screen, card, pageHead, pageIcon } from './planejamento-list.css.ts'

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

/** Nome de exibição de uma linha (busca recursiva na árvore de planos/versões). */
const findRowName = (rows: readonly PlanRow[], id: string): string | null => {
  for (const r of rows) {
    if (r.id === id) return r.displayName
    const inChild = findRowName(r.children, id)
    if (inChild !== null) return inChild
  }
  return null
}

type PendingConfirm = Readonly<{ action: ConfirmableAction; id: string; name: string }>

const TOAST_MS = 3500

export function PlanejamentoListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, programOptions, grandTotalLabel } = usePlanejamentoList(search)
  const [createOpen, setCreateOpen] = useState(false)
  const createPlan = useCreatePlan(programOptions, () => {
    setCreateOpen(false)
  })

  const closeCreate = (): void => {
    createPlan.reset()
    setCreateOpen(false)
  }

  // Confirmações do menu "…" + toast de sucesso (§2.5). Front-first: a execução real depende do #113.
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
  const [scenaryName, setScenaryName] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (toastMsg === null) return
    const handle = setTimeout(() => {
      setToastMsg(null)
    }, TOAST_MS)
    return () => {
      clearTimeout(handle)
    }
  }, [toastMsg])

  const onAction = (id: string, action: PlanAction): void => {
    const spec = confirmSpecFor(action)
    if (spec === null) return // outras ações (compartilhar, CSV, planejado×realizado) são outras telas
    if (spec.needsName) setScenaryName('')
    setConfirm({ action: spec.action, id, name: findRowName(state.rows, id) ?? '' })
  }

  const confirmSpec = confirm !== null ? confirmSpecFor(confirm.action) : null

  const runConfirm = (): void => {
    if (confirm === null) return
    setToastMsg(t(`budget-plans.confirm.${confirm.action}.success`))
    setConfirm(null)
  }

  const emptyLabel = state.filtered ? t('budget-plans.list.noResults') : t('budget-plans.list.empty')

  return (
    <div className={screen}>
      <div className={pageHead}>
        <span className={pageIcon} aria-hidden="true">
          <BarChartIcon size={24} />
        </span>
        <div className={headText}>
          <h1 className={headTitle}>{t('budget-plans.list.title')}</h1>
          <p className={headSubtitle}>{t('budget-plans.list.subtitle')}</p>
        </div>
      </div>

      <div className={card}>
        <PlanFilters
          value={{
            search: search.search ?? '',
            year: search.year !== undefined ? String(search.year) : '',
            program: search.program ?? '',
            status: search.status ?? '',
          }}
          years={FILTER_YEARS}
          programs={programOptions}
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
          grandTotalLabel={grandTotalLabel}
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
              params: { id },
            })
          }}
          onAction={onAction}
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
        programOptions={programOptions}
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

      <ConfirmActionModal
        open={confirm !== null}
        title={confirm !== null ? t(`budget-plans.confirm.${confirm.action}.title`) : ''}
        message={
          confirm !== null
            ? t(`budget-plans.confirm.${confirm.action}.body`).replace('{nome}', confirm.name)
            : ''
        }
        confirmLabel={confirm !== null ? t(`budget-plans.confirm.${confirm.action}.confirm`) : ''}
        cancelLabel={t('budget-plans.confirm.cancel')}
        danger={confirmSpec?.danger ?? false}
        nameField={
          confirmSpec?.needsName === true
            ? {
                label: t('budget-plans.confirm.create-scenery.nameLabel'),
                value: scenaryName,
                onChange: setScenaryName,
              }
            : undefined
        }
        onConfirm={runConfirm}
        onClose={() => {
          setConfirm(null)
        }}
      />

      <PlanFeedbackToast message={toastMsg} />
    </div>
  )
}
