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
import {
  STATUS_CHIPS,
  sumSelectedNetBRL,
  sumSelectedGrossBRL,
  bulkStatusTargets,
} from '../contas-a-pagar.view-model.ts'
import { DocumentGrid } from '../components/document-grid.component.tsx'
import { DocumentDetailDrawer } from '../components/document-detail-drawer.component.tsx'
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
  chipCountOnActive,
  gridWrap,
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
  const { state, pageSize, onPrev, onNext, onPageSize } = useContasAPagar()
  const page = state.tag === 'ready' ? state.page : null
  const rows = state.tag === 'ready' ? state.rows : []

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

  return (
    <div className={screen}>
      <div className={filterBar}>
        <div className={searchWrap}>
          <span className={searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          {/* Busca = CHROME no v1 (Fatia 2 não tem busca textual). */}
          <input
            className={searchInput}
            type="text"
            placeholder={t('financial.list.search')}
            aria-label={t('financial.list.search')}
          />
        </div>

        <div className={statusChips}>
          {STATUS_CHIPS.map((c, i) => {
            const active = i === 0 // "Todos" ativo (chrome — chips não filtram no v1)
            return (
              <span key={c.key} className={active ? chipActive : chip}>
                {t(c.labelTag)}
                {active && page !== null ? (
                  <span className={chipCountOnActive}>{String(page.total)}</span>
                ) : null}
              </span>
            )
          })}
        </div>
      </div>

      <div className={gridWrap}>
        <DocumentGrid
          state={state}
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
            <StatusActions
              canApprove={targets.approve.length > 0}
              canReopen={targets.reopen.length > 0}
              running={bulk.running}
              onApprove={() => {
                bulk.approve(targets.approve)
              }}
              onReopen={() => {
                bulk.reopen(targets.reopen)
              }}
            />
            {bulk.errorTag !== null ? <span className={selError}>{t(bulk.errorTag)}</span> : null}
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
