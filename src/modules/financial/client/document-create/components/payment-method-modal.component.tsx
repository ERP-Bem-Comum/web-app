/**
 * Modal "Forma de Pagamento" — view BURRA (§XI). Mesmo padrão do modal de Tipo de Documento (<dialog>
 * nativo, cards). A forma escolhida controla os campos complementares (ver document-form). Reusa as
 * classes do modal de tipo (genéricas); avatar neutro (sigla do método).
 */
import { useEffect, useRef, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  PAYMENT_METHOD_META,
  paymentMethodNameTag,
  paymentMethodDescTag,
  type PaymentMethod,
} from '../document-form.view.ts'
import {
  typeDialog,
  typeContent,
  typeHeader,
  typeTitle,
  typeClose,
  typeBody,
  typeSubtitle,
  typeGrid,
  typeCard,
  typeCardSelected,
  methodAvatar,
  typeCardMain,
  typeName,
  typeDesc,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type PaymentMethodModalProps = Readonly<{
  open: boolean
  selected: PaymentMethod | ''
  onSelect: (method: PaymentMethod) => void
  onClose: () => void
}>

export function PaymentMethodModal(props: PaymentMethodModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (props.open && !el.open && typeof el.showModal === 'function') el.showModal()
    if (!props.open && el.open && typeof el.close === 'function') el.close()
  }, [props.open])

  return (
    <dialog
      ref={ref}
      className={typeDialog}
      aria-label={t('financial.create.payMethod.modalTitle')}
      onClose={props.onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className={typeContent}>
        <div className={typeHeader}>
          <h2 className={typeTitle}>{t('financial.create.payMethod.modalTitle')}</h2>
          <button
            type="button"
            className={typeClose}
            onClick={props.onClose}
            aria-label={t('financial.create.docType.close')}
          >
            ×
          </button>
        </div>
        <div className={typeBody}>
          <p className={typeSubtitle}>{t('financial.create.payMethod.modalSubtitle')}</p>
          <div className={typeGrid}>
            {PAYMENT_METHOD_META.map((m) => (
              <button
                key={m.method}
                type="button"
                className={`${typeCard} ${m.method === props.selected ? typeCardSelected : ''}`}
                aria-pressed={m.method === props.selected}
                onClick={() => {
                  props.onSelect(m.method)
                }}
              >
                <span className={methodAvatar} aria-hidden="true">
                  {m.initials}
                </span>
                <span className={typeCardMain}>
                  <span className={typeName}>{t(paymentMethodNameTag(m.method))}</span>
                  <span className={typeDesc}>{t(paymentMethodDescTag(m.method))}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  )
}
