/**
 * Visões salvas (saved views, #351) — view BURRA (§XI). Botão "Visões" na filter-bar + menu (pele da marca)
 * que: (a) salva a visão atual (input de nome + confirmar); (b) lista as visões salvas → clicar APLICA;
 * (c) exclui cada uma. Recebe tudo por props/binding — não importa `data`, `usecase` nem `binding`; o nome
 * digitado é estado de UI transiente (input controlado local). Menu aberto/fechado é controlado pelo pai
 * (mesmo padrão do `AddFilterButton`).
 */
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { SavedView } from '../contas-a-pagar-saved-views.view-model.ts'
import {
  savedViewsWrap,
  savedViewsBtn,
  savedViewsMenu,
  savedViewsSaveRow,
  savedViewsNameInput,
  savedViewsSaveBtn,
  savedViewsDivider,
  savedViewsEmpty,
  savedViewsItem,
  savedViewsApply,
  savedViewsDelete,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type SavedViewsMenuProps = Readonly<{
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  savedViews: readonly SavedView[]
  onSaveView: (name: string) => void
  onApplyView: (id: string) => void
  onDeleteView: (id: string) => void
}>

export function SavedViewsMenu(props: SavedViewsMenuProps): ReactNode {
  // Nome da nova visão — estado de UI transiente do próprio input (não é app/server-state).
  const [name, setName] = useState('')
  const canSave = name.trim() !== ''

  const save = (): void => {
    if (!canSave) return
    props.onSaveView(name)
    setName('')
    props.onCloseMenu()
  }

  return (
    <div className={savedViewsWrap}>
      <button
        type="button"
        className={savedViewsBtn}
        onClick={props.onToggleMenu}
        aria-haspopup="menu"
        aria-expanded={props.menuOpen}
      >
        {t('financial.list.savedViews.button')}
      </button>

      {props.menuOpen ? (
        <div className={savedViewsMenu} role="menu">
          <div className={savedViewsSaveRow}>
            <input
              type="text"
              className={savedViewsNameInput}
              value={name}
              placeholder={t('financial.list.savedViews.namePlaceholder')}
              aria-label={t('financial.list.savedViews.nameLabel')}
              onChange={(e) => {
                setName(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
              }}
            />
            <button type="button" className={savedViewsSaveBtn} disabled={!canSave} onClick={save}>
              {t('financial.list.savedViews.save')}
            </button>
          </div>

          <div className={savedViewsDivider} aria-hidden="true" />

          {props.savedViews.length === 0 ? (
            <div className={savedViewsEmpty}>{t('financial.list.savedViews.empty')}</div>
          ) : (
            props.savedViews.map((v) => (
              <div key={v.id} className={savedViewsItem}>
                <button
                  type="button"
                  role="menuitem"
                  className={savedViewsApply}
                  title={v.name}
                  onClick={() => {
                    props.onApplyView(v.id)
                    props.onCloseMenu()
                  }}
                >
                  {v.name}
                </button>
                <button
                  type="button"
                  className={savedViewsDelete}
                  aria-label={t('financial.list.savedViews.delete')}
                  onClick={() => {
                    props.onDeleteView(v.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
