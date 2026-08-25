/**
 * RelatorioGeralPage — tela do "Relatório Geral" (identidade "brand", full-bleed 28px), no MOLDE dos demais
 * relatórios: cabeçalho (voltar + título + Filtros + Exportar + Colunas) → filtros recolhíveis → tabela PAGINADA
 * (15 colunas, scroll horizontal) → paginação (`BrandPaginator`). Dados REAIS do core-api (#442): o binding
 * `useRelatorioGeral` lê a PÁGINA plana do `GET /reports/generalReport` (paginação SERVER-SIDE; total do servidor).
 *
 * A ViewModel PURA mapeia a linha real → linha de exibição e monta o CSV; a page compõe as views burras e guarda
 * o UI-state (filtros DRAFT/APLICADO, página, itens por página, colunas visíveis). Export CSV segue O QUE ESTÁ NA
 * TELA (WYSIWYG) da página corrente. ADR-0009/0012, §XI. PIX/bancário só vêm sob `bank-account:read` (Slice C).
 */
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  buildCsv,
  totalPages,
  PER_PAGE_DEFAULT,
  GENERAL_COLUMNS,
  ALL_GENERAL_COLUMN_IDS,
  type GeneralColumnId,
} from '../relatorio-geral.view-model.ts'
import { useRelatorioGeral, type RelatorioGeralQuery } from '../relatorio-geral.binding.ts'
import { usePosicaoFilterOptions } from '../posicao-filters.binding.ts'
import { buildFilterSummaryParts, formatDueRange, type FilterOption } from '../filters-summary.view-model.ts'
import { RelatorioGeralTable, type VisibleColumn } from '../components/relatorio-geral-table.component.tsx'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'
import { headTitleBlock } from './posicao-pagamentos.page.css.ts'
import {
  head,
  backButton,
  headTitle,
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
  clearButton,
  filterRowBreak,
  exportTrigger,
  columnsWrap,
  columnsBackdrop,
  columnsMenu,
  columnsItem,
  columnsCheck,
  searchInput,
  periodRow,
  dateInput,
} from './relatorio-geral.page.css.ts'
import { downloadCsv } from '../components/download-csv.ts'

const t = createTranslator(ptBR)

/** Rótulo i18n de cada coluna (usado no cabeçalho da tabela e nos checkboxes do seletor). */
const COLUMN_LABEL: Record<GeneralColumnId, string> = {
  data: t('reports.geral.columns.data'),
  vencimento: t('reports.geral.columns.vencimento'),
  tipo: t('reports.geral.columns.tipo'),
  numeroContrato: t('reports.geral.columns.numeroContrato'),
  codigo: t('reports.geral.columns.codigo'),
  parcela: t('reports.geral.columns.parcela'),
  apontamento: t('reports.geral.columns.apontamento'),
  fornecedor: t('reports.geral.columns.fornecedor'),
  financiador: t('reports.geral.columns.financiador'),
  colaborador: t('reports.geral.columns.colaborador'),
  centroCusto: t('reports.geral.columns.centroCusto'),
  categoria: t('reports.geral.columns.categoria'),
  subcategoria: t('reports.geral.columns.subcategoria'),
  pixBancario: t('reports.geral.columns.pixBancario'),
  valor: t('reports.geral.columns.valor'),
}

/** DRAFT dos filtros (strings da UI; "" = "Todos" / sem recorte). Datas em `YYYY-MM-DD`. */
type GeralDraft = Readonly<{
  search: string
  plano: string
  programa: string
  fornecedor: string
  conta: string
  centro: string
  categoria: string
  subcategoria: string
  status: string
  dueFrom: string
  dueTo: string
}>
const EMPTY_DRAFT: GeralDraft = {
  search: '',
  plano: '',
  programa: '',
  fornecedor: '',
  conta: '',
  centro: '',
  categoria: '',
  subcategoria: '',
  status: '',
  dueFrom: '',
  dueTo: '',
}

/** Campos de filtro APLICADOS (sem page/limit — o BFF pagina). */
type GeralFilters = Omit<RelatorioGeralQuery, 'page' | 'limit'>

// Status filtrável (enum #442 = os 6 do #588, sem Draft/Refused).
// ⚠️ `Transmitted` fica DE FORA, por decisão da P.O. (25/08): é status **transitório** — o título passa
// por ele a caminho de `Pago`, e "se ficar muito tempo nesse status, o operador deve tomar providências".
// Recortar um relatório por um estado de passagem não responde pergunta de gestão nenhuma.
//
// Some junto um defeito: o filtro NUNCA casava. O backend compara contra `fin_documents.status`, e quem
// transiciona é o TÍTULO (`fin_payables.status`) — o ADR-0065 §2 manteve o status do documento reservado
// DE PROPÓSITO, então nunca vai receber o valor. Respondia 200 com lista vazia (core-api#845).
//
// Tirar a opção NÃO esconde o título: sem recorte de status o relatório mostra tudo, e o transmitido
// conta como pendente/previsto até a baixa (decisão do backend na #792). `asStatus` usa `.find`, então
// URL salva com `status=Transmitted` degrada para "sem recorte" em vez de quebrar.
const STATUS_VALUES = ['Open', 'Approved', 'Paid', 'PartiallyReconciled', 'Reconciled'] as const
const asStatus = (s: string): string | undefined => STATUS_VALUES.find((x) => x === s)

/** Converte o draft nas dimensões do endpoint: "" → undefined. Fornecedor → entityId; Plano → budgetPlanId. */
function toGeralFilters(d: GeralDraft): GeralFilters {
  const v = (x: string): string | undefined => (x === '' ? undefined : x)
  return {
    search: v(d.search),
    budgetPlanId: v(d.plano),
    programId: v(d.programa),
    entityId: v(d.fornecedor),
    accountId: v(d.conta),
    costCenterId: v(d.centro),
    categoryId: v(d.categoria),
    subCategoryId: v(d.subcategoria),
    dueFrom: v(d.dueFrom),
    dueTo: v(d.dueTo),
    status: asStatus(d.status),
  }
}

export function RelatorioGeralPage(): ReactNode {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<GeneralColumnId>>(
    () => new Set(ALL_GENERAL_COLUMN_IDS),
  )
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT)
  const [draft, setDraft] = useState<GeralDraft>(EMPTY_DRAFT)
  const [applied, setApplied] = useState<GeralFilters>({})

  // Server-state REAL (#442) — página + filtros APLICADOS. Opções cross-módulo (public-api §I); Centro/Categoria/
  // Subcategoria em CASCATA da árvore do plano do DRAFT (ADR-0051). Hooks SEMPRE antes dos early-returns.
  const state = useRelatorioGeral({ page, limit: perPage, ...applied })
  // `planScopedOnly=true`: sem Plano selecionado, Centro/Categoria/Subcategoria ficam VAZIOS (não caem no
  // catálogo operacional — só cascateiam da árvore do plano, ADR-0051).
  const filterOpts = usePosicaoFilterOptions(draft.plano, draft.centro, draft.categoria, true)

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.geral.loading')} />
  }
  if (state.status === 'error') {
    return <ReportStatePanel role="alert" title={t('reports.geral.errorTitle')} hint={t(state.errorTag)} />
  }

  const { rows: pageRows, total: totalCount } = state.data
  const pages = totalPages(totalCount, perPage)
  const allOption = t('reports.geral.filters.allOption')

  const statusOptions: readonly FilterOption[] = [
    { value: 'Open', label: t('financial.list.chip.aberto') },
    { value: 'Approved', label: t('financial.list.chip.aprovado') },
    { value: 'Paid', label: t('financial.list.chip.pago') },
    { value: 'PartiallyReconciled', label: t('reports.posicao.filters.statusOpt.partiallyReconciled') },
    { value: 'Reconciled', label: t('financial.list.chip.conciliado') },
  ]

  // Colunas visíveis na ORDEM do legado (fonte única filtrada pela seleção) — dirige tabela + export.
  const visibleColumns: readonly VisibleColumn[] = GENERAL_COLUMNS.filter((c) => visibleIds.has(c.id)).map(
    (c) => ({ id: c.id, kind: c.kind, label: COLUMN_LABEL[c.id] }),
  )

  const toggleColumn = (id: GeneralColumnId): void => {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Patch do draft com CASCATA (plano → zera centro/categoria/subcategoria; etc.).
  const onField = (patch: Partial<GeralDraft>): void => {
    setDraft((d) => {
      const next = { ...d, ...patch }
      if ('plano' in patch) {
        next.centro = ''
        next.categoria = ''
        next.subcategoria = ''
      }
      if ('centro' in patch) {
        next.categoria = ''
        next.subcategoria = ''
      }
      if ('categoria' in patch) next.subcategoria = ''
      return next
    })
  }

  // "Filtrar" commita o draft → aplicado e volta p/ a 1ª página (o total muda).
  const applyFilters = (): void => {
    setApplied(toGeralFilters(draft))
    setPage(1)
  }

  // Resumo dos filtros APLICADOS (reflete `applied`, não o draft) — abaixo do título.
  const appliedDueRange = formatDueRange(applied.dueFrom ?? '', applied.dueTo ?? '', {
    fromPrefix: t('reports.filters.summary.fromPrefix'),
    toPrefix: t('reports.filters.summary.toPrefix'),
  })
  const subtitleParts = buildFilterSummaryParts([
    { label: t('reports.geral.filters.busca'), value: applied.search ?? '' },
    { label: t('reports.geral.filters.plano'), value: applied.budgetPlanId ?? '', options: filterOpts.plano },
    {
      label: t('reports.geral.filters.fornecedor'),
      value: applied.entityId ?? '',
      options: filterOpts.partner,
    },
    { label: t('reports.geral.filters.periodo'), value: appliedDueRange },
    { label: t('reports.geral.filters.conta'), value: applied.accountId ?? '', options: filterOpts.conta },
    {
      label: t('reports.geral.filters.centro'),
      value: applied.costCenterId ?? '',
      options: filterOpts.centro,
    },
    {
      label: t('reports.geral.filters.categoria'),
      value: applied.categoryId ?? '',
      options: filterOpts.categoria,
    },
    {
      label: t('reports.geral.filters.subcategoria'),
      value: applied.subCategoryId ?? '',
      options: filterOpts.subcategoria,
    },
    { label: t('reports.geral.filters.status'), value: applied.status ?? '', options: statusOptions },
  ])

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título + subtítulo + Filtros/Exportar/Colunas */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.geral.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className={headTitleBlock}>
          <h1 className={headTitle}>{t('reports.geral.title')}</h1>
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
            {t('reports.geral.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.geral.export.label')}
            csvLabel={t('reports.geral.export.csv')}
            pdfLabel={t('reports.geral.export.pdf')}
            onExportCsv={() => {
              downloadCsv(
                'relatorio-geral.csv',
                buildCsv(
                  pageRows,
                  visibleColumns.map((c) => c.id),
                ),
              )
            }}
          />
          {/* Seletor de colunas: botão "Colunas" → menu de checkboxes (todas visíveis por padrão). */}
          <div className={columnsWrap}>
            <button
              type="button"
              className={exportTrigger}
              aria-haspopup="menu"
              aria-expanded={columnsOpen}
              onClick={() => {
                setColumnsOpen((v) => !v)
              }}
            >
              {t('reports.geral.columns.button')}
            </button>
            {columnsOpen && (
              <>
                <button
                  type="button"
                  className={columnsBackdrop}
                  aria-label={t('reports.geral.columns.close')}
                  onClick={() => {
                    setColumnsOpen(false)
                  }}
                />
                <div className={columnsMenu} role="menu">
                  {GENERAL_COLUMNS.map((c) => (
                    <label key={c.id} className={columnsItem}>
                      <input
                        type="checkbox"
                        className={columnsCheck}
                        checked={visibleIds.has(c.id)}
                        onChange={() => {
                          toggleColumn(c.id)
                        }}
                      />
                      {COLUMN_LABEL[c.id]}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filtros recolhíveis — POPULADOS e APLICÁVEIS (#442). "Filtrar" commita → re-busca. */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <div className={fld}>
            <label className={fldLabel}>{t('reports.geral.filters.busca')}</label>
            <input
              type="search"
              className={searchInput}
              placeholder={t('reports.geral.filters.buscaPlaceholder')}
              value={draft.search}
              onChange={(e) => {
                onField({ search: e.target.value })
              }}
            />
          </div>
          <FilterField
            label={t('reports.geral.filters.fornecedor')}
            allOption={allOption}
            value={draft.fornecedor}
            options={filterOpts.partner}
            onChange={(v) => {
              onField({ fornecedor: v })
            }}
          />
          <div className={fld}>
            <label className={fldLabel}>{t('reports.geral.filters.periodo')}</label>
            <div className={periodRow}>
              <input
                type="date"
                className={dateInput}
                aria-label={t('reports.geral.filters.periodoDe')}
                value={draft.dueFrom}
                onChange={(e) => {
                  onField({ dueFrom: e.target.value })
                }}
              />
              <input
                type="date"
                className={dateInput}
                aria-label={t('reports.geral.filters.periodoAte')}
                value={draft.dueTo}
                onChange={(e) => {
                  onField({ dueTo: e.target.value })
                }}
              />
            </div>
          </div>
          <FilterField
            label={t('reports.geral.filters.conta')}
            allOption={allOption}
            value={draft.conta}
            options={filterOpts.conta}
            onChange={(v) => {
              onField({ conta: v })
            }}
          />
          <FilterField
            label={t('reports.geral.filters.status')}
            allOption={allOption}
            value={draft.status}
            options={statusOptions}
            onChange={(v) => {
              onField({ status: v })
            }}
          />
          {/* Quebra forçada: a linha 2 (taxonomia) começa aqui. */}
          <div className={filterRowBreak} aria-hidden="true" />
          <FilterField
            label={t('reports.geral.filters.plano')}
            allOption={allOption}
            value={draft.plano}
            options={filterOpts.plano}
            onChange={(v) => {
              onField({ plano: v })
            }}
          />
          <FilterField
            label={t('reports.geral.filters.programa')}
            allOption={allOption}
            value={draft.programa}
            options={filterOpts.programa}
            onChange={(v) => {
              onField({ programa: v })
            }}
          />
          <FilterField
            label={t('reports.geral.filters.centro')}
            allOption={allOption}
            value={draft.centro}
            options={filterOpts.centro}
            onChange={(v) => {
              onField({ centro: v })
            }}
          />
          <FilterField
            label={t('reports.geral.filters.categoria')}
            allOption={allOption}
            value={draft.categoria}
            options={filterOpts.categoria}
            onChange={(v) => {
              onField({ categoria: v })
            }}
          />
          <FilterField
            label={t('reports.geral.filters.subcategoria')}
            allOption={allOption}
            value={draft.subcategoria}
            options={filterOpts.subcategoria}
            onChange={(v) => {
              onField({ subcategoria: v })
            }}
          />
          <button
            type="button"
            className={clearButton}
            onClick={() => {
              setDraft(EMPTY_DRAFT)
              setApplied({})
              // Volta à 1ª página: limpar devolve a tela ao estado de recém-aberta.
              setPage(1)
            }}
          >
            {t('reports.filters.clear')}
          </button>
          <button type="button" className={applyButton} onClick={applyFilters}>
            {t('reports.geral.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* Tabela paginada (colunas visíveis, scroll horizontal). Total = contagem GLOBAL do servidor. */}
      <RelatorioGeralTable
        rows={pageRows}
        columns={visibleColumns}
        totalCount={totalCount}
        labels={{
          cardTitle: t('reports.geral.table.title'),
          count: t('reports.geral.table.count'),
          naLabel: t('reports.geral.naLabel'),
          empty: t('reports.geral.empty'),
          noColumns: t('reports.geral.columns.none'),
        }}
      />

      <BrandPaginator
        page={page}
        totalPages={pages}
        perPage={perPage}
        labels={{
          previous: t('reports.geral.paginator.previous'),
          next: t('reports.geral.paginator.next'),
          page: t('reports.geral.paginator.page'),
          of: t('reports.geral.paginator.of'),
          perPage: t('reports.geral.paginator.perPage'),
        }}
        onPrev={() => {
          setPage((p) => Math.max(1, p - 1))
        }}
        onNext={() => {
          setPage((p) => Math.min(pages, p + 1))
        }}
        onPerPage={(next) => {
          setPerPage(next)
          setPage(1)
        }}
      />
    </div>
  )
}

/** Campo de filtro CONTROLADO (select brand): opção "Todos" (value "") + as opções reais (value+label). */
function FilterField({
  label,
  allOption,
  value,
  options,
  onChange,
}: {
  label: string
  allOption: string
  value: string
  options: readonly FilterOption[]
  onChange: (value: string) => void
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
          <option value="">{allOption}</option>
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
