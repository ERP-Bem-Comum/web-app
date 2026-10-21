/**
 * Seletor de colunas (spec 129) — view BURRA (§XI). Botão "Colunas" na filter-bar + menu de checkboxes,
 * no molde do Relatório Geral. Documento e Status aparecem marcadas e travadas (`locked`). "Mostrar todas"
 * desfaz a seleção de uma vez. Menu aberto/fechado é controlado pelo pai (mesmo padrão das Visões).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { COLUMNS, type ColumnKey } from '../contas-a-pagar.view-model.ts'
import type { HiddenColumns } from '../column-visibility.view-model.ts'
import {
  columnsWrap,
  columnsBtn,
  columnsMenu,
  columnsBackdrop,
  columnsItem,
  columnsItemLocked,
  columnsCheck,
  columnsLockedHint,
  columnsShowAll,
  savedViewsDivider,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type ColumnsMenuProps = Readonly<{
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  hiddenColumns: HiddenColumns
  onToggleColumn: (key: ColumnKey) => void
  onShowAllColumns: () => void
}>

export function ColumnsMenu(props: ColumnsMenuProps): ReactNode {
  return (
    <div className={columnsWrap}>
      <button
        type="button"
        className={columnsBtn}
        onClick={props.onToggleMenu}
        aria-haspopup="menu"
        aria-expanded={props.menuOpen}
      >
        {t('financial.list.columns.button')}
      </button>

      {props.menuOpen ? (
        <>
          <button
            type="button"
            className={columnsBackdrop}
            aria-label={t('financial.list.columns.close')}
            onClick={props.onCloseMenu}
          />
          <div className={columnsMenu} role="menu">
            {COLUMNS.map((c) => (
              <label key={c.key} className={c.locked ? columnsItemLocked : columnsItem}>
                <input
                  type="checkbox"
                  className={columnsCheck}
                  checked={c.locked || !props.hiddenColumns.has(c.key)}
                  disabled={c.locked}
                  onChange={() => {
                    props.onToggleColumn(c.key)
                  }}
                />
                {t(c.labelTag)}
                {c.locked ? (
                  <span className={columnsLockedHint}>{t('financial.list.columns.locked')}</span>
                ) : null}
              </label>
            ))}
            <div className={savedViewsDivider} />
            <button
              type="button"
              className={columnsShowAll}
              disabled={props.hiddenColumns.size === 0}
              onClick={props.onShowAllColumns}
            >
              {t('financial.list.columns.showAll')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
