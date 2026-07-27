/**
 * AnalisePagamentosPage — tela do relatório "Análise de Pagamentos" (identidade "brand", full-bleed 28px).
 * Wrapper FINO: escolhe a fonte 'p' (Pagamentos) via `loadAnalise('p')` e resolve os rótulos i18n do lado de
 * PAGAR; toda a composição (cabeçalho → filtros → 2 gráficos → tabela-matriz + empty state) vive no
 * `AnaliseReportView` COMPARTILHADO (ZERO duplicação — só a fonte, os rótulos e o tom mudam). ADR-0009/0012,§XI.
 *
 * Matriz TEMPO-orçamentária: árvore Plano Orçamentário → Centro de Custo × série MENSAL de valores. Dado REAL
 * do core-api (#446 · GET /reports/analysis/payables) via `useAnalisePagamentos`: loading | error | ready. Os
 * meses visíveis vêm do MIN..MAX real da resposta; os rótulos de mês (eixo/tabela/CSV) vêm PRONTOS e VÁLIDOS da
 * ViewModel (`formatMonthLabel`, por ÍNDICE) — NUNCA "Invalid Date" (bug do relatório legado que não reproduzimos).
 */
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  useCostCenterOptionsFromPlan,
  useCategoryOptionsFromPlan,
  useSubcategoryOptionsFromPlan,
} from '#modules/financial/public-api/index.ts'

import { useAnalisePagamentos } from '../analise.binding.ts'
import { useAnaliseFilterOptions } from '../analise-filters.binding.ts'
import {
  AnaliseReportView,
  type AnaliseReportViewLabels,
  type AnaliseCascadeModel,
} from '../components/analise-report-view.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'

const t = createTranslator(ptBR)

// Seleção da cascata de categorização (só p/ dirigir os dropdowns; o #446 não aplica esses filtros).
type CascadeSel = Readonly<{ plano: string; centro: string; categoria: string; subcategoria: string }>
const EMPTY_SEL: CascadeSel = { plano: '', centro: '', categoria: '', subcategoria: '' }

export function AnalisePagamentosPage(): ReactNode {
  // Server-state REAL do core-api (#446): loading | error | ready. O empty-state honesto (resposta vazia) é
  // resolvido DENTRO da AnaliseReportView a partir do `report` (0 planos / months []).
  const state = useAnalisePagamentos()
  // Opções populate-only (Programa/Plano/Conta). Plano carrega `value=id` — DIRIGE a cascata abaixo.
  const filterOpts = useAnaliseFilterOptions()
  // Cascata de categorização (ADR-0051): Centro/Categoria/Subcategoria vêm da ÁRVORE do plano selecionado, não
  // do catálogo flat. Só reflete o plano (o #446 não aplica). Hooks SEMPRE antes dos early-returns (Rules of Hooks).
  const [sel, setSel] = useState<CascadeSel>(EMPTY_SEL)
  const centroOptions = useCostCenterOptionsFromPlan(sel.plano)
  const categoriaOptions = useCategoryOptionsFromPlan(sel.plano, sel.centro)
  const subcategoriaOptions = useSubcategoryOptionsFromPlan(sel.plano, sel.categoria)

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.analise.loading')} />
  }
  if (state.status === 'error') {
    return <ReportStatePanel role="alert" title={t('reports.analise.errorTitle')} hint={t(state.errorTag)} />
  }

  const labels: AnaliseReportViewLabels = {
    back: t('reports.analise.back'),
    title: t('reports.analise.title'),
    filters: {
      title: t('reports.analise.filters.title'),
      allOption: t('reports.analise.filters.allOption'),
      programa: t('reports.analise.filters.programa'),
      plano: t('reports.analise.filters.plano'),
      periodo: t('reports.analise.filters.periodo'),
      conta: t('reports.analise.filters.conta'),
      status: t('reports.analise.filters.status'),
      centro: t('reports.analise.filters.centro'),
      categoria: t('reports.analise.filters.categoria'),
      subcategoria: t('reports.analise.filters.subcategoria'),
      filtrar: t('reports.analise.filters.filtrar'),
      // Status alinhados ao Contas a Pagar (reusa os rótulos dos chips do CAP).
      statusChips: [
        t('financial.list.chip.rascunho'),
        t('financial.list.chip.aberto'),
        t('financial.list.chip.aprovado'),
        t('financial.list.chip.pago'),
        t('financial.list.chip.conciliado'),
      ],
    },
    export: {
      label: t('reports.analise.export.label'),
      csv: t('reports.analise.export.csv'),
      pdf: t('reports.analise.export.pdf'),
    },
    charts: {
      byCostCenter: t('reports.analise.charts.byCostCenter'),
      monthly: t('reports.analise.charts.monthly'),
    },
    chartEmptyLabel: t('reports.analise.empty'),
    table: {
      cardTitle: t('reports.analise.table.title'),
      nameCol: t('reports.analise.columns.name'),
      totalCol: t('reports.analise.columns.total'),
      totalRow: t('reports.analise.totals.row'),
      expand: t('reports.analise.tree.expand'),
      collapse: t('reports.analise.tree.collapse'),
      prevMonths: t('reports.analise.pager.prev'),
      nextMonths: t('reports.analise.pager.next'),
    },
    empty: t('reports.analise.empty'),
    emptyHint: t('reports.analise.emptyHint'),
  }

  // Cascata controlada: trocar um nível ZERA os dependentes (evita seleção órfã do plano anterior).
  const cascade: AnaliseCascadeModel = {
    plano: {
      options: filterOpts.plano,
      value: sel.plano,
      onChange: (v) => {
        setSel({ plano: v, centro: '', categoria: '', subcategoria: '' })
      },
    },
    centro: {
      options: centroOptions,
      value: sel.centro,
      onChange: (v) => {
        setSel((s) => ({ ...s, centro: v, categoria: '', subcategoria: '' }))
      },
    },
    categoria: {
      options: categoriaOptions,
      value: sel.categoria,
      onChange: (v) => {
        setSel((s) => ({ ...s, categoria: v, subcategoria: '' }))
      },
    },
    subcategoria: {
      options: subcategoriaOptions,
      value: sel.subcategoria,
      onChange: (v) => {
        setSel((s) => ({ ...s, subcategoria: v }))
      },
    },
  }

  return (
    <AnaliseReportView
      report={state.report}
      labels={labels}
      csvFilename="analise-pagamentos.csv"
      filterOptions={{ programa: filterOpts.programa, conta: filterOpts.conta }}
      cascade={cascade}
    />
  )
}
