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
import { useDocumentTimeline } from '../document-timeline.binding.ts'
import { useBulkStatus } from '../bulk-status.binding.ts'
import { useBulkDelete } from '../bulk-delete.binding.ts'
import { useIsolatedDueDate } from '../isolated-due-date.binding.ts'
import { useBulkPay, type PayTarget } from '../bulk-pay.binding.ts'
import { useRemittancePreview } from '../remittance-preview.binding.ts'
import {
  STATUS_CHIPS,
  sumSelectedNetBRL,
  sumSelectedGrossBRL,
  filterByLabel,
  filterRowsBySearch,
  filterRowsByTipo,
  deriveTitleActionTargets,
  pageInfo,
  type ListState,
} from '../contas-a-pagar.view-model.ts'
import {
  deriveRemittanceSelection,
  toPreviewView,
  toAccountOptions,
  toReceiptView,
} from '../remittance-preview.view-model.ts'
import { DocumentGrid } from '../components/document-grid.component.tsx'
import { AddFilterButton, ActiveFiltersRow } from '../components/document-filters.component.tsx'
import { SavedViewsMenu } from '../components/saved-views-menu.component.tsx'
import { DocumentDetailDrawer, type DrawerTab } from '../components/document-detail-drawer.component.tsx'
import { DeleteConfirmModal } from '../components/delete-confirm.component.tsx'
import { DueDateModal } from '../components/due-date-modal.component.tsx'
import { PaymentDateModal } from '../components/payment-date-modal.component.tsx'
import { ExportDropdown } from '../components/export-dropdown.component.tsx'
import { StatusActions } from '../components/status-actions.component.tsx'
import { RemittancePreviewModal } from '../components/remittance-preview-modal.component.tsx'
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
  chipCount,
  chipCountOnActive,
  chipDot,
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
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export function ContasAPagarPage(): ReactNode {
  const navigate = useNavigate()
  const {
    state,
    viewMode,
    titleState,
    pageSize,
    selectedStatus,
    statusCounts,
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
    savedViews,
    onSaveView,
    onApplyView,
    onDeleteView,
    onPrev,
    onNext,
    onPageSize,
    page: currentPage,
    onResetPage,
  } = useContasAPagar()
  // Busca rápida do topo — client-side, mas agora sobre o conjunto COMPLETO do filtro (specs/101): no modo
  // título o BFF traz todas as páginas. Volta a ser server-side quando o /payable-titles aceitar `q`.
  const [search, setSearch] = useState('')
  // #201: o grid (e toda a seleção) opera sobre o modo ativo — documento (atual) ou título (pai+filhos).
  // Em modo documento, `baseState === state` → comportamento idêntico (sem regressão).
  const baseState = viewMode === 'title' ? titleState : state
  const allRows = baseState.tag === 'ready' ? baseState.rows : []
  // specs/101: `rows` é o conjunto COMPLETO do filtro, já refinado pela busca e pelo Tipo=imposto (ambos
  // client-side). No modo título o BFF traz todas as páginas, então a busca cruza tudo o que o filtro
  // alcança — e a REMESSA enxerga o mesmo conjunto, em vez de só a página visível.
  const rows = filterRowsByTipo(filterRowsBySearch(allRows, search), filters.tipo)
  // A paginação passou a ser recorte de EXIBIÇÃO sobre esse conjunto. Uma fonte só para grid, seleção,
  // somatórios e Exportar — duas fontes foi o que fez a seleção de outra página sumir do lote.
  const slicePage = pageInfo(currentPage, pageSize, rows.length)
  const page = baseState.tag === 'ready' ? slicePage : null
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  // Estado passado ao grid: linhas filtradas; se o filtro zerar os resultados, mostra o vazio.
  const gridState: ListState =
    baseState.tag === 'ready'
      ? rows.length === 0
        ? { tag: 'empty' }
        : { tag: 'ready', rows: visibleRows, page: slicePage }
      : baseState

  // UI-state local (toggles), no padrão dos demais (selectedId/selected): menu "Adicionar filtro".
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  // Menu "Visões salvas" (#351) — toggle local, mesmo padrão do menu de filtros.
  const [savedViewsMenuOpen, setSavedViewsMenuOpen] = useState(false)
  // Busca/autocomplete do filtro Fornecedor (texto digitado + dropdown de resultados).
  const [fornecedorQuery, setFornecedorQuery] = useState('')
  const [fornecedorOpen, setFornecedorOpen] = useState(false)
  const supplierMatches = filterByLabel(supplierOptions, fornecedorQuery)

  // Linha clicável: Rascunho → tela de Lançar (finalizar inclusão); demais status → drawer de detalhe.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detail = useDocumentDetail(selectedId)
  // Aba do drawer (Detalhes | Histórico). O Histórico busca a trilha só quando a aba está ativa.
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('detalhes')
  const timeline = useDocumentTimeline(selectedId, drawerTab === 'historico')
  const openDrawer = (documentId: string): void => {
    setDrawerTab('detalhes') // sempre abre em Detalhes
    setSelectedId(documentId)
  }

  // ── Seleção em massa (mock): checkbox por linha + "selecionar todos" + somatório do líquido ──
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const selectedCount = selected.size
  const allSelected = visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id))
  const selectedGross = sumSelectedGrossBRL(rows, selected)
  const selectedSum = sumSelectedNetBRL(rows, selected)
  const exportRows = selectedCount > 0 ? rows.filter((r) => selected.has(r.id)) : rows
  // A REMESSA opera SÓ sobre a seleção do operador — nunca o "todos" do `exportRows` (que o CSV/PDF usam
  // quando não há seleção). O usuário escolhe o que pagar, e todos precisam vencer no MESMO dia; por isso,
  // sem seleção, nada é remessável (CNAB desabilitado) e o modal não pode abrir com "todos os aprovados".
  const remittanceRows = rows.filter((r) => selected.has(r.id))
  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = (): void => {
    setSelected((prev) =>
      visibleRows.every((r) => prev.has(r.id)) ? new Set() : new Set(visibleRows.map((r) => r.id)),
    )
  }
  const clearSelection = (): void => {
    setSelected(new Set())
  }

  // ── #201/#229: ações em massa derivadas da PRÓPRIA LINHA (status do título + version do documento, que
  //    o #229 trouxe na linha) — sem buscar o documento. O ciclo de status é do título; Aprovar/Reabrir/
  //    Excluir/Vencimento são transições do documento (Aprovar cascateia pai→filhos), agregadas por doc
  //    (dedup). A baixa (Marcar como pago) é por título, independente. Backend valida transição inválida. ──
  const titleTargets = deriveTitleActionTargets(rows, selected)

  // VAN (core-api#728): PRÉ-VOO do lote, disparado pelo item CNAB do "Exportar". A origem é a MESMA do
  // CSV/PDF (`exportRows`: a seleção, ou o que está na tela quando não há seleção) — o operador não
  // deveria descobrir que "Exportar" recorta diferente conforme o formato.
  // `deriveRemittanceSelection` dedup por documento e barra o que não está Aprovado ANTES da chamada: o
  // core-api lê os documentos por id, sem exigir aprovação (core-api#736), e um Rascunho voltaria apto.
  const remittanceSelection = deriveRemittanceSelection(remittanceRows)

  const remittance = useRemittancePreview()
  // A conferência lista UM POR TÍTULO selecionado (não por documento): um documento com retenção rende o
  // título do fornecedor e o do imposto, com favorecidos e valores diferentes.
  const remittanceView =
    remittance.preview === null
      ? null
      : toPreviewView(remittance.preview, remittanceRows, remittance.unchecked)

  // ── Mudar Status em massa: Aprovar (Aberto→Aprovado) · Voltar p/ edição (Aprovado→Aberto) ──
  const bulk = useBulkStatus(clearSelection)

  // ── Alterar vencimento (1+) — modal com seletor de data; aplica a cada Aberto via PATCH. ──
  const [dueOpen, setDueOpen] = useState(false)
  const [dueValue, setDueValue] = useState('')
  const dueEdit = useIsolatedDueDate(() => {
    clearSelection()
    setDueOpen(false)
    setDueValue('')
  })

  // ── Excluir (hard-delete) em massa — só Aberto (Rascunho dá 409, core-api#166). Modal de confirmação. ──
  const [deleteOpen, setDeleteOpen] = useState(false)
  const del = useBulkDelete(() => {
    clearSelection()
    setDeleteOpen(false)
  })

  // ── Marcar como pago (baixa manual, #224/#232) — por TÍTULO Aprovado (Aprovado→Pago). Abre modal p/
  //    INFORMAR a data de pagamento (= saída bancária, retroativa). `version` (do documento) e elegibilidade
  //    (status do título) vêm da própria linha (#229); títulos do mesmo doc são baixados em sequência. ──
  const [payOpen, setPayOpen] = useState(false)
  const [payValue, setPayValue] = useState('')
  const pay = useBulkPay(() => {
    clearSelection()
    setPayOpen(false)
    setPayValue('')
  })
  // Elegíveis (sem a data — ela vem do modal). paidAt é anexado no apply. Por TÍTULO (não dedupa por doc).
  const payEligible = rows
    .filter((r) => selected.has(r.id) && r.status === 'Aprovado')
    .map((r) => ({ documentId: r.documentId, payableId: r.id, version: r.version }))
  const applyPay = (): void => {
    const targets: readonly PayTarget[] = payEligible.map((t) => ({ ...t, paidAt: payValue }))
    pay.pay(targets)
  }

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
              onResetPage() // a busca recorta o conjunto: ficar na página 5 de 1 resultado mostraria vazio
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
            // Contagem por status (paridade Conciliação). null = carregando/erro → oculta o badge.
            const count = statusCounts[c.key]
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
                {/* Bolinha com a cor do status (Todos = sem bolinha). */}
                {c.status !== null ? <span className={chipDot[c.status]} aria-hidden="true" /> : null}
                {t(c.labelTag)}
                {count != null ? (
                  <span className={active ? chipCountOnActive : chipCount}>{String(count)}</span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className={fbarRight}>
          <SavedViewsMenu
            menuOpen={savedViewsMenuOpen}
            onToggleMenu={() => {
              setSavedViewsMenuOpen((v) => !v)
            }}
            onCloseMenu={() => {
              setSavedViewsMenuOpen(false)
            }}
            savedViews={savedViews}
            onSaveView={onSaveView}
            onApplyView={(id) => {
              // Aplicar uma visão pode restaurar o filtro Fornecedor → limpa a busca/autocomplete local
              // (o rótulo do combo não faz parte da visão; o valor sim, via onApplyView → filters).
              setFornecedorQuery('')
              setFornecedorOpen(false)
              onApplyView(id)
            }}
            onDeleteView={onDeleteView}
          />
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
          {/* O NÚMERO de títulos que ficaram para trás entra no texto: "alguns" não diz se foi 1 de 10
              ou 9 de 10, e a decisão do operador muda bastante entre os dois. */}
          {t(dueEdit.errorTag).replace('{n}', String(dueEdit.failedCount))}
        </div>
      ) : null}

      <div className={gridWrap}>
        <DocumentGrid
          state={gridState}
          onRowClick={(id, status, documentId) => {
            // #201: no modo título, abre o DRAWER do documento (documentId); seleção/checkbox usa o
            // payableId. Rascunho (só no modo documento) → Lançar p/ finalizar a inclusão.
            if (status === 'Rascunho') {
              void navigate({ to: '/financeiro/contas-a-pagar/lancar', search: { id } })
            } else {
              openDrawer(documentId)
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
          payeeBank={detail.payeeBank}
          activeTab={drawerTab}
          onTab={setDrawerTab}
          timeline={timeline.state}
          onClose={() => {
            setSelectedId(null)
          }}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteOpen}
        count={titleTargets.deletable.length}
        draftCount={titleTargets.draftCount}
        running={del.running}
        onConfirm={() => {
          del.remove(titleTargets.deletable)
        }}
        onCancel={() => {
          setDeleteOpen(false)
        }}
      />

      <DueDateModal
        open={dueOpen}
        count={titleTargets.dueEditable.length}
        blockedCount={titleTargets.dueBlockedCount}
        value={dueValue}
        running={dueEdit.running}
        onChange={setDueValue}
        onApply={() => {
          dueEdit.apply(titleTargets.dueEditable, dueValue)
        }}
        onCancel={() => {
          setDueOpen(false)
        }}
      />

      <PaymentDateModal
        open={payOpen}
        count={payEligible.length}
        value={payValue}
        running={pay.running}
        onChange={setPayValue}
        onApply={applyPay}
        onCancel={() => {
          setPayOpen(false)
        }}
      />

      <RemittancePreviewModal
        open={remittance.open}
        running={remittance.running}
        view={remittanceView}
        errorTag={remittance.errorTag}
        notApprovedCount={remittanceSelection.notApprovedCount}
        onToggle={remittance.toggle}
        onClose={remittance.close}
        accounts={toAccountOptions(remittance.accounts)}
        cedenteAccountId={remittance.cedenteAccountId}
        onCedenteAccount={remittance.setCedenteAccountId}
        confirming={remittance.confirming}
        onArm={remittance.arm}
        onDisarm={remittance.disarm}
        generating={remittance.generating}
        generated={remittance.generated === null ? null : toReceiptView(remittance.generated)}
        generateErrorTag={remittance.generateErrorTag}
        generateErrorMessage={remittance.generateErrorMessage}
        onGenerate={() => {
          // Vai só o que está MARCADO — dedup por documento, direto do ViewModel.
          remittance.generate(remittanceView?.checkedPayableIds ?? [])
        }}
        downloading={remittance.downloading}
        downloadErrorTag={remittance.downloadErrorTag}
        downloadErrorMessage={remittance.downloadErrorMessage}
        downloadedFromFailures={remittance.downloadedFromFailures}
        onDownload={remittance.downloadFile}
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
            {/* #201/#229: ações em massa derivadas da própria linha (status do título + version do doc).
                Aprovar/Reabrir/Excluir/Vencimento agregam por documento (Aprovar cascateia pai→filhos);
                Marcar como pago é por título. Sem busca extra ao documento. */}
            {/* Alterar vencimento de 1+ títulos Aberto (abre o modal); aplica via PATCH por documento. */}
            <button
              type="button"
              className={selClear}
              disabled={titleTargets.dueEditable.length === 0 || dueEdit.running}
              title={titleTargets.dueEditable.length === 0 ? t('financial.list.dueDate.needOpen') : undefined}
              onClick={() => {
                setDueOpen(true)
              }}
            >
              {t('financial.list.dueDate.bulk')}
            </button>
            <StatusActions
              canApprove={titleTargets.approve.length > 0}
              canReopen={titleTargets.reopen.length > 0}
              canDelete={titleTargets.deletable.length > 0}
              canPay={payEligible.length > 0}
              running={bulk.running || del.running || pay.running}
              onApprove={() => {
                bulk.approve(titleTargets.approve)
              }}
              onReopen={() => {
                bulk.reopen(titleTargets.reopen)
              }}
              onDelete={() => {
                setDeleteOpen(true)
              }}
              onPay={() => {
                setPayOpen(true)
              }}
            />
            {bulk.errorTag !== null ? <span className={selError}>{t(bulk.errorTag)}</span> : null}
            {del.errorTag !== null ? <span className={selError}>{t(del.errorTag)}</span> : null}
            {pay.errorTag !== null ? <span className={selError}>{t(pay.errorTag)}</span> : null}
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
          {page !== null ? (
            <ExportDropdown
              rows={exportRows}
              remittanceDisabled={remittanceSelection.payableIds.length === 0 || remittance.running}
              onCheckRemittance={() => {
                remittance.start(remittanceSelection.payableIds)
              }}
            />
          ) : null}
          <Link to="/financeiro/contas-a-pagar/lancar" className={newButton}>
            {t('financial.list.new')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
