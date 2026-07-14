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
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon, DownloadIcon } from '#shared/ui/index.ts'

import {
  total as computeTotal,
  byAnoContrato,
  byFuncao,
  buildCsv,
  formatSharePercent,
  totalPages,
  pageSlice,
  PER_PAGE_DEFAULT,
  ANOS,
  type TeamMemberRow,
} from '../equipe.view-model.ts'
import { useEquipe } from '../equipe.binding.ts'
import type { CategoryCount } from '../equipe.view-model.ts'
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

const t = createTranslator(ptBR)

/** Linhas vazias enquanto a query carrega/falha (mantém a ordem dos hooks estável — §XI). */
const EMPTY_ROWS: readonly TeamMemberRow[] = []

/**
 * Dataset VAZIO dos 3 gráficos demográficos (Gênero/Idade/Raça-cor): o endpoint LGPD-safe não os fornece →
 * empty-state honesto, sem inventar distribuição (D3 do plano). Reabilita quando o backend expuser agregação
 * demográfica.
 */
const EMPTY_DEMOGRAPHICS: readonly CategoryCount[] = []

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

  // UI-state local da page (§XI): filtros abertos, paginação e o colaborador selecionado no modal.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT)
  const [selected, setSelected] = useState<TeamMemberRow | null>(null)

  // Todos os hooks rodam ANTES de qualquer return (regras de hooks): sem dado ainda → linhas vazias.
  const rows = state.status === 'ready' ? state.rows : EMPTY_ROWS
  const totalCount = useMemo(() => computeTotal(rows), [rows])

  // Só os 2 gráficos com FONTE REAL: Ano de contrato (de `startOfContract`) e Função (de `role`). Os 3
  // demográficos (Gênero/Idade/Raça-cor) recebem `[]` na View (empty-state honesto — o endpoint não os traz).
  const anoCounts = useMemo(() => byAnoContrato(rows), [rows])
  const funcaoBars = useMemo(() => byFuncao(rows), [rows])

  // Paginação da tabela (fatia PURA da ViewModel; o UI-state page/perPage mora aqui).
  const pages = totalPages(totalCount, perPage)
  const pageRows = useMemo(() => pageSlice(rows, page, perPage), [rows, page, perPage])

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
        <h1 className={headTitle}>{t('reports.equipe.title')}</h1>
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
              downloadCsv('equipe-abc.csv', buildCsv(rows))
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
            />
          </div>
          <div className={fieldsGrid}>
            <FilterField
              label={t('reports.equipe.filters.escolaridade')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.raca')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.anoContrato')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.desativadoPor')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.programa')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.funcao')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.genero')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.status')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.situacaoCadastral')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.idade')}
              options={[t('reports.equipe.filters.allOption')]}
            />
            <FilterField
              label={t('reports.equipe.filters.vinculo')}
              options={[t('reports.equipe.filters.allOption')]}
            />
          </div>
          <div className={filtersActions}>
            <button type="button" className={applyButton}>
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
                    slices={EMPTY_DEMOGRAPHICS}
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
                    bars={EMPTY_DEMOGRAPHICS}
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
                    bars={EMPTY_DEMOGRAPHICS}
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
function FilterField({ label, options }: { label: string; options: readonly string[] }): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select className={fldSelect} aria-label={label}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <span className={fldChev}>
          <ChevronDownIcon size={16} />
        </span>
      </div>
    </div>
  )
}
