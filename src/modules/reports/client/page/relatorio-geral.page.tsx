/**
 * RelatorioGeralPage — tela do "Relatório Geral" (identidade "brand", full-bleed 28px), no MOLDE dos demais
 * relatórios: cabeçalho (voltar + título + Filtros + Exportar) → filtros recolhíveis → tabela paginada (15
 * colunas, scroll horizontal) → paginação (`BrandPaginator`). Front-first: os dados vêm de constantes
 * placeholder SINTÉTICAS (ver `relatorio-geral.placeholder.ts`); o endpoint do core-api (#114) ainda não existe.
 *
 * A ViewModel PURA faz a paginação (fatia) e o CSV; a page só compõe as views burras e guarda o UI-state local
 * (filtros + página + itens por página). Export = CSV (Blob) + PDF (window.print). ADR-0009/0012, §XI.
 *
 * ⚠️ As linhas de `tipo: 'Recebimento'` e a coluna Financiador são PLACEHOLDER até o Contas a Receber subir
 * (core-api#114/receivables); quando ele nascer, virão do DTO real (mesmo shape `LedgerRow`).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  loadRelatorioGeral,
  total as computeTotal,
  buildCsv,
  totalPages,
  pageSlice,
  PER_PAGE_DEFAULT,
  GENERAL_COLUMNS,
  ALL_GENERAL_COLUMN_IDS,
  type GeneralColumnId,
} from '../relatorio-geral.view-model.ts'
import { RelatorioGeralTable, type VisibleColumn } from '../components/relatorio-geral-table.component.tsx'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
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
  exportTrigger,
  columnsWrap,
  columnsBackdrop,
  columnsMenu,
  columnsItem,
  columnsCheck,
} from './relatorio-geral.page.css.ts'

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

export function RelatorioGeralPage(): ReactNode {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  // UI-state (§XI): quais colunas ficam visíveis. Padrão = todas. É estado de UI, não server-state.
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<GeneralColumnId>>(
    () => new Set(ALL_GENERAL_COLUMN_IDS),
  )
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT)

  const rows = useMemo(() => loadRelatorioGeral(), [])
  const totalCount = useMemo(() => computeTotal(rows), [rows])
  const pages = totalPages(totalCount, perPage)
  const pageRows = useMemo(() => pageSlice(rows, page, perPage), [rows, page, perPage])

  // Colunas visíveis na ORDEM do legado (fonte única filtrada pela seleção) — dirige tabela + export.
  const visibleColumns = useMemo<readonly VisibleColumn[]>(
    () =>
      GENERAL_COLUMNS.filter((c) => visibleIds.has(c.id)).map((c) => ({
        id: c.id,
        kind: c.kind,
        label: COLUMN_LABEL[c.id],
      })),
    [visibleIds],
  )

  /** Marca/desmarca uma coluna (imutável, §VII). */
  const toggleColumn = (id: GeneralColumnId): void => {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
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
        <h1 className={headTitle}>{t('reports.geral.title')}</h1>
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
              // Export segue O QUE ESTÁ NA TELA (só as colunas visíveis, na ordem).
              downloadCsv(
                'relatorio-geral.csv',
                buildCsv(
                  rows,
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

      {/* Filtros recolhíveis (placeholders visuais front-first) */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField
            label={t('reports.geral.filters.periodo')}
            options={[t('reports.geral.filters.allOption')]}
          />
          <FilterField
            label={t('reports.geral.filters.tipo')}
            options={[t('reports.geral.filters.allOption')]}
          />
          <FilterField
            label={t('reports.geral.filters.fornecedor')}
            options={[t('reports.geral.filters.allOption')]}
          />
          <FilterField
            label={t('reports.geral.filters.centro')}
            options={[t('reports.geral.filters.allOption')]}
          />
          <FilterField
            label={t('reports.geral.filters.categoria')}
            options={[t('reports.geral.filters.allOption')]}
          />
          <button type="button" className={applyButton}>
            {t('reports.geral.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* Tabela paginada (colunas visíveis, scroll horizontal) */}
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
          setPage(1) // troca de "itens por página" volta para a 1ª página
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
