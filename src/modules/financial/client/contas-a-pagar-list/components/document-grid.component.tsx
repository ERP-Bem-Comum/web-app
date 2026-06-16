/**
 * DocumentGrid — view BURRA (§XI): recebe o `ListState` por prop e renderiza cabeçalho + corpo
 * (loading / error / empty / linhas). Sem hooks de dados/estado. Colunas finas do DTO (Fatia 2);
 * valores monetários em fonte mono; badge de status por variante de cor (tokens).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { COLUMNS, type ListState } from '../contas-a-pagar.view-model.ts'
import {
  grid,
  head,
  headCell,
  headCellRight,
  row,
  cell,
  cellMutedDoc,
  cellNet,
  statusBadge,
  statusVariant,
  placeholder,
  placeholderTitle,
  errorBanner,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type DocumentGridProps = Readonly<{ state: ListState }>

export function DocumentGrid(props: DocumentGridProps): ReactNode {
  const { state } = props

  return (
    <div className={grid}>
      <div className={head} role="row">
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
        state.rows.map((r) => (
          <div className={row} role="row" key={r.id}>
            <span className={cell}>{r.type}</span>
            <span className={cellMutedDoc}>{r.documentNumber}</span>
            <span className={cell}>{r.supplier}</span>
            <span className={cell}>{r.due}</span>
            <span className={cellNet}>{r.net}</span>
            <span className={`${statusBadge} ${statusVariant[r.status]}`}>{r.status}</span>
          </div>
        ))
      )}
    </div>
  )
}
