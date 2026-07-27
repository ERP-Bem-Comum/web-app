/**
 * PosicaoPagamentosPage — tela do relatório "Posição de Pagamentos" (identidade "brand", full-bleed 28px).
 * Wrapper FINO: escolhe a fonte 'p' (Pagamentos → Fornecedor) e resolve os rótulos i18n; toda a composição
 * (cabeçalho → filtros → 4 KPIs → 2 gráficos → tabela) vive no `PosicaoReportView` COMPARTILHADO com a
 * "Posição de Recebimentos" (ZERO duplicação — só a fonte + os rótulos mudam).
 *
 * FILTROS (#588): a page guarda o UI-state de filtro (draft nos campos + aplicado que consulta). "Filtrar"
 * commita draft→aplicado → a query re-busca com os params (o BFF filtra no servidor). Mudar um campo NÃO
 * re-busca. A View é burra: recebe `options`/`values`/`onChange`/`onFiltrar` por prop (§XI). As opções reais
 * vêm de `usePosicaoFilterOptions` (cross-módulo via public-api, §I); Status é estático (enum #588 → i18n).
 */
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { CSV_HEADER } from '../posicao.view-model.ts'
import {
  usePosicaoPagamentos,
  type PosicaoReportFilters,
  type PosicaoReportStatus,
} from '../posicao.binding.ts'
import { usePosicaoFilterOptions } from '../posicao-filters.binding.ts'
import {
  PosicaoReportView,
  type PosicaoReportViewLabels,
  type PosicaoFiltersModel,
  type PosicaoFilterValues,
  type FilterOption,
} from '../components/posicao-report-view.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'

const t = createTranslator(ptBR)

// Draft vazio — todos os campos "" (= "Todos" / sem recorte); datas vazias.
const EMPTY_DRAFT: PosicaoFilterValues = {
  budgetPlanRef: '',
  cedenteAccountRef: '',
  status: '',
  costCenterRef: '',
  categoryRef: '',
  subcategoryRef: '',
  supplierRef: '',
  dueFrom: '',
  dueTo: '',
}

// Enum FECHADO de status filtrável (#588; sem Draft/Refused). `.find` narra p/ o literal sem cast.
const STATUS_VALUES: readonly PosicaoReportStatus[] = [
  'Open',
  'Approved',
  'Transmitted',
  'Paid',
  'PartiallyReconciled',
  'Reconciled',
]
const asStatus = (s: string): PosicaoReportStatus | undefined => STATUS_VALUES.find((x) => x === s)

/** Converte o draft (strings da UI) no filtro do endpoint: "" → undefined (sem recorte). */
function toFilter(d: PosicaoFilterValues): PosicaoReportFilters {
  const s = (x: string): string | undefined => (x === '' ? undefined : x)
  return {
    budgetPlanRef: s(d.budgetPlanRef),
    cedenteAccountRef: s(d.cedenteAccountRef),
    costCenterRef: s(d.costCenterRef),
    categoryRef: s(d.categoryRef),
    subcategoryRef: s(d.subcategoryRef),
    supplierRef: s(d.supplierRef),
    dueFrom: s(d.dueFrom),
    dueTo: s(d.dueTo),
    status: asStatus(d.status),
  }
}

export function PosicaoPagamentosPage(): ReactNode {
  // UI-state de filtro: DRAFT (edição nos campos) + APLICADO (o que a query consulta). "Filtrar" commita.
  const [draft, setDraft] = useState<PosicaoFilterValues>(EMPTY_DRAFT)
  const [applied, setApplied] = useState<PosicaoReportFilters>({})

  // Server-state REAL do core-api (#114/#588) com os filtros APLICADOS: loading | error | ready. O empty-state
  // honesto (dado real vazio) é resolvido DENTRO da PosicaoReportView a partir do `report` (0 nós / total 0).
  const state = usePosicaoPagamentos(applied)
  // Opções REAIS dos dropdowns (cross-módulo via public-api). Centro/Categoria/Subcategoria vêm da CASCATA da
  // árvore do PLANO selecionado (dirigida pelo draft) — não do catálogo flat. Status é estático (enum #588 →
  // i18n). Degradação → []. Os hooks rodam SEMPRE, antes dos early-returns (Rules of Hooks).
  const filterOpts = usePosicaoFilterOptions(draft.budgetPlanRef, draft.costCenterRef, draft.categoryRef)
  const statusOptions: readonly FilterOption[] = [
    { value: 'Open', label: t('reports.posicao.filters.statusOpt.open') },
    { value: 'Approved', label: t('reports.posicao.filters.statusOpt.approved') },
    { value: 'Transmitted', label: t('reports.posicao.filters.statusOpt.transmitted') },
    { value: 'Paid', label: t('reports.posicao.filters.statusOpt.paid') },
    { value: 'PartiallyReconciled', label: t('reports.posicao.filters.statusOpt.partiallyReconciled') },
    { value: 'Reconciled', label: t('reports.posicao.filters.statusOpt.reconciled') },
  ]

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.posicao.loading')} />
  }
  if (state.status === 'error') {
    return <ReportStatePanel role="alert" title={t('reports.posicao.errorTitle')} hint={t(state.errorTag)} />
  }

  const labels: PosicaoReportViewLabels = {
    back: t('reports.posicao.back'),
    title: t('reports.posicao.title'),
    filters: {
      title: t('reports.posicao.filters.title'),
      allOption: t('reports.posicao.filters.allOption'),
      plano: t('reports.posicao.filters.plano'),
      periodo: t('reports.posicao.filters.periodo'),
      periodoDe: t('reports.posicao.filters.periodoDe'),
      periodoAte: t('reports.posicao.filters.periodoAte'),
      conta: t('reports.posicao.filters.conta'),
      status: t('reports.posicao.filters.status'),
      centro: t('reports.posicao.filters.centro'),
      categoria: t('reports.posicao.filters.categoria'),
      subcategoria: t('reports.posicao.filters.subcategoria'),
      partner: t('reports.posicao.filters.fornecedor'),
      filtrar: t('reports.posicao.filters.filtrar'),
    },
    export: {
      label: t('reports.posicao.export.label'),
      csv: t('reports.posicao.export.csv'),
      pdf: t('reports.posicao.export.pdf'),
    },
    kpi: {
      atrasado: t('reports.posicao.kpi.atrasado'),
      pago: t('reports.posicao.kpi.pago'),
      aPagar: t('reports.posicao.kpi.aPagar'),
      total: t('reports.posicao.kpi.total'),
      atrasadoSub: t('reports.posicao.kpi.atrasadoSub'),
      pagoSub: t('reports.posicao.kpi.pagoSub'),
      aPagarSub: t('reports.posicao.kpi.aPagarSub'),
      totalSub: t('reports.posicao.kpi.totalSub'),
    },
    measure: {
      emAtraso: t('reports.posicao.measure.emAtraso'),
      pago: t('reports.posicao.measure.pago'),
      aPagar: t('reports.posicao.measure.aPagar'),
    },
    chart: {
      resumoTotal: t('reports.posicao.chart.resumoTotal'),
      distribuicao: t('reports.posicao.chart.distribuicaoFornecedor'),
      centerCaption: t('reports.posicao.chart.centerCaption'),
    },
    table: {
      title: t('reports.posicao.table.title'),
      nameCol: t('reports.posicao.columns.name'),
      totalRow: t('reports.posicao.totals.row'),
      expand: t('reports.posicao.tree.expand'),
      collapse: t('reports.posicao.tree.collapse'),
    },
    empty: t('reports.posicao.empty'),
    emptyHint: t('reports.posicao.empty'),
    chartEmptyLabel: t('reports.posicao.empty'),
  }

  const filtersModel: PosicaoFiltersModel = {
    options: {
      plano: filterOpts.plano,
      conta: filterOpts.conta,
      status: statusOptions,
      centro: filterOpts.centro,
      categoria: filterOpts.categoria,
      subcategoria: filterOpts.subcategoria,
      partner: filterOpts.partner,
    },
    values: draft,
    onChange: (patch) => {
      // Cascata: trocar um nível ZERA os dependentes (evita mandar ref órfão no apply — um centro/categoria
      // do plano anterior não existe no novo). Plano → limpa centro/categoria/subcategoria; centro → categoria/
      // subcategoria; categoria → subcategoria.
      setDraft((d) => {
        const next = { ...d, ...patch }
        if ('budgetPlanRef' in patch) {
          next.costCenterRef = ''
          next.categoryRef = ''
          next.subcategoryRef = ''
        }
        if ('costCenterRef' in patch) {
          next.categoryRef = ''
          next.subcategoryRef = ''
        }
        if ('categoryRef' in patch) {
          next.subcategoryRef = ''
        }
        return next
      })
    },
    onFiltrar: () => {
      setApplied(toFilter(draft))
    },
  }

  return (
    <PosicaoReportView
      report={state.report}
      labels={labels}
      csvFilename="posicao-pagamentos.csv"
      csvHeader={CSV_HEADER}
      filters={filtersModel}
    />
  )
}
