/**
 * Filtros avançados ("Adicionar filtro", estilo do mock) — views BURRAS (§XI). Dois pedaços, pois ocupam
 * lugares diferentes no DOM: `AddFilterButton` (botão + menu tipado, na filter-bar) e `ActiveFiltersRow`
 * (chips de filtro ativos, em linha própria abaixo da filter-bar). Só as dimensões com backend são
 * funcionais (Vencimento, Tipo, Fornecedor → server-side); as demais aparecem DESABILITADAS (chrome).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  FILTER_DIMS,
  FILTER_GROUPS,
  DOCUMENT_TYPE_OPTIONS,
  RETENTION_TYPE_OPTIONS,
  type FilterDimId,
  type AdvancedFilters,
  type TipoFilter,
} from '../contas-a-pagar.view-model.ts'
import type { SupplierOption } from '../contas-a-pagar.binding.ts'
import {
  fltWrap,
  addFilterBtn,
  addFilterLabel,
  addFilterMenu,
  menuGroupLabel,
  menuItem,
  menuItemDisabled,
  menuItemLabel,
  menuTypeTag,
  activeFilters,
  activeFiltersLabel,
  filterChip,
  filterChipLabel,
  filterChipInput,
  filterChipSelect,
  filterChipRange,
  filterChipRemove,
  filterCombo,
  filterChipSearch,
  filterComboList,
  filterComboItem,
  filterComboEmpty,
  clearAllFilters,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)
const emptyToUndef = (v: string): string | undefined => (v === '' ? undefined : v)

// ── Botão "Filtro · Adicionar" + menu tipado (agrupado) ───────────────────────
export type AddFilterButtonProps = Readonly<{
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  activeDims: ReadonlySet<FilterDimId>
  onAddFilter: (id: FilterDimId) => void
}>

export function AddFilterButton(props: AddFilterButtonProps): ReactNode {
  return (
    <div className={fltWrap}>
      <button type="button" className={addFilterBtn} onClick={props.onToggleMenu} aria-haspopup="menu">
        <span className={addFilterLabel}>{t('financial.list.filter.label')}</span>
        {t('financial.list.filter.add')}
      </button>

      {props.menuOpen ? (
        <div className={addFilterMenu} role="menu">
          {FILTER_GROUPS.map((groupTag) => {
            const dims = FILTER_DIMS.filter((d) => d.groupTag === groupTag && !props.activeDims.has(d.id))
            if (dims.length === 0) return null
            return (
              <div key={groupTag}>
                <div className={menuGroupLabel}>{t(groupTag)}</div>
                {dims.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="menuitem"
                    className={d.enabled ? menuItem : menuItemDisabled}
                    disabled={!d.enabled}
                    title={d.enabled ? undefined : t('financial.list.filter.soon')}
                    onClick={() => {
                      if (d.enabled) {
                        props.onAddFilter(d.id)
                        props.onCloseMenu()
                      }
                    }}
                  >
                    <span className={menuItemLabel}>{t(d.labelTag)}</span>
                    <span className={menuTypeTag}>{d.typeTag}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

// ── Linha de chips de filtro ativos ───────────────────────────────────────────
export type ActiveFiltersRowProps = Readonly<{
  activeDims: ReadonlySet<FilterDimId>
  filters: AdvancedFilters
  onRemoveFilter: (id: FilterDimId) => void
  onSetVencimento: (from: string | undefined, to: string | undefined) => void
  onSetEmissao: (from: string | undefined, to: string | undefined) => void
  onSetTipo: (tipo: TipoFilter | undefined) => void
  onClearFilters: () => void
  // Filtro Fornecedor = busca/autocomplete (pode haver inúmeros; não lista tudo num dropdown).
  fornecedorQuery: string
  fornecedorOpen: boolean
  supplierMatches: readonly SupplierOption[] // já filtrados + limitados (pela page)
  onFornecedorQuery: (q: string) => void
  onPickFornecedor: (option: SupplierOption) => void
}>

export function ActiveFiltersRow(props: ActiveFiltersRowProps): ReactNode {
  const { activeDims, filters } = props
  if (activeDims.size === 0) return null

  return (
    <div className={activeFilters}>
      <span className={activeFiltersLabel}>{t('financial.list.filter.activeLabel')}</span>

      {activeDims.has('vencimento') ? (
        <span className={filterChip}>
          <span className={filterChipLabel}>{t('financial.list.filter.dim.vencimento')}</span>
          <span className={filterChipRange}>
            <input
              type="date"
              className={filterChipInput}
              value={filters.vencimento?.from ?? ''}
              aria-label={t('financial.list.filter.from')}
              onChange={(e) => {
                props.onSetVencimento(emptyToUndef(e.target.value), filters.vencimento?.to)
              }}
            />
            <span aria-hidden="true">→</span>
            <input
              type="date"
              className={filterChipInput}
              value={filters.vencimento?.to ?? ''}
              aria-label={t('financial.list.filter.to')}
              onChange={(e) => {
                props.onSetVencimento(filters.vencimento?.from, emptyToUndef(e.target.value))
              }}
            />
          </span>
          <button
            type="button"
            className={filterChipRemove}
            aria-label={t('financial.list.filter.remove')}
            onClick={() => {
              props.onRemoveFilter('vencimento')
            }}
          >
            ×
          </button>
        </span>
      ) : null}

      {activeDims.has('emissao') ? (
        <span className={filterChip}>
          <span className={filterChipLabel}>{t('financial.list.filter.dim.emissao')}</span>
          <span className={filterChipRange}>
            <input
              type="date"
              className={filterChipInput}
              value={filters.emissao?.from ?? ''}
              aria-label={t('financial.list.filter.from')}
              onChange={(e) => {
                props.onSetEmissao(emptyToUndef(e.target.value), filters.emissao?.to)
              }}
            />
            <span aria-hidden="true">→</span>
            <input
              type="date"
              className={filterChipInput}
              value={filters.emissao?.to ?? ''}
              aria-label={t('financial.list.filter.to')}
              onChange={(e) => {
                props.onSetEmissao(filters.emissao?.from, emptyToUndef(e.target.value))
              }}
            />
          </span>
          <button
            type="button"
            className={filterChipRemove}
            aria-label={t('financial.list.filter.remove')}
            onClick={() => {
              props.onRemoveFilter('emissao')
            }}
          >
            ×
          </button>
        </span>
      ) : null}

      {activeDims.has('tipo') ? (
        <span className={filterChip}>
          <span className={filterChipLabel}>{t('financial.list.filter.dim.tipo')}</span>
          <select
            className={filterChipSelect}
            value={filters.tipo ?? ''}
            aria-label={t('financial.list.filter.dim.tipo')}
            onChange={(e) => {
              props.onSetTipo(e.target.value === '' ? undefined : (e.target.value as TipoFilter))
            }}
          >
            <option value="">{t('financial.list.filter.any')}</option>
            <optgroup label={t('financial.list.filter.tipo.group.documento')}>
              {DOCUMENT_TYPE_OPTIONS.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </optgroup>
            {/* #201: tipos dos títulos filhos (impostos) — filtra a página carregada (client-side). */}
            <optgroup label={t('financial.list.filter.tipo.group.imposto')}>
              {RETENTION_TYPE_OPTIONS.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            type="button"
            className={filterChipRemove}
            aria-label={t('financial.list.filter.remove')}
            onClick={() => {
              props.onRemoveFilter('tipo')
            }}
          >
            ×
          </button>
        </span>
      ) : null}

      {activeDims.has('fornecedor') ? (
        <span className={filterChip}>
          <span className={filterChipLabel}>{t('financial.list.filter.dim.fornecedor')}</span>
          {/* Busca/autocomplete: digita e escolhe; não lista todos num dropdown (podem ser inúmeros). */}
          <span className={filterCombo}>
            <input
              type="text"
              className={filterChipSearch}
              value={props.fornecedorQuery}
              placeholder={t('financial.list.filter.fornecedorSearch')}
              aria-label={t('financial.list.filter.dim.fornecedor')}
              onChange={(e) => {
                props.onFornecedorQuery(e.target.value)
              }}
            />
            {props.fornecedorOpen ? (
              <span className={filterComboList} role="listbox">
                {props.supplierMatches.length === 0 ? (
                  <span className={filterComboEmpty}>{t('financial.list.filter.noResults')}</span>
                ) : (
                  props.supplierMatches.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={filters.fornecedor === o.value}
                      className={filterComboItem}
                      // onMouseDown (não onClick) p/ disparar antes do blur do input.
                      onMouseDown={(e) => {
                        e.preventDefault()
                        props.onPickFornecedor(o)
                      }}
                    >
                      {o.label}
                    </button>
                  ))
                )}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            className={filterChipRemove}
            aria-label={t('financial.list.filter.remove')}
            onClick={() => {
              props.onRemoveFilter('fornecedor')
            }}
          >
            ×
          </button>
        </span>
      ) : null}

      <button type="button" className={clearAllFilters} onClick={props.onClearFilters}>
        {t('financial.list.filter.clearAll')}
      </button>
    </div>
  )
}
