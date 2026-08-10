/**
 * EquipePage — tela do relatório "Equipe ABC" (identidade "brand", full-bleed 28px), no MESMO padrão do
 * relatório "Realizado × Planejado" (filtros recolhíveis → gráficos → tabela). Os dados são REAIS
 * (`/reports/team` + `/reports/team/demographics`); `equipe.placeholder.ts` sobrou só como fixture do
 * núcleo puro. A ViewModel PURA faz TODA a agregação; a page compõe as views burras e guarda o UI-state
 * local (toggle dos filtros, draft × aplicado, paginação). Export = CSV enxuto (Blob), sem PDF.
 *
 * Os filtros FILTRAM (client-side, sobre o conjunto já carregado). Duas naturezas: lista FECHADA do domínio
 * de Colaboradores (área, vínculo, escolaridade, gênero, raça/cor, status, situação cadastral) e derivada do
 * dado (função, ano de contrato). Idade é por FAIXA, nas categorias da própria API. Segue inerte apenas
 * "Desativado por" — o motivo não vem na projeção do core-api.
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
  countByTemplate,
  withoutEmptyCategories,
  categoryKeyOf,
  faixaEtariaIdOf,
  type TeamMemberRow,
  type TeamFilters,
  type CategoryCount,
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
import { downloadCsv } from '../components/download-csv.ts'

const t = createTranslator(ptBR)

/** Par {value,label} do select: `value` é sempre o CÓDIGO (é o que os filtros comparam). */
export type SelectOption = Readonly<{ value: string; label: string }>

/**
 * Tradutor de código do domínio de Colaboradores. Reusa as chaves de LÁ (`partners.collaborators.<grupo>.*`)
 * em vez de criar um dicionário próprio no relatório — dois dicionários divergem, e foi assim que este mesmo
 * relatório passou a apagar identidades que a cópia local não conhecia.
 * Sem tradução → devolve o código cru: fica feio, mas aparece. Nunca some.
 */
const labeled =
  (grupo: 'education' | 'employment' | 'area' | 'gender' | 'race') =>
  (codigo: string): SelectOption => {
    const tag = `partners.collaborators.${grupo}.${codigo}`
    const label = t(tag)
    return { value: codigo, label: label === tag ? codigo : label }
  }

/** Valor livre (função, ano): não há código; o próprio texto é o rótulo. */
const asIs = (v: string): SelectOption => ({ value: v, label: v })

/**
 * Status e Situação Cadastral não passam pelo `labeled()`: a chave do catálogo não é o código.
 * Status é código nosso ('ATIVO'), situação é PascalCase do core-api ('PreRegistration') e as chaves de
 * Colaboradores são kebab. O mapa explícito reusa o rótulo de LÁ — as duas telas dizem a mesma palavra.
 */
const STATUS_LABEL_KEYS: Readonly<Record<string, string>> = {
  ATIVO: 'partners.collaborators.status.active',
  INATIVO: 'partners.collaborators.status.inactive',
}
const REGISTRATION_LABEL_KEYS: Readonly<Record<string, string>> = {
  Complete: 'partners.collaborators.registration.complete',
  PreRegistration: 'partners.collaborators.registration.pre-registration',
}

/** Traduz por mapa explícito; código fora do mapa cai nele mesmo (fica feio, mas aparece — nunca some). */
const byKeyMap =
  (keys: Readonly<Record<string, string>>) =>
  (codigo: string): SelectOption => {
    const tag = keys[codigo]
    if (tag === undefined) return { value: codigo, label: codigo }
    const label = t(tag)
    return { value: codigo, label: label === tag ? codigo : label }
  }

const statusOption = byKeyMap(STATUS_LABEL_KEYS)
const registrationOption = byKeyMap(REGISTRATION_LABEL_KEYS)

/** Rótulo p/ o resumo dos filtros aplicados; '' (nada aplicado) continua '' — o resumo omite a linha. */
const labelOrEmpty = (
  grupo: 'education' | 'employment' | 'area' | 'gender' | 'race',
  codigo: string,
): string => (codigo === '' ? '' : labeled(grupo)(codigo).label)

/** Linhas vazias enquanto a query carrega/falha (mantém a ordem dos hooks estável — §XI). */
const EMPTY_ROWS: readonly TeamMemberRow[] = []

/**
 * Distribuição de um gráfico demográfico: conta as LINHAS sobre o catálogo de categorias da API e resolve o
 * rótulo. Prioridade do rótulo: catálogo do FRONT (mesmo texto dos filtros e da tabela) → rótulo da API
 * (categoria nova aparece sem release) → código cru (não deveria acontecer, mas nome feio é melhor que
 * categoria invisível). `grupo` ausente = sem tradução no front (faixa etária).
 */
function distribuicao(
  rows: readonly TeamMemberRow[],
  catalogo: readonly CategoryCount[],
  keyOf: (r: TeamMemberRow) => string,
  grupo?: 'gender' | 'race',
): readonly CategoryCount[] {
  const daApi = new Map(catalogo.map((c) => [c.id, c.label]))
  return withoutEmptyCategories(
    countByTemplate(
      rows,
      catalogo.map((c) => c.id),
      keyOf,
    ).map(({ id, count }) => {
      const doCatalogo = grupo === undefined ? id : labeled(grupo)(id).label
      return { id, label: doCatalogo === id ? (daApi.get(id) ?? id) : doCatalogo, count }
    }),
  )
}

/**
 * Os 3 gráficos demográficos (Gênero/Idade/Raça-cor) contam as LINHAS FILTRADAS. A agregação do backend
 * (`useEquipeDemographics`) entra só como CATÁLOGO: quais categorias existem, em que ordem, com que rótulo —
 * inclusive as que ninguém preencheu, que o filtro precisa listar e o front não pode inventar.
 *
 * Era o contrário: os gráficos liam os números agregados, que não conhecem os filtros da tela. Filtrar
 * "Situação Cadastral = Cadastrado" recortava a tabela e deixava o gráfico intacto — quem estava em
 * pré-cadastro seguia contado (P.O., 09/08). E a % usava o total FILTRADO como denominador com contagens
 * NÃO filtradas, então os percentuais nem fechavam.
 *
 * A premissa "só estatística agregada cruza a fronteira" (Opção A, 2026-07-20) deixou de valer quando o
 * `/reports/team` passou a entregar idade/gênero/raça POR PESSOA — sempre entregou, na verdade; era o schema
 * de borda do BFF que descartava as chaves calado. Contar aqui não expõe nada que a tabela já não mostre.
 */

export function EquipePage(): ReactNode {
  const navigate = useNavigate()

  // Server-state REAL do core-api (#114, endpoint LGPD-safe): loading | error | ready. A TABELA não traz idade/
  // gênero/raça-cor por pessoa (Opção A); esses 3 gráficos vêm da AGREGAÇÃO na query separada abaixo.
  const state = useEquipe()
  // Query SEPARADA (agregação demográfica): se falhar/403, os 3 gráficos ficam vazios e a TABELA segue.
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

  // Gráficos derivados da TABELA: Ano de contrato (de `startOfContract`) e Função (de `role`). Os 3
  // demográficos (Gênero/Idade/Raça-cor) NÃO derivam daqui — vêm da agregação (`demographics.*`, Opção A).
  const anoCounts = useMemo(() => byAnoContrato(filteredRows), [filteredRows])
  const funcaoBars = useMemo(() => byFuncao(filteredRows), [filteredRows])

  // Opções dos filtros POPULÁVEIS derivadas dos dados COMPLETOS (não do filtrado — senão as opções encolheriam
  // ao aplicar). Raça/Idade/Gênero + os sem campo no TeamMemberRow ficam só "Todos" (LGPD #477 / sem fonte).
  const filterOpts = useMemo(() => teamFilterOptions(rows), [rows])
  const allOption = t('reports.equipe.filters.allOption')

  // CÓDIGO → rótulo PT-BR. As chaves são as MESMAS do módulo de Colaboradores (`partners.collaborators.*`),
  // de propósito: o filtro daqui tem que ler igual ao de lá, senão a mesma pessoa aparece como "Parcerias"
  // numa tela e "PARC" na outra. Código sem tradução cai nele mesmo — some nada.
  const opts = useMemo(
    () => ({
      escolaridade: filterOpts.escolaridade.map(labeled('education')),
      vinculo: filterOpts.vinculo.map(labeled('employment')),
      programa: filterOpts.programa.map(labeled('area')),
      genero: filterOpts.genero.map(labeled('gender')),
      racaCor: filterOpts.racaCor.map(labeled('race')),
      status: filterOpts.status.map(statusOption),
      situacaoCadastral: filterOpts.situacaoCadastral.map(registrationOption),
      // Livres: o valor É o rótulo.
      anoContrato: filterOpts.anoContrato.map(asIs),
      funcao: filterOpts.funcao.map(asIs),
    }),
    [filterOpts],
  )

  // Faixa etária: as MESMAS categorias que a API publica no gráfico "Idade" — sem dicionário local, então
  // filtro e gráfico não divergem. Todas as faixas aparecem, inclusive as sem ninguém (é lista fechada; faixa
  // sumindo do select lê como filtro quebrado). O corte por pessoa é local (`faixaEtariaIdOf`) porque o
  // backend só publica a faixa AGREGADA. Demografia carregando/falhou → só "Todos": nada inventado no front.
  const faixaEtariaOptions = useMemo<readonly SelectOption[]>(
    () => demographics.ageRange.map((c) => ({ value: c.id, label: c.label })),
    [demographics.ageRange],
  )

  /**
   * Os 3 gráficos demográficos contam as LINHAS FILTRADAS, não a agregação do backend — que não conhece os
   * filtros da tela e por isso ficava parada enquanto a tabela recortava.
   *
   * O rótulo sai primeiro do catálogo do front (o mesmo dos filtros e da tabela, no vocabulário que o cliente
   * pediu) e só cai no rótulo da API quando o front não conhece o código — assim uma categoria nova continua
   * aparecendo sozinha, sem release, e nenhuma categoria fica com dois nomes diferentes na mesma tela.
   */
  const generoSlices = useMemo(
    () => distribuicao(filteredRows, demographics.gender, (r) => categoryKeyOf(r.genero), 'gender'),
    [filteredRows, demographics.gender],
  )
  const racaBars = useMemo(
    () => distribuicao(filteredRows, demographics.race, (r) => categoryKeyOf(r.racaCor), 'race'),
    [filteredRows, demographics.race],
  )
  // Idade é o único dos três sem rótulo no catálogo do front: "30 a 39" só existe na resposta da API. Sem
  // catálogo (query falhou/403) o gráfico fica no empty-state — melhor do que desenhar `DE_30_A_39` na tela.
  const idadeBars = useMemo(
    () =>
      demographics.ageRange.length === 0
        ? []
        : distribuicao(filteredRows, demographics.ageRange, (r) => faixaEtariaIdOf(r.idade)),
    [filteredRows, demographics.ageRange],
  )

  // Paginação da tabela sobre o FILTRADO (fatia PURA da ViewModel; o UI-state page/perPage mora aqui).
  const pages = totalPages(totalCount, perPage)
  const pageRows = useMemo(() => pageSlice(filteredRows, page, perPage), [filteredRows, page, perPage])

  // A tabela é view BURRA: recebe texto pronto. Os filtros comparam CÓDIGO, a tabela mostra RÓTULO — por isso
  // a tradução acontece só aqui, na fronteira da exibição, e não dentro da linha (que precisa do código).
  const displayRows = useMemo(
    () =>
      pageRows.map((r) => ({
        ...r,
        programa: labeled('area')(r.programa).label,
        vinculo: labeled('employment')(r.vinculo).label,
        genero: labeled('gender')(r.genero).label,
        racaCor: labeled('race')(r.racaCor).label,
        escolaridade: labeled('education')(r.escolaridade).label,
      })),
    [pageRows],
  )

  // Resumo dos filtros APLICADOS (subtítulo) — do `applied`, não do draft. Valores já são os próprios rótulos
  // (sem UUID) → value=label. Reusa o helper puro (§XI). Nenhum aplicado → [] (sem linha).
  const subtitleParts = buildFilterSummaryParts([
    {
      label: t('reports.equipe.filters.escolaridade'),
      value: labelOrEmpty('education', applied.escolaridade),
    },
    { label: t('reports.equipe.filters.vinculo'), value: labelOrEmpty('employment', applied.vinculo) },
    { label: t('reports.equipe.filters.anoContrato'), value: applied.anoContrato },
    { label: t('reports.equipe.filters.area'), value: labelOrEmpty('area', applied.programa) },
    { label: t('reports.equipe.filters.funcao'), value: applied.funcao },
    { label: t('reports.equipe.filters.genero'), value: labelOrEmpty('gender', applied.genero) },
    { label: t('reports.equipe.filters.raca'), value: labelOrEmpty('race', applied.racaCor) },
    {
      label: t('reports.equipe.filters.status'),
      value: applied.status === '' ? '' : statusOption(applied.status).label,
    },
    {
      label: t('reports.equipe.filters.situacaoCadastral'),
      value: applied.situacaoCadastral === '' ? '' : registrationOption(applied.situacaoCadastral).label,
    },
    {
      // Rótulo da faixa vem da MESMA lista do select (API), não de um mapa local.
      label: t('reports.equipe.filters.idade'),
      value: faixaEtariaOptions.find((o) => o.value === applied.faixaEtaria)?.label ?? '',
    },
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
              options={opts.escolaridade}
              value={draft.escolaridade}
              onChange={(v) => {
                setDraft((d) => ({ ...d, escolaridade: v }))
              }}
            />
            {/* Raça/cor: o core-api JÁ manda o código por pessoa (era o schema de borda que descartava). */}
            <FilterField
              label={t('reports.equipe.filters.raca')}
              placeholder={allOption}
              options={opts.racaCor}
              value={draft.racaCor}
              onChange={(v) => {
                setDraft((d) => ({ ...d, racaCor: v }))
              }}
            />
            <FilterField
              label={t('reports.equipe.filters.anoContrato')}
              placeholder={allOption}
              options={opts.anoContrato}
              value={draft.anoContrato}
              onChange={(v) => {
                setDraft((d) => ({ ...d, anoContrato: v }))
              }}
            />
            {/* Desativado por: sem campo no TeamMemberRow → inerte "Todos". */}
            <FilterField label={t('reports.equipe.filters.desativadoPor')} placeholder={allOption} />
            <FilterField
              label={t('reports.equipe.filters.area')}
              placeholder={allOption}
              options={opts.programa}
              value={draft.programa}
              onChange={(v) => {
                setDraft((d) => ({ ...d, programa: v }))
              }}
            />
            <FilterField
              label={t('reports.equipe.filters.funcao')}
              placeholder={allOption}
              options={opts.funcao}
              value={draft.funcao}
              onChange={(v) => {
                setDraft((d) => ({ ...d, funcao: v }))
              }}
            />
            {/* Identidade de gênero: idem — dado real por pessoa, lista fechada com as 8 identidades. */}
            <FilterField
              label={t('reports.equipe.filters.genero')}
              placeholder={allOption}
              options={opts.genero}
              value={draft.genero}
              onChange={(v) => {
                setDraft((d) => ({ ...d, genero: v }))
              }}
            />
            {/* Status: `active` do DTO, virado em código ATIVO/INATIVO na linha. */}
            <FilterField
              label={t('reports.equipe.filters.status')}
              placeholder={allOption}
              options={opts.status}
              value={draft.status}
              onChange={(v) => {
                setDraft((d) => ({ ...d, status: v }))
              }}
            />
            {/* Situação cadastral: `registrationStatus` do DTO (Cadastrado / Pré-cadastro). */}
            <FilterField
              label={t('reports.equipe.filters.situacaoCadastral')}
              placeholder={allOption}
              options={opts.situacaoCadastral}
              value={draft.situacaoCadastral}
              onChange={(v) => {
                setDraft((d) => ({ ...d, situacaoCadastral: v }))
              }}
            />
            {/* Idade: por FAIXA, nas mesmas categorias do gráfico logo acima (não por idade exata). */}
            <FilterField
              label={t('reports.equipe.filters.idade')}
              placeholder={allOption}
              options={faixaEtariaOptions}
              value={draft.faixaEtaria}
              onChange={(v) => {
                setDraft((d) => ({ ...d, faixaEtaria: v }))
              }}
            />
            <FilterField
              label={t('reports.equipe.filters.vinculo')}
              placeholder={allOption}
              options={opts.vinculo}
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
                    slices={generoSlices}
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
                    bars={idadeBars}
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
                    bars={racaBars}
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
        rows={displayRows}
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
 * `options` são pares {value: CÓDIGO, label: PT-BR} — o filtro compara código, a pessoa lê o rótulo.
 *
 * Sem `value`/`onChange` → inerte (só "Todos"). Hoje sobra UM inerte: "Desativado por", porque o motivo da
 * desativação (`disable_by`) não entra na projeção do `/reports/team` — depende do core-api, não daqui.
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
  options?: readonly SelectOption[]
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
