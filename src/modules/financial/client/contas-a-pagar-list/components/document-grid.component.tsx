/**
 * DocumentGrid — view BURRA (§XI): recebe o `ListState` por prop e renderiza cabeçalho + corpo
 * (loading / error / empty / linhas). Sem hooks de dados/estado. Colunas finas do DTO (Fatia 2);
 * valores monetários em fonte mono; badge de status por variante de cor (tokens).
 */
import { Fragment, type CSSProperties, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { AvatarLabel, initialsFrom, Checkbox } from '#shared/ui/index.ts'

import {
  type ColumnKey,
  type GridRow,
  type ListState,
  type DocumentStatus,
  type PartnerKind,
} from '../contas-a-pagar.view-model.ts'
import { NO_HIDDEN_COLUMNS, visibleColumnsOf, type HiddenColumns } from '../column-visibility.view-model.ts'
import {
  CHECKBOX_TRACK,
  COLUMN_TRACKS,
  GRID_GAP_REM,
  GRID_COLS_PROP,
  GRID_ROW_MIN_PROP,
  grid,
  head,
  headCell,
  headCellRight,
  row,
  rowClickable,
  rowSelected,
  rowActive,
  cellCheckbox,
  cell,
  cellMutedDoc,
  cellDoc,
  cellDocNumber,
  cellDocSeries,
  cellNet,
  cellGross,
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

// Spec 129: template de colunas e largura mínima da linha só com as colunas visíveis (+ a da checkbox),
// publicados como custom properties no scroller — head e rows herdam.
const gridVarsOf = (keys: readonly ColumnKey[]): CSSProperties => {
  const tracks = [CHECKBOX_TRACK, ...keys.map((k) => COLUMN_TRACKS[k])]
  const minRem = tracks.reduce((sum, tr) => sum + tr.minRem, 0) + (tracks.length - 1) * GRID_GAP_REM
  return {
    [GRID_COLS_PROP]: tracks.map((tr) => tr.track).join(' '),
    [GRID_ROW_MIN_PROP]: `${String(minRem)}rem`,
  } as CSSProperties
}

const cellOf = (key: ColumnKey, r: GridRow): ReactNode => {
  switch (key) {
    case 'type':
      return r.type === DASH ? (
        <span className={cell}>{r.type}</span>
      ) : (
        <span className={typeClass(r.type)}>{r.type}</span>
      )
    case 'documentNumber':
      return r.series !== null ? (
        <span className={cellDoc}>
          <span className={cellDocNumber}>{r.documentNumber}</span>
          <span className={cellDocSeries}>
            {t('financial.list.seriesPrefix')} {r.series}
          </span>
        </span>
      ) : (
        <span className={cellMutedDoc}>{r.documentNumber}</span>
      )
    case 'supplier':
      return r.supplier === DASH ? (
        <span className={cell}>{r.supplier}</span>
      ) : (
        <AvatarLabel
          initials={initialsFrom(r.supplier)}
          variant={avatarVariantOf(r.supplierKind)}
          text={r.supplier}
          subtitle={r.supplierDoc}
        />
      )
    case 'contract':
      return <span className={cell}>{r.contract}</span>
    case 'paymentMethod':
      return (
        <span className={cell}>
          {r.paymentMethod !== null ? t(`financial.paymentMethod.${r.paymentMethod}`) : DASH}
        </span>
      )
    case 'emissao':
      return <span className={cell}>{r.emissao}</span>
    // Vencimento é só-leitura aqui. Alteração: drawer → "Editar pagamento" (1) ou footer (1+).
    case 'due':
      return <span className={cell}>{r.due}</span>
    // #231: data da baixa (pagamento) — ancora o match da conciliação (pagamento == saída bancária).
    case 'pagamento':
      return <span className={cell}>{r.pagamento}</span>
    case 'gross':
      return <span className={cellGross}>{r.gross}</span>
    case 'net':
      return <span className={cellNet}>{r.net}</span>
    case 'status':
      return <span className={`${statusBadge} ${statusVariant[r.status]}`}>{r.status}</span>
  }
}

export type DocumentGridProps = Readonly<{
  state: ListState
  onRowClick?: (id: string, status: DocumentStatus, documentId: string) => void
  // Seleção (mock): checkbox por linha + "selecionar todos". Opcional (aditivo — sem isso, sem coluna).
  selectedIds?: ReadonlySet<string>
  allSelected?: boolean
  onToggle?: (id: string) => void
  onToggleAll?: () => void
  // Linha cujo detalhe está aberto no drawer — fica realçada (selecionada), igual ao mock.
  activeId?: string | null
  // Spec 129: colunas escondidas pelo seletor. Opcional (aditivo — sem isso, todas as colunas).
  hiddenColumns?: HiddenColumns
}>

export function DocumentGrid(props: DocumentGridProps): ReactNode {
  const { state, selectedIds, onToggle, onToggleAll } = props
  const selectable = onToggle !== undefined
  const columns = visibleColumnsOf(props.hiddenColumns ?? NO_HIDDEN_COLUMNS)

  return (
    <div className={grid} style={gridVarsOf(columns.map((c) => c.key))}>
      <div className={head} role="row">
        <span className={cellCheckbox}>
          {selectable ? (
            <Checkbox id="cb-all" checked={props.allSelected ?? false} onChange={() => onToggleAll?.()} />
          ) : null}
        </span>
        {columns.map((c) => (
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
              // Aberta no drawer vence marcada na aparência: `rowActive` já herda `rowSelected`, e as
              // duas coisas podem valer ao mesmo tempo na mesma linha.
              className={`${row} ${rowClickable}${isActive ? ` ${rowActive}` : isChecked ? ` ${rowSelected}` : ''}`}
              role="button"
              tabIndex={0}
              key={r.id}
              onClick={(e) => {
                // Abrir o drawer exige clicar numa CÉLULA — não em qualquer pixel da linha.
                //
                // O vão entre colunas pertence à `div` da linha, não às células: clicar ali batia no
                // `currentTarget` e abria o drawer. Somado à coluna da checkbox, isso fazia a mira de
                // marcar virar abrir — o erro que mais atrapalha quem monta uma remessa, porque
                // acontece justamente na hora de selecionar vários títulos.
                const target = e.target as HTMLElement
                if (target === e.currentTarget) return
                if (target.closest('[data-drawer-ignore]') !== null) return
                props.onRowClick?.(r.id, r.status, r.documentId)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  props.onRowClick?.(r.id, r.status, r.documentId)
                }
              }}
            >
              <span
                className={cellCheckbox}
                // Zona morta declarada: cobre a checkbox E a folga em volta dela. O
                // `stopPropagation` sozinho não bastava — ele protege o alvo, não a vizinhança.
                data-drawer-ignore=""
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
              {columns.map((c) => (
                <Fragment key={c.key}>{cellOf(c.key, r)}</Fragment>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
