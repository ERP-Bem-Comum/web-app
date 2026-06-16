/**
 * DocumentGrid — view BURRA (§XI): recebe o `ListState` por prop e renderiza cabeçalho + corpo
 * (loading / error / empty / linhas). Sem hooks de dados/estado. Colunas finas do DTO (Fatia 2);
 * valores monetários em fonte mono; badge de status por variante de cor (tokens).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { AvatarLabel, initialsFrom, Checkbox } from '#shared/ui/index.ts'

import {
  COLUMNS,
  type ListState,
  type DocumentStatus,
  type PartnerKind,
} from '../contas-a-pagar.view-model.ts'
import {
  grid,
  head,
  headCell,
  headCellRight,
  row,
  rowClickable,
  rowSelected,
  cellCheckbox,
  cell,
  cellMutedDoc,
  cellNet,
  typeBadge,
  typeBadgeVariant,
  statusBadge,
  statusVariant,
  placeholder,
  placeholderTitle,
  errorBanner,
} from '../page/contas-a-pagar.css.ts'

const DASH = '—'

// Variante de cor do badge de TIPO: por DocumentType; tipo desconhecido → neutro.
const typeClass = (type: string): string =>
  `${typeBadge} ${type in typeBadgeVariant ? typeBadgeVariant[type as keyof typeof typeBadgeVariant] : typeBadgeVariant.neutral}`

// Cor do avatar pela regra de parceiro; sem tipo conhecido → 'supplier' (azul da marca).
const avatarVariantOf = (kind: PartnerKind | null): 'supplier' | 'collaborator' | 'financier' | 'act' =>
  kind ?? 'supplier'

const t = createTranslator(ptBR)

export type DocumentGridProps = Readonly<{
  state: ListState
  onRowClick?: (id: string, status: DocumentStatus) => void
  // Seleção (mock): checkbox por linha + "selecionar todos". Opcional (aditivo — sem isso, sem coluna).
  selectedIds?: ReadonlySet<string>
  allSelected?: boolean
  onToggle?: (id: string) => void
  onToggleAll?: () => void
  // Linha cujo detalhe está aberto no drawer — fica realçada (selecionada), igual ao mock.
  activeId?: string | null
}>

export function DocumentGrid(props: DocumentGridProps): ReactNode {
  const { state, selectedIds, onToggle, onToggleAll } = props
  const selectable = onToggle !== undefined

  return (
    <div className={grid}>
      <div className={head} role="row">
        <span className={cellCheckbox}>
          {selectable ? (
            <Checkbox id="cb-all" checked={props.allSelected ?? false} onChange={() => onToggleAll?.()} />
          ) : null}
        </span>
        {COLUMNS.map((c) => (
          <span key={c.key} className={c.align === 'right' ? headCellRight : headCell}>
            {t(c.labelTag)}
          </span>
        ))}
      </div>

      {state.tag === 'loading' ? (
        <p className={placeholder}>{t('financial.list.loading')}</p>
      ) : state.tag === 'error' ? (
        <div className={errorBanner} role="alert">
          {t(state.errorTag)}
        </div>
      ) : state.tag === 'empty' ? (
        <div className={placeholder}>
          <span className={placeholderTitle}>{t('financial.list.empty.title')}</span>
          <span>{t('financial.list.empty.hint')}</span>
        </div>
      ) : (
        state.rows.map((r) => {
          const isChecked = selectedIds?.has(r.id) ?? false // estado da checkbox (seleção em massa)
          const isActive = props.activeId === r.id // linha com o drawer aberto
          return (
            <div
              className={`${row} ${rowClickable}${isChecked || isActive ? ` ${rowSelected}` : ''}`}
              role="button"
              tabIndex={0}
              key={r.id}
              onClick={() => {
                props.onRowClick?.(r.id, r.status)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  props.onRowClick?.(r.id, r.status)
                }
              }}
            >
              <span
                className={cellCheckbox}
                onClick={(e) => {
                  e.stopPropagation() // marcar não abre o drawer
                }}
                onKeyDown={(e) => {
                  e.stopPropagation()
                }}
                role="presentation"
              >
                {selectable ? (
                  <Checkbox
                    id={`cb-${r.id}`}
                    checked={isChecked}
                    onChange={() => {
                      onToggle(r.id)
                    }}
                  />
                ) : null}
              </span>
              {r.type === DASH ? (
                <span className={cell}>{r.type}</span>
              ) : (
                <span className={typeClass(r.type)}>{r.type}</span>
              )}
              <span className={cellMutedDoc}>{r.documentNumber}</span>
              {r.supplier === DASH ? (
                <span className={cell}>{r.supplier}</span>
              ) : (
                <AvatarLabel
                  initials={initialsFrom(r.supplier)}
                  variant={avatarVariantOf(r.supplierKind)}
                  text={r.supplier}
                  subtitle={r.supplierDoc}
                />
              )}
              <span className={cell}>{r.due}</span>
              <span className={cellNet}>{r.net}</span>
              <span className={`${statusBadge} ${statusVariant[r.status]}`}>{r.status}</span>
            </div>
          )
        })
      )}
    </div>
  )
}
