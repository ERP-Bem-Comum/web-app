/**
 * Bottombar fixa do Lançar Documento — view BURRA (§XI). Ações: Descartar / Salvar rascunho / Salvar
 * Documento (primário, teal da marca). No modo CRIAÇÃO não há indicador de status no rodapé — o falso
 * "Auto-salvo · Rascunho" foi removido (não há auto-save de fato; enganava o operador). Em edição/consulta
 * o rodapé mostra o status real ("Editando…" / "Somente consulta"). As dicas de teclado (⌘S/⌘↵) são decorativas.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  pageBottombar,
  statusGroup,
  statusDot,
  statusText,
  bottombarSpacer,
  actionsGroup,
  addSupplierButton,
  discardButton,
  draftButton,
  primaryButton,
  kbdChip,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type DocumentBottombarMode = 'create' | 'edit' | 'view'

export type DocumentBottombarProps = Readonly<{
  mode?: DocumentBottombarMode // default 'create'
  onDiscard: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  // Atalho p/ cadastrar fornecedor no módulo de Parceiros (só no modo criação).
  onAddSupplier: () => void
  canSaveDraft: boolean
  canSubmit: boolean
  running: boolean
}>

export function DocumentBottombar(props: DocumentBottombarProps): ReactNode {
  const mode = props.mode ?? 'create'

  return (
    <div className={pageBottombar}>
      {/* Modo criação: atalho p/ cadastrar fornecedor (Parceiros). Edição/consulta mostram o status real. */}
      {mode === 'create' ? (
        <button type="button" className={addSupplierButton} onClick={props.onAddSupplier}>
          {t('financial.create.bottombar.addSupplier')}
        </button>
      ) : (
        <div className={statusGroup}>
          <span className={statusDot} aria-hidden="true" />
          <span className={statusText}>
            {mode === 'edit'
              ? t('financial.create.bottombar.editing')
              : t('financial.create.bottombar.viewOnly')}
          </span>
        </div>
      )}

      <div className={bottombarSpacer} />

      <div className={actionsGroup}>
        <button type="button" className={discardButton} onClick={props.onDiscard}>
          {mode === 'view' ? t('financial.create.backToList') : t('financial.create.discard')}
        </button>

        {mode === 'create' ? (
          <button
            type="button"
            className={draftButton}
            onClick={props.onSaveDraft}
            disabled={!props.canSaveDraft || props.running}
            // Quando travado, o tooltip explica o mínimo exigido (mesmo mínimo do core-api p/ asDraft).
            title={props.canSaveDraft ? undefined : t('financial.create.bottombar.saveDraftHint')}
          >
            {t('financial.create.bottombar.saveDraft')}
            <span className={kbdChip}>{t('financial.create.bottombar.kbdSaveDraft')}</span>
          </button>
        ) : null}

        {mode === 'view' ? null : (
          <button
            type="button"
            className={primaryButton}
            onClick={props.onSubmit}
            disabled={!props.canSubmit || props.running}
          >
            {props.running ? (
              t('common.loading')
            ) : (
              <>
                {mode === 'edit' ? t('financial.create.editSubmit') : t('financial.create.submit')}
                <span className={kbdChip}>{t('financial.create.bottombar.kbdSubmit')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
