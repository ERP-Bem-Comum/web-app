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
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  useCostCenterOptionsFromPlan,
  useCategoryOptionsFromPlan,
  useSubcategoryOptionsFromPlan,
} from '#modules/financial/public-api/index.ts'

import { useAnalisePagamentos, wideDueWindow, type AnalisePagamentosQuery } from '../analise.binding.ts'
import { useAnaliseFilterOptions } from '../analise-filters.binding.ts'
import type { AnaliseSelection } from '../analise.view-model.ts'
import { buildFilterSummaryParts, formatDueRange, type FilterOption } from '../filters-summary.view-model.ts'
import {
  AnaliseReportView,
  type AnaliseReportViewLabels,
  type AnaliseCascadeModel,
  type AnalisePeriodModel,
} from '../components/analise-report-view.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'

const t = createTranslator(ptBR)

// Seleção da cascata de categorização (só p/ dirigir os dropdowns; o #446 não aplica esses filtros).
type CascadeSel = Readonly<{
  programa: string
  plano: string
  centro: string
  categoria: string
  subcategoria: string
}>
const EMPTY_SEL: CascadeSel = { programa: '', plano: '', centro: '', categoria: '', subcategoria: '' }

/**
 * Recorte APLICADO que não vai ao servidor (o #446 é `.strict()`): Programa/Plano/Centro de Custo. O grão da
 * resposta (Plano × CC × mês) já os carrega, então "Filtrar" commita isto e o binding recorta o dado baixado.
 * Categoria/Subcategoria/Conta ficam de fora — não existem na resposta (spec 051 tirou a categoria do grão).
 */
type ClientSel = Readonly<{ programa: string; plano: string; centro: string }>
const EMPTY_CLIENT_SEL: ClientSel = { programa: '', plano: '', centro: '' }

/**
 * Traduz o recorte da tela no `AnaliseSelection` do view-model. O **Programa** vira a lista de planos daquele
 * programa (`planoPrograma`); programa sem nenhum plano conhecido → lista VAZIA, que recorta tudo — é o
 * resultado honesto ("nada deste programa nesta janela"), não um filtro ignorado.
 */
function toSelection(sel: ClientSel, programByPlan: ReadonlyMap<string, string>): AnaliseSelection {
  const planIds =
    sel.programa === ''
      ? undefined
      : [...programByPlan].filter(([, prog]) => prog === sel.programa).map(([id]) => id)
  return {
    planIds,
    planId: sel.plano === '' ? undefined : sel.plano,
    costCenterId: sel.centro === '' ? undefined : sel.centro,
  }
}

// Draft do Período (De/Até em `YYYY-MM-DD`; `dueTo` EXCLUSIVO no backend). Vazio → sem recorte (defaultRange).
type PeriodDraft = Readonly<{ dueFrom: string; dueTo: string }>
const EMPTY_PERIOD: PeriodDraft = { dueFrom: '', dueTo: '' }

// Status APLICÁVEL do #446 = `fin_payable_view.status` (enum REDUZIDO: Open/Approved/Paid). ⚠️ NÃO usar os chips
// do CAP: Rascunho/Transmitido/Conciliado são status do DOCUMENTO (não da payable-view) → filtrar por eles =
// vazio silencioso. Cancelled fica fora do relatório. O `value` enviado ao backend é o ENUM, não o rótulo.

/**
 * Converte o draft (período + status) no query do #446. Período com AMBAS as datas → recorta; senão usa a janela
 * ampla default (o #446 exige dueStart/dueEnd). Status '' → undefined. Nada aplicado (sem datas e sem status) →
 * `undefined` (o binding cai na default sem status). Assim o STATUS pode aplicar mesmo sem o usuário escolher datas.
 */
function toQuery(period: PeriodDraft, status: string): AnalisePagamentosQuery | undefined {
  const s = status === '' ? undefined : status
  const hasPeriod = period.dueFrom !== '' && period.dueTo !== ''
  if (!hasPeriod && s === undefined) return undefined
  const base = hasPeriod ? { dueStart: period.dueFrom, dueEnd: period.dueTo } : wideDueWindow()
  return { ...base, status: s }
}

export function AnalisePagamentosPage(): ReactNode {
  // UI-state dos filtros aplicáveis: DRAFT (edição) + APLICADO. `applied` = o query (com a janela default quando
  // o usuário não escolhe datas). `appliedView` = o que o usuário DE FATO aplicou (p/ o subtítulo — não mostra a
  // janela default como se fosse um período escolhido). "Filtrar" commita ambos.
  const [periodDraft, setPeriodDraft] = useState<PeriodDraft>(EMPTY_PERIOD)
  const [statusDraft, setStatusDraft] = useState<string>('')
  const [applied, setApplied] = useState<AnalisePagamentosQuery | undefined>(undefined)
  const [appliedView, setAppliedView] = useState<PeriodDraft & { status: string }>({
    dueFrom: '',
    dueTo: '',
    status: '',
  })

  // Opções dos dropdowns. Plano carrega `value=id` — dirige a cascata E o recorte; `planoPrograma` traduz o
  // Programa em planos.
  const filterOpts = useAnaliseFilterOptions()
  // Recorte client-side APLICADO (Programa/Plano/Centro). Memoizado: referência estável → o binding não
  // recomputa a matriz a cada render.
  const [appliedSel, setAppliedSel] = useState<ClientSel>(EMPTY_CLIENT_SEL)
  const selection = useMemo(
    () => toSelection(appliedSel, filterOpts.planoPrograma),
    [appliedSel, filterOpts.planoPrograma],
  )
  // Server-state REAL do core-api (#446) com o período APLICADO: loading | error | ready. Sem período aplicado
  // → o binding usa a janela ampla default. O empty-state honesto (resposta vazia) é resolvido na View.
  const state = useAnalisePagamentos(applied, selection)
  // Cascata de categorização (ADR-0051): Centro/Categoria/Subcategoria vêm da ÁRVORE do plano selecionado, não
  // do catálogo flat. Hooks SEMPRE antes dos early-returns (Rules of Hooks).
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
      periodoDe: t('reports.analise.filters.periodoDe'),
      periodoAte: t('reports.analise.filters.periodoAte'),
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

  // Programa: CONTROLADO e aplicável. Opções do endpoint de Programas (rótulo = sigla/nome), que é a MESMA
  // derivação do `planoPrograma` — por isso o value pode ser o próprio rótulo.
  const programaOptions: readonly FilterOption[] = filterOpts.programa.map((p) => ({ value: p, label: p }))
  const programaFilter = {
    options: programaOptions,
    value: sel.programa,
    onChange: (v: string): void => {
      // Trocar o Programa zera a cascata inteira (o plano anterior pode não ser deste programa).
      setSel({ programa: v, plano: '', centro: '', categoria: '', subcategoria: '' })
    },
  }

  // Programa escolhido ESTREITA a lista de Planos (só os daquele programa) — o mesmo mapa que recorta o dado.
  const planoOptions =
    sel.programa === ''
      ? filterOpts.plano
      : filterOpts.plano.filter((o) => filterOpts.planoPrograma.get(o.value) === sel.programa)

  // Cascata controlada: trocar um nível ZERA os dependentes (evita seleção órfã do plano anterior).
  const cascade: AnaliseCascadeModel = {
    plano: {
      options: planoOptions,
      value: sel.plano,
      onChange: (v) => {
        setSel((s) => ({ ...s, plano: v, centro: '', categoria: '', subcategoria: '' }))
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

  // Opções de Status (enum REDUZIDO do #446). value = ENUM (o que vai pro backend); label = rótulo PT (reusa os
  // chips do CAP p/ o texto). A opção "Todos" (value '') é o placeholder do ControlledFilterField.
  const statusOptions: readonly FilterOption[] = [
    { value: 'Open', label: t('financial.list.chip.aberto') },
    { value: 'Approved', label: t('financial.list.chip.aprovado') },
    { value: 'Paid', label: t('financial.list.chip.pago') },
  ]

  // Resumo dos filtros APLICADOS (subtítulo) — do que o usuário DE FATO aplicou, não do query interno. Cobre os
  // 5 que filtram o resultado: Período e Status no servidor (#446), Programa/Plano/Centro no cliente. Vazios são
  // pulados; nada aplicado → sem linha. Status e Plano resolvem value→label (Open→Aberto; id→"2026 ABC 1.0").
  const subtitleParts = buildFilterSummaryParts([
    {
      label: labels.filters.periodo,
      value: formatDueRange(appliedView.dueFrom, appliedView.dueTo, {
        fromPrefix: t('reports.filters.summary.fromPrefix'),
        toPrefix: t('reports.filters.summary.toPrefix'),
      }),
    },
    { label: labels.filters.status, value: appliedView.status, options: statusOptions },
    { label: labels.filters.programa, value: appliedSel.programa, options: programaOptions },
    { label: labels.filters.plano, value: appliedSel.plano, options: filterOpts.plano },
    { label: labels.filters.centro, value: appliedSel.centro, options: centroOptions },
  ])

  // "Filtrar" commita TUDO de uma vez: Período/Status viram query (refetch) e Programa/Plano/Centro viram o
  // recorte client-side. Mudar um campo só edita o draft — a tela não se mexe antes do clique (§XI).
  const aplicar = (): void => {
    setApplied(toQuery(periodDraft, statusDraft))
    setAppliedView({ dueFrom: periodDraft.dueFrom, dueTo: periodDraft.dueTo, status: statusDraft })
    setAppliedSel({ programa: sel.programa, plano: sel.plano, centro: sel.centro })
  }
  const period: AnalisePeriodModel = {
    dueFrom: periodDraft.dueFrom,
    dueTo: periodDraft.dueTo,
    onChange: (patch) => {
      setPeriodDraft((d) => ({ ...d, ...patch }))
    },
    onFiltrar: aplicar,
  }
  const statusFilter = {
    options: statusOptions,
    value: statusDraft,
    onChange: (v: string) => {
      setStatusDraft(v)
    },
  }

  return (
    <AnaliseReportView
      report={state.report}
      labels={labels}
      csvFilename="analise-pagamentos.csv"
      filterOptions={{ programa: filterOpts.programa, conta: filterOpts.conta }}
      cascade={cascade}
      period={period}
      statusFilter={statusFilter}
      programaFilter={programaFilter}
      subtitleParts={subtitleParts}
    />
  )
}
