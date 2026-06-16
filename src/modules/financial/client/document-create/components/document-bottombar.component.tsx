/**
 * Bottombar fixa do Lançar Documento — view BURRA (§XI). Figma 626:25: status (auto-salvo + pill Rascunho)
 * · quick-action (+ Adicionar fornecedor) · ações (Descartar / Salvar rascunho / Salvar Documento).
 *
 * Funcional: Descartar (reset) e Salvar Documento (submit, botão primário azul da marca — teal no Figma).
 * Chrome (sem backend de rascunho/auto-save no v1): status "Auto-salvo", pill Rascunho, "+ Adicionar
 * fornecedor" e "Salvar rascunho" são desabilitados. As dicas de teclado (⌘S/⌘↵) são decorativas.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  pageBottombar,
  statusGroup,
  statusDot,
  statusText,
  draftPill,
  addSupplierButton,
  bottombarSpacer,
  actionsGroup,
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
  canSaveDraft: boolean
  canSubmit: boolean
  running: boolean
}>

export function DocumentBottombar(props: DocumentBottombarProps): ReactNode {
  const mode = props.mode ?? 'create'

  return (
    <div className={pageBottombar}>
      <div className={statusGroup}>
        <span className={statusDot} aria-hidden="true" />
        <span className={statusText}>
          {mode === 'create'
            ? t('financial.create.bottombar.autosaved')
            : mode === 'edit'
              ? t('financial.create.bottombar.editing')
              : t('financial.create.bottombar.viewOnly')}
        </span>
        {mode === 'create' ? (
          <span className={draftPill}>{t('financial.create.bottombar.draft')}</span>
        ) : null}
      </div>
      {mode === 'create' ? (
        <button type="button" className={addSupplierButton} disabled>
          {t('financial.create.bottombar.addSupplier')}
        </button>
      ) : null}

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
