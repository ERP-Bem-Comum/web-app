import { useNavigate, getRouteApi } from '@tanstack/react-router'
import { useState, useEffect, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, ChevronLeftIcon, type BadgeProps } from '#shared/ui/index.ts'
import {
  PLAN_ACTIONS,
  type StatusTone,
  type PlanAction,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import {
  confirmSpecFor,
  isActionEnabled,
  actionDisabledTitleKey,
  type ConfirmableAction,
} from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import { usePlanActions } from '#modules/budget-plans/client/planejamento/plan-actions.binding.ts'
import { PlanActionsMenu } from '#modules/budget-plans/client/planejamento/components/plan-actions-menu.component.tsx'
import {
  ConfirmActionModal,
  PlanFeedbackToast,
} from '#modules/budget-plans/client/planejamento/components/confirm-action-modal.component.tsx'

import { usePlanDetail } from '../plan-detail.binding.ts'
import { usePlanInsights } from '../plan-insights.binding.ts'
import { PlanInsightsModal } from '../components/plan-insights-modal.component.tsx'
import { ConsolidatedMatrix } from '../components/consolidated-matrix.component.tsx'
import { AddBudgetModal } from '../components/add-budget-modal.component.tsx'
import type { AddBudgetError } from '../add-budget.view-model.ts'
import { CentrosCustoModal } from '../components/centros-custo-modal.component.tsx'
import type { CentrosCustoErrorTag } from '../centros-custo.binding.ts'
import {
  screen,
  header,
  backButton,
  headText,
  headTitle,
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
  notFound,
} from './plan-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/planejamento_/detalhes/$id')

/** Rótulo i18n de cada ação do menu "…" no detalhe (espelha a lista). */
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

/** i18n key de cada tag de erro da escrita da estrutura (§V, exaustivo) — feature 061. */
const centroErrorKey = (tag: CentrosCustoErrorTag): string => {
  switch (tag) {
    case 'name-required':
      return 'budget-plans.centrosCusto.error.name-required'
    case 'missing-parent':
      return 'budget-plans.centrosCusto.error.missing-parent'
    case 'unauthorized':
      return 'budget-plans.centrosCusto.error.unauthorized'
    case 'invalid-input':
      return 'budget-plans.centrosCusto.error.invalid-input'
    case 'budget-plan-not-found':
      return 'budget-plans.centrosCusto.error.not-found'
    case 'budget-plan-not-editable':
      return 'budget-plans.centrosCusto.error.not-editable'
    case 'budget-plan-already-exists':
    case 'budget-plan-already-approved':
    case 'budget-plan-not-approved':
    case 'budget-plan-scenery-needs-draft':
    case 'budget-plan-invalid-transition':
    case 'unexpected':
      return 'budget-plans.centrosCusto.error.unexpected'
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}

const TOAST_MS = 3500
type PendingConfirm = Readonly<{ action: ConfirmableAction; id: string; name: string }>

const BADGE_VARIANT: Readonly<Record<StatusTone, BadgeProps['variant']>> = {
  neutral: 'outro',
  info: 'finished',
  success: 'active',
}

export function PlanDetailPage(): ReactNode {
  const params = routeApi.useParams()
  const navigate = useNavigate()
  const id = params.id
  const { state, view, setView, prevSemester, nextSemester, filter, addBudget, centrosCusto } =
    usePlanDetail(id)
  const insights = usePlanInsights(id)

  // Menu "…" do detalhe: confirmações + toast + mutations REAIS (mesmo binding da lista). As ações operam sobre
  // ESTE plano; o backend valida a transição de ciclo de vida (409 → mensagem PT). O filtro por Rede segue
  // desabilitado (GET /options 500 — core-api#394); só o passador de mês/semestre é client-side.
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
  const [scenaryName, setScenaryName] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const planActions = usePlanActions((outcome) => {
    if (outcome.ok) {
      const key =
        outcome.action === 'export-csv'
          ? 'budget-plans.action.exportCsv.success'
          : `budget-plans.confirm.${outcome.action}.success`
      setToastMsg(t(key))
      // Cenário criado é plano-FILHO (não some na lista de raízes) → navega pro detalhe do novo cenário.
      if (outcome.action === 'create-scenery' && outcome.sceneryId !== undefined) {
        void navigate({ to: '/planejamento/detalhes/$id', params: { id: outcome.sceneryId } })
      }
    } else {
      setToastMsg(t(outcome.errorTag))
    }
  })

  useEffect(() => {
    if (toastMsg === null) return
    const handle = setTimeout(() => {
      setToastMsg(null)
    }, TOAST_MS)
    return () => {
      clearTimeout(handle)
    }
  }, [toastMsg])

  const planTitle = state.status === 'ready' || state.status === 'empty' ? state.header.title : ''
  // Status CRU do plano corrente (quando carregado) — gateia as ações do menu por status (§V, regra da P.O.).
  const rawStatus = state.status === 'ready' || state.status === 'empty' ? state.header.rawStatus : undefined

  const onAction = (action: PlanAction): void => {
    if (!isActionEnabled(action, rawStatus)) return
    if (action === 'export-csv') {
      planActions.runAction('export-csv', id)
      return
    }
    const spec = confirmSpecFor(action)
    if (spec === null) return
    if (spec.needsName) setScenaryName('')
    setConfirm({ action: spec.action, id, name: planTitle })
  }

  const confirmSpec = confirm !== null ? confirmSpecFor(confirm.action) : null

  const runConfirm = (): void => {
    if (confirm === null) return
    planActions.runAction(confirm.action, confirm.id, scenaryName)
    setConfirm(null)
  }

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
          <ChevronLeftIcon size={20} />
        </button>
        <div className={headText}>
          <h1 className={headTitle}>{t('budget-plans.detail.pageTitle')}</h1>
          <span className={breadcrumb}>{t('budget-plans.detail.breadcrumb')}</span>
        </div>
      </div>

      {state.status === 'loading' && <p className={notFound}>{t('budget-plans.detail.loading')}</p>}
      {state.status === 'error' && <p className={notFound}>{t('budget-plans.detail.error')}</p>}
      {state.status === 'not-found' && <p className={notFound}>{t('budget-plans.detail.notFound')}</p>}

      {(state.status === 'ready' || state.status === 'empty') && (
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
            <div className={actionsRight}>
              <button type="button" className={secondaryButton} onClick={insights.openModal}>
                {t('budget-plans.detail.insights')}
              </button>
              <button type="button" className={secondaryButton} onClick={addBudget.openModal}>
                {t('budget-plans.detail.addBudget')}
              </button>
              {/* Menu "…" real: ações ligadas (approve/calibração/cenário/CSV); share/planejado×realizado/
                  excluir ficam desabilitados (sem endpoint). O backend valida a transição de ciclo de vida. */}
              <PlanActionsMenu
                actions={PLAN_ACTIONS}
                labelFor={(action) => t(actionKey(action))}
                triggerLabel={t('budget-plans.detail.moreActions')}
                isDisabled={(action) => !isActionEnabled(action, state.header.rawStatus)}
                disabledTitle={(action) => t(actionDisabledTitleKey(action, state.header.rawStatus))}
                pendingAction={planActions.pendingAction}
                onAction={onAction}
              />
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
                params: { id },
                search: { estado: filter.estado, municipio: filter.municipio },
              })
            }}
            onPrev={prevSemester}
            onNext={nextSemester}
            onSelectCentroCusto={centrosCusto.openModal}
            onSelectPorMes={() => {
              setView('month')
            }}
            onSelectPorRede={() => {
              setView('network')
            }}
          />
          {state.status === 'empty' && <p className={notFound}>{t('budget-plans.detail.empty')}</p>}
        </>
      )}

      <AddBudgetModal
        open={addBudget.open}
        estado={addBudget.form.estado}
        valor={addBudget.form.valor}
        options={addBudget.options}
        submitting={addBudget.submitting}
        errorTag={addBudget.errorTag}
        labels={{
          title: t('budget-plans.addBudget.title'),
          close: t('budget-plans.addBudget.close'),
          estado: t('budget-plans.addBudget.estado'),
          estadoPlaceholder: t('budget-plans.addBudget.estadoPlaceholder'),
          valor: t('budget-plans.addBudget.valor'),
          valorPlaceholder: t('budget-plans.addBudget.valorPlaceholder'),
          add: t('budget-plans.addBudget.add'),
          cancel: t('budget-plans.addBudget.cancel'),
        }}
        translateError={(tag: AddBudgetError) => t(`budget-plans.addBudget.error.${tag}`)}
        onClose={addBudget.close}
        onEstado={addBudget.setEstado}
        onValor={addBudget.setValor}
        onSubmit={addBudget.submit}
      />

      <CentrosCustoModal
        binding={centrosCusto}
        labels={{
          titlePrefix: t('budget-plans.centrosCusto.titlePrefix'),
          subtitle: t('budget-plans.centrosCusto.subtitle'),
          close: t('budget-plans.centrosCusto.close'),
          centro: t('budget-plans.centrosCusto.centro'),
          addCentro: t('budget-plans.centrosCusto.addCentro'),
          addCategoria: t('budget-plans.centrosCusto.addCategoria'),
          addSub: t('budget-plans.centrosCusto.addSub'),
          edit: t('budget-plans.centrosCusto.edit'),
          deactivate: t('budget-plans.centrosCusto.deactivate'),
          activate: t('budget-plans.centrosCusto.activate'),
          expand: t('budget-plans.centrosCusto.expand'),
          collapse: t('budget-plans.centrosCusto.collapse'),
          nome: t('budget-plans.centrosCusto.nome'),
          centroTipo: t('budget-plans.centrosCusto.centroTipo'),
          subTipo: t('budget-plans.centrosCusto.subTipo'),
          releaseType: t('budget-plans.centrosCusto.releaseType'),
          cancel: t('budget-plans.centrosCusto.cancel'),
          save: t('budget-plans.centrosCusto.save'),
          add: t('budget-plans.centrosCusto.add'),
          formTitle: {
            'add-centro': t('budget-plans.centrosCusto.form.add-centro'),
            'edit-centro': t('budget-plans.centrosCusto.form.edit-centro'),
            'add-categoria': t('budget-plans.centrosCusto.form.add-categoria'),
            'edit-categoria': t('budget-plans.centrosCusto.form.edit-categoria'),
            'add-sub': t('budget-plans.centrosCusto.form.add-sub'),
            'edit-sub': t('budget-plans.centrosCusto.form.edit-sub'),
          },
        }}
        centroTipoLabels={{
          'A PAGAR': t('budget-plans.centroTipo.a-pagar'),
          'A RECEBER': t('budget-plans.centroTipo.a-receber'),
        }}
        subTipoLabels={{
          INSTITUCIONAL: t('budget-plans.subTipo.institucional'),
          REDE: t('budget-plans.subTipo.rede'),
        }}
        releaseTypeLabels={{
          DESPESAS_PESSOAIS: t('budget-plans.releaseType.pessoal'),
          IPCA: t('budget-plans.releaseType.ipca'),
          CAED: t('budget-plans.releaseType.caed'),
          DESPESAS_LOGISTICAS: t('budget-plans.releaseType.logistica'),
        }}
        translateError={(tag) => t(centroErrorKey(tag))}
      />

      <PlanInsightsModal
        open={insights.open}
        state={insights.state}
        labels={{
          title: t('budget-plans.insights.title'),
          close: t('budget-plans.insights.close'),
          currentTotal: t('budget-plans.insights.currentTotal'),
          loading: t('budget-plans.insights.loading'),
          error: t('budget-plans.insights.error'),
          empty: t('budget-plans.insights.empty'),
        }}
        onClose={insights.close}
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
