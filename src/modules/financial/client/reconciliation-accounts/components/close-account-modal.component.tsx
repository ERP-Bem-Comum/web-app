/**
 * CloseAccountModal (TELA 1) — view burra: confirmação de "Encerrar conta". Encerrar é IRREVERSÍVEL na UI
 * (não há reabertura de conta-cedente) → confirmação explícita. Recebe o alvo + estado/erro + callbacks por
 * props; sem data-hooks. Só aparece quando `target !== null`. Espelha o padrão de confirmação da tela.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import type { CloseAccountBinding } from '../close-account.binding.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type CloseAccountModalProps = Readonly<{ binding: CloseAccountBinding }>

export function CloseAccountModal({ binding }: CloseAccountModalProps) {
  const target = binding.target
  if (target === null) return null
  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.accounts.close.title')}
    >
      <div className={s.modal}>
        <header className={s.modalHead}>
          <span className={s.mhIc} aria-hidden="true">
            <WalletIcon />
          </span>
          <div className={s.mhText}>
            <div className={s.modalTitle}>{t('financial.recon.accounts.close.title')}</div>
            <div className={s.modalSub}>{t('financial.recon.accounts.close.sub')}</div>
          </div>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.accounts.close.cancel')}
            onClick={binding.cancel}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalBody}>
          <p className={s.confirmText}>
            {t('financial.recon.accounts.close.body')} <span className={s.confirmStrong}>{target.alias}</span>
            ?
          </p>
          <p className={s.confirmText}>{t('financial.recon.accounts.close.warn')}</p>
          {binding.errorTag !== null ? (
            <p className={s.confirmError} role="alert">
              {t(binding.errorTag)}
            </p>
          ) : null}
        </div>

        <footer className={s.modalFoot}>
          <span className={s.spacer} />
          <button
            type="button"
            className={s.btnSecondary}
            onClick={binding.cancel}
            disabled={binding.closing}
          >
            {t('financial.recon.accounts.close.cancel')}
          </button>
          <button type="button" className={s.btnDanger} onClick={binding.confirm} disabled={binding.closing}>
            {binding.closing
              ? t('financial.recon.accounts.close.closing')
              : t('financial.recon.accounts.close.confirm')}
          </button>
        </footer>
      </div>
    </div>
  )
}
