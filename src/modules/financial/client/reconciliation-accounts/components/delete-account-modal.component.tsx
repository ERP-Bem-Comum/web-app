/**
 * DeleteAccountModal (TELA 1) — view burra: confirmação de "Excluir conta" (core-api#995 B3).
 *
 * Só alcançável a partir de uma conta ENCERRADA, e por isso o texto não repete o que o encerramento já
 * disse: aqui o recado é o que muda em relação a ficar encerrada — a linha SOME da listagem, e a chave
 * bancária é LIBERADA para um cadastro novo.
 *
 * ⚠️ O histórico não se perde (é soft delete no backend), e dizer isso é parte do trabalho: sem essa
 * frase, "excluir" parece apagar conciliações e remessas, e o operador não clica — ou clica achando que
 * apagou. As duas leituras erradas custam.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import type { DeleteAccountBinding } from '../delete-account.binding.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type DeleteAccountModalProps = Readonly<{ binding: DeleteAccountBinding }>

export function DeleteAccountModal({ binding }: DeleteAccountModalProps) {
  const target = binding.target
  if (target === null) return null
  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.accounts.delete.title')}
    >
      <div className={s.modal}>
        <header className={s.modalHead}>
          <span className={s.mhIc} aria-hidden="true">
            <WalletIcon />
          </span>
          <div className={s.mhText}>
            <div className={s.modalTitle}>{t('financial.recon.accounts.delete.title')}</div>
            <div className={s.modalSub}>{t('financial.recon.accounts.delete.sub')}</div>
          </div>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.accounts.delete.cancel')}
            onClick={binding.cancel}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalBody}>
          <p className={s.confirmText}>
            {t('financial.recon.accounts.delete.body')}{' '}
            <span className={s.confirmStrong}>{target.alias}</span>?
          </p>
          <p className={s.confirmText}>{t('financial.recon.accounts.delete.warn')}</p>
          <p className={s.confirmText}>{t('financial.recon.accounts.delete.keepsHistory')}</p>
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
            disabled={binding.deleting}
          >
            {t('financial.recon.accounts.delete.cancel')}
          </button>
          <button type="button" className={s.btnDanger} onClick={binding.confirm} disabled={binding.deleting}>
            {binding.deleting
              ? t('financial.recon.accounts.delete.deleting')
              : t('financial.recon.accounts.delete.confirm')}
          </button>
        </footer>
      </div>
    </div>
  )
}
