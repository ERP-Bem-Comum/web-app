/**
 * Contas a Pagar — PAGE (view burra §XI). Estrutura fiel ao Figma 205-638: filter-bar (busca + status-chips
 * segmented-control) + grid + bottombar (footer no padrão Contratos: paginação + "por página" + Exportar +
 * Novo Documento). Título vem do PageHeader do shell (Nunito). Busca e contadores por-aba = CHROME no v1
 * (Fatia 2 não faz busca textual nem agrega); só "Todos" mostra o total real. Exportar (CSV/PDF) = client-side.
 */
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { SearchIcon } from '#shared/ui/icons/index.ts'

import { useContasAPagar } from '../contas-a-pagar.binding.ts'
import { useDocumentDetail } from '../document-detail.binding.ts'
import { useBulkStatus } from '../bulk-status.binding.ts'
import { useBulkDelete } from '../bulk-delete.binding.ts'
import { useBulkDueDate } from '../bulk-due-date.binding.ts'
import {
  STATUS_CHIPS,
  sumSelectedNetBRL,
  sumSelectedGrossBRL,
  bulkStatusTargets,
  bulkDeleteTargets,
  bulkDueDateTargets,
  filterByLabel,
  filterRowsBySearch,
  type ListState,
} from '../contas-a-pagar.view-model.ts'
import { DocumentGrid } from '../components/document-grid.component.tsx'
import { AddFilterButton, ActiveFiltersRow } from '../components/document-filters.component.tsx'
import { DocumentDetailDrawer } from '../components/document-detail-drawer.component.tsx'
import { DeleteConfirmModal } from '../components/delete-confirm.component.tsx'
import { DueDateModal } from '../components/due-date-modal.component.tsx'
import { ExportDropdown } from '../components/export-dropdown.component.tsx'
import { StatusActions } from '../components/status-actions.component.tsx'
import {
  screen,
  filterBar,
  searchWrap,
  searchIcon,
  searchInput,
  statusChips,
  chip,
  chipActive,
  chipDisabled,
  chipCountOnActive,
  fbarRight,
  gridWrap,
  errorBanner,
  bottombar,
  footerActions,
  newButton,
  pagination,
  pageRange,
  separator,
  select,
  perPageLabel,
  pageNav,
  pageBtn,
  selBar,
  selCount,
  selSum,
  selSumLabel,
  selClear,
  selError,
} from './contas-a-pagar.css.ts'

const t = createTranslator(ptBR)
const PAGE_SIZE_OPTIONS = [5, 10, 12, 25, 50] as const

export function ContasAPagarPage(): ReactNode {
  const navigate = useNavigate()
  const {
    state,
    pageSize,
    selectedStatus,
    onStatusFilter,
    activeDims,
    filters,
    supplierOptions,
    onAddFilter,
    onRemoveFilter,
    onSetVencimento,
    onSetEmissao,
    onSetTipo,
    onSetFornecedor,
    onClearFilters,
    onPrev,
    onNext,
    onPageSize,
  } = useContasAPagar()
  // Busca rápida do topo — filtra CLIENT-SIDE as linhas da página carregada (core-api#167 = server-side).
  const [search, setSearch] = useState('')
  const page = state.tag === 'ready' ? state.page : null
  const allRows = state.tag === 'ready' ? state.rows : []
  const rows = filterRowsBySearch(allRows, search)
  // Estado passado ao grid: linhas filtradas; se a busca zerar os resultados, mostra o vazio.
  const gridState: ListState =
    state.tag === 'ready'
      ? rows.length === 0 && search.trim() !== ''
        ? { tag: 'empty' }
        : { tag: 'ready', rows, page: state.page }
      : state

  // UI-state local (toggles), no padrão dos demais (selectedId/selected): menu "Adicionar filtro".
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  // Busca/autocomplete do filtro Fornecedor (texto digitado + dropdown de resultados).
  const [fornecedorQuery, setFornecedorQuery] = useState('')
  const [fornecedorOpen, setFornecedorOpen] = useState(false)
  const supplierMatches = filterByLabel(supplierOptions, fornecedorQuery)

  // Linha clicável: Rascunho → tela de Lançar (finalizar inclusão); demais status → drawer de detalhe.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detail = useDocumentDetail(selectedId)

  // ── Seleção em massa (mock): checkbox por linha + "selecionar todos" + somatório do líquido ──
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const selectedGross = sumSelectedGrossBRL(rows, selected)
  const selectedSum = sumSelectedNetBRL(rows, selected)
  const exportRows = selectedCount > 0 ? rows.filter((r) => selected.has(r.id)) : rows
  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = (): void => {
    setSelected((prev) => (rows.every((r) => prev.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))))
  }
  const clearSelection = (): void => {
    setSelected(new Set())
  }

  // ── Mudar Status em massa: Aprovar (Aberto→Aprovado) · Voltar p/ edição (Aprovado→Aberto) ──
  const bulk = useBulkStatus(clearSelection)
  const targets = bulkStatusTargets(rows, selected)

  // ── Alterar vencimento (1+) — modal com seletor de data; aplica a cada Aberto via PATCH (core-api#162
  //    é só otimização). A edição de UM título também pode ser feita pelo drawer → "Editar pagamento". ──
  const [dueOpen, setDueOpen] = useState(false)
  const [dueValue, setDueValue] = useState('')
  const dueEdit = useBulkDueDate(() => {
    clearSelection()
    setDueOpen(false)
    setDueValue('')
  })
  const dueTargets = bulkDueDateTargets(rows, selected)

  // ── Excluir (hard-delete) em massa — só Aberto (Rascunho dá 409, core-api#166). Modal de confirmação. ──
  const [deleteOpen, setDeleteOpen] = useState(false)
  const del = useBulkDelete(() => {
    clearSelection()
    setDeleteOpen(false)
  })
  const deleteTargets = bulkDeleteTargets(rows, selected)

  return (
    <div className={screen}>
      <div className={filterBar}>
        <div className={searchWrap}>
          <span className={searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          {/* Busca rápida CLIENT-SIDE da página carregada (fornecedor/número/CNPJ). Server-side = #167. */}
          <input
            className={searchInput}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            placeholder={t('financial.list.search')}
            aria-label={t('financial.list.search')}
          />
        </div>

        <div className={statusChips} role="group" aria-label={t('financial.list.statusFilter')}>
          {STATUS_CHIPS.map((c) => {
            const active = c.status === selectedStatus
            // Estados que o backend ainda não produz ficam desabilitados (chrome honesto).
            const cls = !c.filterable ? chipDisabled : active ? chipActive : chip
            return (
              <button
                key={c.key}
                type="button"
                className={cls}
                disabled={!c.filterable}
                aria-pressed={active}
                onClick={() => {
                  if (c.filterable) onStatusFilter(c.status)
                }}
              >
                {t(c.labelTag)}
                {/* Contador real só no chip ATIVO (= total da consulta filtrada; lista paginada no servidor). */}
                {active && page !== null ? (
                  <span className={chipCountOnActive}>{String(page.total)}</span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className={fbarRight}>
          <AddFilterButton
            menuOpen={filterMenuOpen}
            onToggleMenu={() => {
              setFilterMenuOpen((v) => !v)
            }}
            onCloseMenu={() => {
              setFilterMenuOpen(false)
            }}
            activeDims={activeDims}
            onAddFilter={onAddFilter}
          />
        </div>
      </div>

      <ActiveFiltersRow
        activeDims={activeDims}
        filters={filters}
        onRemoveFilter={(id) => {
          if (id === 'fornecedor') {
            setFornecedorQuery('')
            setFornecedorOpen(false)
          }
          onRemoveFilter(id)
        }}
        onSetVencimento={onSetVencimento}
        onSetEmissao={onSetEmissao}
        onSetTipo={onSetTipo}
        onClearFilters={() => {
          setFornecedorQuery('')
          setFornecedorOpen(false)
          onClearFilters()
        }}
        fornecedorQuery={fornecedorQuery}
        fornecedorOpen={fornecedorOpen}
        supplierMatches={supplierMatches}
        onFornecedorQuery={(q) => {
          setFornecedorQuery(q)
          setFornecedorOpen(true)
        }}
        onPickFornecedor={(o) => {
          onSetFornecedor(o.value)
          setFornecedorQuery(o.label)
          setFornecedorOpen(false)
        }}
      />

      {dueEdit.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(dueEdit.errorTag)}
        </div>
      ) : null}

      <div className={gridWrap}>
        <DocumentGrid
          state={gridState}
          onRowClick={(id, status) => {
            // Rascunho → abre o Lançar p/ FINALIZAR a inclusão (modo draft, tudo editável).
            // Demais status → drawer de detalhe.
            if (status === 'Rascunho') {
              void navigate({ to: '/financeiro/contas-a-pagar/lancar', search: { id } })
            } else {
              setSelectedId(id)
            }
          }}
          activeId={selectedId}
          selectedIds={selected}
          allSelected={allSelected}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
      </div>

      {detail.view !== null ? (
        <DocumentDetailDrawer
          view={detail.view}
          onClose={() => {
            setSelectedId(null)
          }}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteOpen}
        count={deleteTargets.deletable.length}
        draftCount={deleteTargets.draftCount}
        running={del.running}
        onConfirm={() => {
          del.remove(deleteTargets.deletable)
        }}
        onCancel={() => {
          setDeleteOpen(false)
        }}
      />

      <DueDateModal
        open={dueOpen}
        count={dueTargets.editable.length}
        blockedCount={dueTargets.blockedCount}
        value={dueValue}
        running={dueEdit.running}
        onChange={setDueValue}
        onApply={() => {
          dueEdit.apply(dueTargets.editable, dueValue)
        }}
        onCancel={() => {
          setDueOpen(false)
        }}
      />

      <footer className={bottombar}>
        {selectedCount > 0 ? (
          <div className={selBar}>
            <span className={selCount}>
              <strong>{selectedCount}</strong> {t('financial.list.selection.selected')}
            </span>
            <span className={selSumLabel}>{t('financial.list.selection.sumGrossLabel')}</span>
            <span className={selSum}>{selectedGross}</span>
            <span className={selSumLabel}>{t('financial.list.selection.sumLabel')}</span>
            <span className={selSum}>{selectedSum}</span>
            <button type="button" className={selClear} onClick={clearSelection}>
              {t('financial.list.selection.clear')}
            </button>
            {/* Alterar vencimento de 1+ títulos Aberto (abre o modal); aplica via PATCH por id. */}
            <button
              type="button"
              className={selClear}
              disabled={dueTargets.editable.length === 0 || dueEdit.running}
              title={dueTargets.editable.length === 0 ? t('financial.list.dueDate.needOpen') : undefined}
              onClick={() => {
                setDueOpen(true)
              }}
            >
              {t('financial.list.dueDate.bulk')}
            </button>
            <StatusActions
              canApprove={targets.approve.length > 0}
              canReopen={targets.reopen.length > 0}
              canDelete={deleteTargets.deletable.length > 0}
              running={bulk.running || del.running}
              onApprove={() => {
                bulk.approve(targets.approve)
              }}
              onReopen={() => {
                bulk.reopen(targets.reopen)
              }}
              onDelete={() => {
                setDeleteOpen(true)
              }}
            />
            {bulk.errorTag !== null ? <span className={selError}>{t(bulk.errorTag)}</span> : null}
            {del.errorTag !== null ? <span className={selError}>{t(del.errorTag)}</span> : null}
          </div>
        ) : page !== null ? (
          <nav className={pagination} aria-label={t('financial.list.pagination')}>
            <span className={pageRange}>{page.rangeLabel}</span>
            <span className={separator} aria-hidden="true">
              ·
            </span>
            <select
              className={select}
              value={pageSize}
              onChange={(e) => {
                onPageSize(Number(e.target.value))
              }}
              aria-label={t('financial.list.perPage')}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className={perPageLabel}>{t('financial.list.perPage')}</span>
            <div className={pageNav}>
              <button
                type="button"
                className={pageBtn}
                onClick={onPrev}
                disabled={!page.hasPrev}
                aria-label={t('financial.list.prev')}
              >
                ‹
              </button>
              <button
                type="button"
                className={pageBtn}
                onClick={onNext}
                disabled={!page.hasNext}
                aria-label={t('financial.list.next')}
              >
                ›
              </button>
            </div>
          </nav>
        ) : null}

        <div className={footerActions}>
          {page !== null ? <ExportDropdown rows={exportRows} /> : null}
          <Link to="/financeiro/contas-a-pagar/lancar" className={newButton}>
            {t('financial.list.new')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
