/**
 * EquipePage — tela do relatório "Equipe ABC" (identidade "brand", full-bleed 28px), no MESMO padrão do
 * relatório "Realizado × Planejado" (filtros recolhíveis → gráficos → tabela). Front-first: os dados vêm de
 * constantes placeholder SINTÉTICAS (LGPD — ver `equipe.placeholder.ts`); o endpoint do core-api (#114/#112)
 * ainda não existe. A ViewModel PURA faz TODA a agregação dos 5 gráficos; a page só compõe as views burras e
 * guarda o ÚNICO UI-state local: o toggle dos filtros. Export = CSV enxuto (Blob), sem PDF.
 *
 * Os filtros (busca + selects) são PLACEHOLDERS visuais (front-first) — não filtram nada ainda.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon, DownloadIcon } from '#shared/ui/index.ts'

import {
  total as computeTotal,
  byAnoContrato,
  byFuncao,
  teamFilterOptions,
  applyTeamFilters,
  EMPTY_TEAM_FILTERS,
  buildCsv,
  formatSharePercent,
  totalPages,
  pageSlice,
  PER_PAGE_DEFAULT,
  ANOS,
  type TeamMemberRow,
  type TeamFilters,
} from '../equipe.view-model.ts'
import { buildFilterSummaryParts } from '../filters-summary.view-model.ts'
import { useEquipe, useEquipeDemographics } from '../equipe.binding.ts'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { EquipeGeneroDonut } from '../components/equipe-genero-donut.component.tsx'
import { EquipeVerticalBars } from '../components/equipe-vertical-bars.component.tsx'
import { EquipeHorizontalBars } from '../components/equipe-horizontal-bars.component.tsx'
import { EquipeLineChart } from '../components/equipe-line-chart.component.tsx'
import { EquipeTable } from '../components/equipe-table.component.tsx'
import { EquipeDetailModal } from '../components/equipe-detail-modal.component.tsx'
import {
  head,
  backButton,
  headTitle,
  tools,
  filterToggle,
  exportButton,
  filters,
  filtersInner,
  searchRow,
  searchInput,
  fieldsGrid,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  filtersActions,
  applyButton,
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
  charts2,
  charts3,
} from './equipe.page.css.ts'
// Pele do bloco título+subtítulo (resumo dos filtros aplicados) — compartilhada com as outras telas.
import { headTitleBlock } from './posicao-pagamentos.page.css.ts'

const t = createTranslator(ptBR)

/** Linhas vazias enquanto a query carrega/falha (mantém a ordem dos hooks estável — §XI). */
const EMPTY_ROWS: readonly TeamMemberRow[] = []

/**
 * Dataset VAZIO dos 3 gráficos demográficos (Gênero/Idade/Raça-cor): o endpoint LGPD-safe não os fornece →
 * empty-state honesto, sem inventar distribuição (D3 do plano). Reabilita quando o backend expuser agregação
 * demográfica.
 */

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

export function EquipePage(): ReactNode {
  const navigate = useNavigate()

  // Server-state REAL do core-api (#114, endpoint LGPD-safe): loading | error | ready. Sem idade/gênero/
  // raça-cor → os 3 gráficos demográficos recebem dataset VAZIO (empty-state honesto); só Ano + Função têm fonte.
  const state = useEquipe()
  // Query SEPARADA (core-api#477): se a demografia falhar/403, os gráficos ficam vazios e a TABELA segue.
  const demographics = useEquipeDemographics()

  // UI-state local da page (§XI): filtros abertos, DRAFT/APLICADO dos filtros, paginação e o colaborador do modal.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState<TeamFilters>(EMPTY_TEAM_FILTERS)
  const [applied, setApplied] = useState<TeamFilters>(EMPTY_TEAM_FILTERS)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT)
  const [selected, setSelected] = useState<TeamMemberRow | null>(null)

  // Todos os hooks rodam ANTES de qualquer return (regras de hooks): sem dado ainda → linhas vazias.
  const rows = state.status === 'ready' ? state.rows : EMPTY_ROWS
  // Filtragem CLIENT-SIDE pelos filtros APLICADOS (todos os colaboradores já estão no front). TUDO deriva daqui.
  const filteredRows = useMemo(() => applyTeamFilters(rows, applied), [rows, applied])
  const totalCount = useMemo(() => computeTotal(filteredRows), [filteredRows])

  // Só os 2 gráficos com FONTE REAL: Ano de contrato (de `startOfContract`) e Função (de `role`). Os 3
  // demográficos (Gênero/Idade/Raça-cor) recebem `[]` na View (empty-state honesto — o endpoint não os traz).
  const anoCounts = useMemo(() => byAnoContrato(filteredRows), [filteredRows])
  const funcaoBars = useMemo(() => byFuncao(filteredRows), [filteredRows])

  // Opções dos filtros POPULÁVEIS derivadas dos dados COMPLETOS (não do filtrado — senão as opções encolheriam
  // ao aplicar). Raça/Idade/Gênero + os sem campo no TeamMemberRow ficam só "Todos" (LGPD #477 / sem fonte).
  const filterOpts = useMemo(() => teamFilterOptions(rows), [rows])
  const allOption = t('reports.equipe.filters.allOption')

  // Paginação da tabela sobre o FILTRADO (fatia PURA da ViewModel; o UI-state page/perPage mora aqui).
  const pages = totalPages(totalCount, perPage)
  const pageRows = useMemo(() => pageSlice(filteredRows, page, perPage), [filteredRows, page, perPage])

  // Resumo dos filtros APLICADOS (subtítulo) — do `applied`, não do draft. Valores já são os próprios rótulos
  // (sem UUID) → value=label. Reusa o helper puro (§XI). Nenhum aplicado → [] (sem linha).
  const subtitleParts = buildFilterSummaryParts([
    { label: t('reports.equipe.filters.escolaridade'), value: applied.escolaridade },
    { label: t('reports.equipe.filters.vinculo'), value: applied.vinculo },
    { label: t('reports.equipe.filters.anoContrato'), value: applied.anoContrato },
    { label: t('reports.equipe.filters.programa'), value: applied.programa },
    { label: t('reports.equipe.filters.funcao'), value: applied.funcao },
    { label: t('reports.equipe.filters.busca'), value: applied.search },
  ])

  // "Filtrar" commita o draft → aplica + volta p/ a 1ª página.
  const aplicar = (): void => {
    setApplied(draft)
    setPage(1)
  }

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.equipe.loading')} />
  }
  if (state.status === 'error') {
    return <ReportStatePanel role="alert" title={t('reports.equipe.errorTitle')} hint={t(state.errorTag)} />
  }

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.equipe.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className={headTitleBlock}>
          <h1 className={headTitle}>{t('reports.equipe.title')}</h1>
          {subtitleParts.length > 0 && <p className={headSubtitle}>{subtitleParts.join(' · ')}</p>}
        </div>
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
            {t('reports.equipe.filters.title')}
          </button>
          <button
            type="button"
            className={exportButton}
            onClick={() => {
              downloadCsv('equipe-abc.csv', buildCsv(filteredRows))
            }}
          >
            <DownloadIcon size={16} />
            {t('reports.equipe.export.label')}
          </button>
        </div>
      </div>

      {/* Filtros recolhíveis (placeholders visuais front-first) */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <div className={searchRow}>
            <input
              className={searchInput}
              type="search"
              placeholder={t('reports.equipe.filters.searchPlaceholder')}
              aria-label={t('reports.equipe.filters.searchPlaceholder')}
              value={draft.search}
              onChange={(e) => {
                setDraft((d) => ({ ...d, search: e.target.value }))
              }}
            />
          </div>
          <div className={fieldsGrid}>
            {/* Filtros APLICÁVEIS (client-side): controlados → draft; "Filtrar" commita. */}
            <FilterField
              label={t('reports.equipe.filters.escolaridade')}
              placeholder={allOption}
              options={filterOpts.escolaridade}
              value={draft.escolaridade}
              onChange={(v) => {
                setDraft((d) => ({ ...d, escolaridade: v }))
              }}
            />
            {/* Raça: LGPD-safe (#477) → sem dado real, inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.raca')} placeholder={allOption} />
            <FilterField
              label={t('reports.equipe.filters.anoContrato')}
              placeholder={allOption}
              options={filterOpts.anoContrato}
              value={draft.anoContrato}
              onChange={(v) => {
                setDraft((d) => ({ ...d, anoContrato: v }))
              }}
            />
            {/* Desativado por: sem campo no TeamMemberRow → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.desativadoPor')} placeholder={allOption} />
            <FilterField
              label={t('reports.equipe.filters.programa')}
              placeholder={allOption}
              options={filterOpts.programa}
              value={draft.programa}
              onChange={(v) => {
                setDraft((d) => ({ ...d, programa: v }))
              }}
            />
            <FilterField
              label={t('reports.equipe.filters.funcao')}
              placeholder={allOption}
              options={filterOpts.funcao}
              value={draft.funcao}
              onChange={(v) => {
                setDraft((d) => ({ ...d, funcao: v }))
              }}
            />
            {/* Gênero: LGPD-safe (#477) → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.genero')} placeholder={allOption} />
            {/* Status: sem campo no TeamMemberRow → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.status')} placeholder={allOption} />
            {/* Situação cadastral: sem campo → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.situacaoCadastral')} placeholder={allOption} />
            {/* Idade: LGPD-safe (#477) → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.idade')} placeholder={allOption} />
            <FilterField
              label={t('reports.equipe.filters.vinculo')}
              placeholder={allOption}
              options={filterOpts.vinculo}
              value={draft.vinculo}
              onChange={(v) => {
                setDraft((d) => ({ ...d, vinculo: v }))
              }}
            />
          </div>
          <div className={filtersActions}>
            <button type="button" className={applyButton} onClick={aplicar}>
              {t('reports.equipe.filters.filtrar')}
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos em 2 linhas: 3 no topo (Gênero + Idade + Raça/Cor), 2 embaixo (Ano + Função). */}
      <RealizadoChartsMount>
        {(animate) => (
          <>
            {/* Linha 1 (3-up): Gênero (donut) + Idade (barras horizontais) + Raça/Cor (barras verticais) */}
            <div className={charts3}>
              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.equipe.charts.genero')}</h2>
                </div>
                <div className={chartPad}>
                  <EquipeGeneroDonut
                    slices={demographics.gender}
                    centerValue={String(totalCount)}
                    centerCaption={t('reports.equipe.charts.centerCaption')}
                    emptyLabel={t('reports.equipe.chartUnavailable')}
                    animate={animate}
                    formatPercent={formatSharePercent}
                  />
                </div>
              </div>

              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.equipe.charts.idade')}</h2>
                </div>
                <div className={chartPad}>
                  <EquipeHorizontalBars
                    bars={demographics.ageRange}
                    total={totalCount}
                    emptyLabel={t('reports.equipe.chartUnavailable')}
                    animate={animate}
                    formatPercent={formatSharePercent}
                  />
                </div>
              </div>

              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.equipe.charts.racaCor')}</h2>
                </div>
                <div className={chartPad}>
                  <EquipeVerticalBars
                    bars={demographics.race}
                    total={totalCount}
                    emptyLabel={t('reports.equipe.chartUnavailable')}
                    animate={animate}
                    formatPercent={formatSharePercent}
                  />
                </div>
              </div>
            </div>

            {/* Linha 2 (2-up, mais largos): Funcionários por Ano (linha) + Função (barras horizontais) */}
            <div className={charts2}>
              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.equipe.charts.ano')}</h2>
                </div>
                <div className={chartPad}>
                  <EquipeLineChart
                    counts={anoCounts.map((y) => y.count)}
                    years={ANOS.map((y) => String(y))}
                    valueLabel={t('reports.equipe.charts.centerCaption')}
                    ariaLabel={t('reports.equipe.charts.ano')}
                    emptyLabel={t('reports.equipe.empty')}
                    animate={animate}
                  />
                </div>
              </div>

              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.equipe.charts.funcao')}</h2>
                </div>
                <div className={chartPad}>
                  <EquipeHorizontalBars
                    bars={funcaoBars}
                    total={totalCount}
                    emptyLabel={t('reports.equipe.empty')}
                    animate={animate}
                    formatPercent={formatSharePercent}
                    tone="alt"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </RealizadoChartsMount>

      {/* Tabela (8 colunas de exibição) — linhas clicáveis abrem o modal de detalhe */}
      <EquipeTable
        rows={pageRows}
        totalCount={totalCount}
        labels={{
          cardTitle: t('reports.equipe.table.title'),
          count: t('reports.equipe.table.count'),
          nome: t('reports.equipe.columns.nome'),
          idade: t('reports.equipe.columns.idade'),
          area: t('reports.equipe.columns.area'),
          funcao: t('reports.equipe.columns.funcao'),
          vinculo: t('reports.equipe.columns.vinculo'),
          genero: t('reports.equipe.columns.genero'),
          racaCor: t('reports.equipe.columns.racaCor'),
          escolaridade: t('reports.equipe.columns.escolaridade'),
          naLabel: t('reports.equipe.naLabel'),
          empty: t('reports.equipe.empty'),
          rowAction: t('reports.equipe.table.rowAction'),
        }}
        onRowClick={setSelected}
      />

      <BrandPaginator
        page={page}
        totalPages={pages}
        perPage={perPage}
        labels={{
          previous: t('reports.equipe.paginator.previous'),
          next: t('reports.equipe.paginator.next'),
          page: t('reports.equipe.paginator.page'),
          of: t('reports.equipe.paginator.of'),
          perPage: t('reports.equipe.paginator.perPage'),
        }}
        onPrev={() => {
          setPage((p) => Math.max(1, p - 1))
        }}
        onNext={() => {
          setPage((p) => Math.min(pages, p + 1))
        }}
        onPerPage={(next) => {
          setPerPage(next)
          setPage(1) // troca de "itens por página" volta para a 1ª página
        }}
      />

      <EquipeDetailModal
        member={selected}
        labels={{
          title: t('reports.equipe.detail.title'),
          nome: t('reports.equipe.columns.nome'),
          idade: t('reports.equipe.columns.idade'),
          area: t('reports.equipe.columns.area'),
          funcao: t('reports.equipe.columns.funcao'),
          vinculo: t('reports.equipe.columns.vinculo'),
          genero: t('reports.equipe.columns.genero'),
          racaCor: t('reports.equipe.columns.racaCor'),
          escolaridade: t('reports.equipe.columns.escolaridade'),
          anoContrato: t('reports.equipe.detail.anoContrato'),
          naLabel: t('reports.equipe.naLabel'),
          close: t('reports.equipe.detail.close'),
          edit: t('reports.equipe.detail.edit'),
        }}
        onClose={() => {
          setSelected(null)
        }}
        onEdit={() => {
          // Front-first: os dados sintéticos não têm id real de parceiro, então navegamos ao ÍNDICE do
          // módulo Colaboradores (edição acontece lá, não inline aqui). TODO: quando o endpoint real
          // (#114/#112) trouxer o id do colaborador, fazer deep-link para
          // `/parceiros/colaboradores/$id` com o id real.
          void navigate({ to: '/parceiros/colaboradores' })
        }}
      />
    </div>
  )
}

/** Campo de filtro (select nativo placeholder — só a forma/estilo brand). */
/**
 * Campo de filtro (select nativo CONTROLADO). `placeholder` = opção vazia (value '') = "Todos" (sem recorte).
 * `options` são os valores REAIS (label==value). Sem `value`/`onChange` → inerte (só "Todos"; filtros sem dado
 * real, ex.: Raça/Idade/Gênero — LGPD).
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
  options?: readonly string[]
  value?: string
  onChange?: (v: string) => void
}): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select
          className={fldSelect}
          aria-label={label}
          value={value ?? ''}
          onChange={(e) => {
            onChange?.(e.target.value)
          }}
        >
          <option value="">{placeholder}</option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
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
