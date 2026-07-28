/**
 * PosicaoReportView — CORPO compartilhado dos relatórios de "Posição" (Pagamentos 'p' e Recebimentos 'r').
 * View de composição BURRA: recebe o relatório JÁ AGREGADO (ViewModel pura `loadPosicao(type)`) + TODOS os
 * rótulos por props (i18n resolvido nas pages) e monta cabeçalho → filtros recolhíveis → 4 KPIs → 2 gráficos →
 * tabela hierárquica. NÃO deriva domínio nem toca a `data/`; o único UI-state local é o toggle dos filtros
 * (a expansão da árvore é UI-state da própria PosicaoTreeTable). As pages 'p'/'r' são wrappers finos que só
 * escolhem a fonte e os rótulos — ZERO duplicação de composição (ADR-0009, §XI).
 *
 * ── EMPTY STATE HONESTO ── quando o relatório vem VAZIO (0 nós / total 0), renderiza SÓ o cabeçalho + um
 * painel único com a mensagem (`labels.empty`) — sem KPIs/gráficos/tabela quebrados. É o caminho para o qual
 * a Posição de Recebimentos cai quando o placeholder for removido (fonte retorna `[]`).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { screen, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  buildCsv,
  supplierTotals,
  measureTotal,
  formatBRL,
  formatBRLShort,
  formatPercent,
  sharePercent,
  type PosicaoReport,
} from '../posicao.view-model.ts'
import { ReportExportDropdown } from './report-export-dropdown.component.tsx'
import { exportTrigger } from './report-filters.css.ts'
import { PosicaoKpis } from './posicao-kpis.component.tsx'
import { RealizadoCostCenterBars, type CostCenterBar } from './realizado-cost-center-bars.component.tsx'
import { RealizadoDonut, type DonutSlice } from './realizado-donut.component.tsx'
import { RealizadoChartsMount } from './realizado-charts-mount.component.tsx'
import { PosicaoTreeTable } from './posicao-tree-table.component.tsx'
import {
  head,
  backButton,
  headTitle,
  headTitleBlock,
  tools,
  filterToggle,
  filters,
  filtersInner,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  applyButton,
  periodRow,
  dateInput,
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
  charts2,
  card,
  emptyPanel,
  emptyTitle,
  emptyHint,
} from '../page/posicao-pagamentos.page.css.ts'

/** Todos os rótulos i18n do relatório, resolvidos na page (Pagamentos vs Recebimentos). */
export type PosicaoReportViewLabels = Readonly<{
  back: string
  title: string
  filters: Readonly<{
    title: string
    allOption: string
    plano: string
    periodo: string
    /** Rótulo do input de data inicial (janela de vencimento). */
    periodoDe: string
    /** Rótulo do input de data final (EXCLUSIVO no backend). */
    periodoAte: string
    conta: string
    status: string
    centro: string
    categoria: string
    subcategoria: string
    /** Fornecedor (Pagamentos) | Financiador (Recebimentos). */
    partner: string
    filtrar: string
  }>
  export: Readonly<{ label: string; csv: string; pdf: string }>
  kpi: Readonly<{
    atrasado: string
    pago: string
    aPagar: string
    total: string
    atrasadoSub: string
    pagoSub: string
    aPagarSub: string
    totalSub: string
  }>
  measure: Readonly<{ emAtraso: string; pago: string; aPagar: string }>
  chart: Readonly<{ resumoTotal: string; distribuicao: string; centerCaption: string }>
  table: Readonly<{ title: string; nameCol: string; totalRow: string; expand: string; collapse: string }>
  /** Mensagem do empty state honesto (relatório vazio). */
  empty: string
  /** Complemento (2ª linha) do empty state. */
  emptyHint: string
  /** Fallback interno dos gráficos (donut/barras) quando SEM fatias — só no caminho não-vazio. */
  chartEmptyLabel: string
}>

export type PosicaoReportViewProps = Readonly<{
  report: PosicaoReport
  labels: PosicaoReportViewLabels
  /** Nome do arquivo CSV baixado (ex.: "posicao-recebimentos.csv"). */
  csvFilename: string
  /** Header pt-BR do CSV (Pagamentos vs Recebimentos). */
  csvHeader: string
  /** Cor dos gráficos (donut + barras): `'pag'` (padrão) ou `'rec'` (paleta distinta da Posição de Recebimentos). */
  chartTone?: 'pag' | 'rec'
  /**
   * Filtros CONTROLADOS (Pagamentos, #588): opções REAIS + valores DRAFT + callbacks. A view segue burra (§XI)
   * — recebe `values`/`onChange`/`onFiltrar` por prop e não guarda estado de filtro (só o toggle abrir/fechar).
   * Ausente (Recebimentos, sem endpoint) → filtros INERTES (só "Todos"/datas vazias, "Filtrar" sem efeito).
   */
  filters?: PosicaoFiltersModel
  /**
   * Resumo dos filtros APLICADOS (partes já formatadas "Rótulo: valor"), renderizado abaixo do título quando os
   * filtros estão recolhidos. A view só junta com " · ". Vazio/ausente → não renderiza a linha.
   */
  subtitleParts?: readonly string[]
}>

/** Opção de dropdown (o `value` é o ref/enum que o backend aplica; `label` é o texto exibido). */
export type FilterOption = Readonly<{ value: string; label: string }>

/** Opções REAIS por dropdown de filtro (sem o "Todos" — a view injeta o placeholder value=''). */
export type PosicaoFilterFieldOptions = Readonly<{
  plano: readonly FilterOption[]
  conta: readonly FilterOption[]
  status: readonly FilterOption[]
  centro: readonly FilterOption[]
  categoria: readonly FilterOption[]
  subcategoria: readonly FilterOption[]
  partner: readonly FilterOption[]
}>

/** Valores DRAFT dos filtros (string vazia = sem recorte / "Todos"; datas em `YYYY-MM-DD`). */
export type PosicaoFilterValues = Readonly<{
  budgetPlanRef: string
  cedenteAccountRef: string
  status: string
  costCenterRef: string
  categoryRef: string
  subcategoryRef: string
  supplierRef: string
  dueFrom: string
  dueTo: string
}>

/** Contrato de filtros controlados que a page passa à view. */
export type PosicaoFiltersModel = Readonly<{
  options: PosicaoFilterFieldOptions
  values: PosicaoFilterValues
  onChange: (patch: Partial<PosicaoFilterValues>) => void
  onFiltrar: () => void
}>

/** Baixa o CSV via Blob + anchor (client-side; o backend entregará JSON depois). */
function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function PosicaoReportView(props: PosicaoReportViewProps): ReactNode {
  const { report, labels: L, csvFilename, csvHeader } = props
  const isRec = props.chartTone === 'rec'
  // Filtros controlados (Pagamentos) — ausentes em Recebimentos (inertes). `v(...)` lê o valor draft; `opt(...)`
  // pega as opções reais. Sem `filters`, valores caem em '' e as opções em [] (só o placeholder "Todos").
  const fx = props.filters
  const v = (key: keyof PosicaoFilterValues): string => fx?.values[key] ?? ''
  const opt = (key: keyof PosicaoFilterFieldOptions): readonly FilterOption[] => fx?.options[key] ?? []
  const setF =
    (key: keyof PosicaoFilterValues) =>
    (value: string): void =>
      fx?.onChange({ [key]: value })
  // ÚNICO UI-state local: filtros abertos/fechados.
  const [filtersOpen, setFiltersOpen] = useState(false)

  const totals = report.totals
  const grandTotal = measureTotal(totals)
  // Empty state honesto: sem raízes OU total zero → nada a exibir (a fonte veio vazia/zerada).
  const isEmpty = report.suppliers.length === 0 || grandTotal === 0
  // FILTRÁVEL = recebe os controles de filtro (Pagamentos). Quando filtrável, o botão "Filtros" + a barra
  // seguem ACESSÍVEIS mesmo no vazio, p/ o usuário afrouxar/limpar o filtro e sair do empty-state (não fica
  // preso). Recebimentos (sem `filters`) mantém o empty-state bare. Não-vazio mantém os controles como hoje.
  const filterable = fx !== undefined
  const showFilterControls = !isEmpty || filterable

  // Donut "Resumo total" — 3 fatias na ordem A pagar/receber → Pago/Recebido → Em atraso.
  const donutSlices: readonly DonutSlice[] = useMemo(
    () => [
      {
        id: 'aPagar',
        label: L.measure.aPagar,
        valueCents: totals.aPagarCents,
        measureKey: isRec ? 'aReceber' : 'aPagar',
      },
      {
        id: 'pago',
        label: L.measure.pago,
        valueCents: totals.pagoCents,
        measureKey: isRec ? 'recebido' : 'pago',
      },
      {
        id: 'emAtraso',
        label: L.measure.emAtraso,
        valueCents: totals.emAtrasoCents,
        measureKey: isRec ? 'emAtrasoRec' : 'emAtraso',
      },
    ],
    [
      isRec,
      L.measure.aPagar,
      L.measure.pago,
      L.measure.emAtraso,
      totals.aPagarCents,
      totals.pagoCents,
      totals.emAtrasoCents,
    ],
  )

  // Barras "Distribuição por Fornecedor/Financiador" — total por raiz (desc); largura = % do total geral.
  const partnerBars: readonly CostCenterBar[] = useMemo(
    () =>
      supplierTotals(report).map((s): CostCenterBar => {
        const share = sharePercent(s.valueCents, grandTotal)
        return {
          id: s.id,
          label: s.name,
          sharePct: share,
          high: false,
          percentLabel: formatPercent(share),
          valueTitle: formatBRL(s.valueCents),
        }
      }),
    [report, grandTotal],
  )

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título (+ Filtros/Exportar só quando há dados) */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={L.back}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className={headTitleBlock}>
          <h1 className={headTitle}>{L.title}</h1>
          {props.subtitleParts !== undefined && props.subtitleParts.length > 0 && (
            <p className={headSubtitle}>{props.subtitleParts.join(' · ')}</p>
          )}
        </div>
        {/* Filtros: toggle sempre que houver controles (mesmo vazio → não prende o usuário). Exportar só com dados. */}
        {showFilterControls && (
          <div className={tools}>
            <button
              type="button"
              className={filterToggle}
              aria-pressed={filtersOpen}
              onClick={() => {
                setFiltersOpen((v) => !v)
              }}
            >
              <FilterIcon size={16} />
              {L.filters.title}
            </button>
            {!isEmpty && (
              <ReportExportDropdown
                triggerClassName={exportTrigger}
                exportLabel={L.export.label}
                csvLabel={L.export.csv}
                pdfLabel={L.export.pdf}
                onExportCsv={() => {
                  downloadCsv(csvFilename, buildCsv(report, csvHeader))
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Barra de filtros recolhível — ACESSÍVEL mesmo no vazio quando filtrável (o usuário reabre e afrouxa). */}
      {showFilterControls && (
        <div className={filtersOpen ? filters.open : filters.closed}>
          {/* Filtros CONTROLADOS (#588): draft nos campos; "Filtrar" aplica (a page commita draft→aplicado). */}
          <div className={filtersInner}>
            <FilterField
              label={L.filters.plano}
              placeholder={L.filters.allOption}
              options={opt('plano')}
              value={v('budgetPlanRef')}
              onChange={setF('budgetPlanRef')}
            />
            {/* Período = DOIS inputs de data (De / Até); `Até` é EXCLUSIVO no backend. */}
            <div className={fld}>
              <label className={fldLabel}>{L.filters.periodo}</label>
              <div className={periodRow}>
                <input
                  type="date"
                  className={dateInput}
                  aria-label={L.filters.periodoDe}
                  value={v('dueFrom')}
                  onChange={(e) => {
                    setF('dueFrom')(e.target.value)
                  }}
                />
                <input
                  type="date"
                  className={dateInput}
                  aria-label={L.filters.periodoAte}
                  value={v('dueTo')}
                  onChange={(e) => {
                    setF('dueTo')(e.target.value)
                  }}
                />
              </div>
            </div>
            <FilterField
              label={L.filters.conta}
              placeholder={L.filters.allOption}
              options={opt('conta')}
              value={v('cedenteAccountRef')}
              onChange={setF('cedenteAccountRef')}
            />
            <FilterField
              label={L.filters.status}
              placeholder={L.filters.allOption}
              options={opt('status')}
              value={v('status')}
              onChange={setF('status')}
            />
            <FilterField
              label={L.filters.centro}
              placeholder={L.filters.allOption}
              options={opt('centro')}
              value={v('costCenterRef')}
              onChange={setF('costCenterRef')}
            />
            <FilterField
              label={L.filters.categoria}
              placeholder={L.filters.allOption}
              options={opt('categoria')}
              value={v('categoryRef')}
              onChange={setF('categoryRef')}
            />
            <FilterField
              label={L.filters.subcategoria}
              placeholder={L.filters.allOption}
              options={opt('subcategoria')}
              value={v('subcategoryRef')}
              onChange={setF('subcategoryRef')}
            />
            <FilterField
              label={L.filters.partner}
              placeholder={L.filters.allOption}
              options={opt('partner')}
              value={v('supplierRef')}
              onChange={setF('supplierRef')}
            />
            <button
              type="button"
              className={applyButton}
              onClick={() => {
                fx?.onFiltrar()
              }}
            >
              {L.filters.filtrar}
            </button>
          </div>
        </div>
      )}

      {isEmpty ? (
        // Empty state HONESTO: um cartão único, sem KPIs/gráficos/tabela (mas os filtros acima seguem acessíveis).
        <div className={card}>
          <div className={emptyPanel}>
            <p className={emptyTitle}>{L.empty}</p>
            <p className={emptyHint}>{L.emptyHint}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 4 KPIs (Atrasado / Pago-Recebido / A pagar-A receber / Total) */}
          <PosicaoKpis
            atrasadoValue={formatBRL(totals.emAtrasoCents)}
            pagoValue={formatBRL(totals.pagoCents)}
            aPagarValue={formatBRL(totals.aPagarCents)}
            totalValue={formatBRL(grandTotal)}
            labels={{
              atrasado: L.kpi.atrasado,
              pago: L.kpi.pago,
              aPagar: L.kpi.aPagar,
              total: L.kpi.total,
              atrasadoSub: L.kpi.atrasadoSub,
              pagoSub: L.kpi.pagoSub,
              aPagarSub: L.kpi.aPagarSub,
              totalSub: L.kpi.totalSub,
            }}
          />

          {/* 2 gráficos (animação de entrada gerida pelo mount wrapper) */}
          <RealizadoChartsMount>
            {(animate) => (
              <div className={charts2}>
                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.chart.resumoTotal}</h2>
                  </div>
                  <div className={chartPad}>
                    <RealizadoDonut
                      slices={donutSlices}
                      centerValue={formatBRLShort(grandTotal)}
                      centerCaption={L.chart.centerCaption}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      formatValue={formatBRLShort}
                      formatPercent={formatPercent}
                    />
                  </div>
                </div>

                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.chart.distribuicao}</h2>
                  </div>
                  <div className={chartPad}>
                    <RealizadoCostCenterBars
                      bars={partnerBars}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      fillTone={isRec ? 'rec' : undefined}
                    />
                  </div>
                </div>
              </div>
            )}
          </RealizadoChartsMount>

          {/* Tabela hierárquica (raiz → CC → Categoria) + Total Geral */}
          <PosicaoTreeTable
            report={report}
            labels={{
              cardTitle: L.table.title,
              nameCol: L.table.nameCol,
              measureLabels: {
                emAtrasoCents: L.measure.emAtraso,
                pagoCents: L.measure.pago,
                aPagarCents: L.measure.aPagar,
              },
              totalRow: L.table.totalRow,
              expand: L.table.expand,
              collapse: L.table.collapse,
            }}
          />
        </>
      )}
    </div>
  )
}

/**
 * Campo de filtro (select nativo CONTROLADO, estilo brand). `placeholder` → opção vazia (value '') = "Todos"
 * = sem recorte. Espelha o FilterField do "Realizado × Planejado".
 */
function FilterField({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  options: readonly FilterOption[]
  value: string
  onChange: (v: string) => void
}): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select
          className={fldSelect}
          aria-label={label}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={fldChev}>
          <ChevronDownIcon size={16} />
        </span>
      </div>
    </div>
  )
}
