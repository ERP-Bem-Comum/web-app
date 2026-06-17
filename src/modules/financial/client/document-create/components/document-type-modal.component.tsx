/**
 * Modal "Tipo de Documento" — view BURRA (§XI). `<dialog>` nativo (ESC + focus-trap + inert de graça,
 * padrão dos modais de Contratos). Cards com avatar, classe fiscal (badge) e descrição. Selecionar um
 * tipo dispara `onSelect` (o controller aplica o tipo + fecha). Sem hooks de dados — só ref/efeito p/
 * controlar o <dialog>.
 */
import { useEffect, useRef, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  DOCUMENT_TYPE_META,
  fiscalClassTag,
  docTypeDescriptionTag,
  type DocumentType,
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
  typeAvatar,
  typeCardMain,
  typeCardHead,
  typeName,
  typeClassBadge,
  typeDesc,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type DocumentTypeModalProps = Readonly<{
  open: boolean
  selected: DocumentType | ''
  onSelect: (type: DocumentType) => void
  onClose: () => void
}>

export function DocumentTypeModal(props: DocumentTypeModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    // Guarda p/ ambientes sem suporte a <dialog> (ex.: jsdom antigo nos testes).
    if (props.open && !el.open && typeof el.showModal === 'function') el.showModal()
    if (!props.open && el.open && typeof el.close === 'function') el.close()
  }, [props.open])

  return (
    <dialog
      ref={ref}
      className={typeDialog}
      aria-label={t('financial.create.docType.modalTitle')}
      onClose={props.onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className={typeContent}>
        <div className={typeHeader}>
          <h2 className={typeTitle}>{t('financial.create.docType.modalTitle')}</h2>
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
          <p className={typeSubtitle}>{t('financial.create.docType.modalSubtitle')}</p>
          <div className={typeGrid}>
            {DOCUMENT_TYPE_META.map((m) => (
              <button
                key={m.type}
                type="button"
                className={`${typeCard} ${m.type === props.selected ? typeCardSelected : ''}`}
                aria-pressed={m.type === props.selected}
                onClick={() => {
                  props.onSelect(m.type)
                }}
              >
                <span className={typeAvatar[m.fiscalClass]} aria-hidden="true">
                  {m.initials}
                </span>
                <span className={typeCardMain}>
                  <span className={typeCardHead}>
                    <span className={typeName}>{m.type}</span>
                    <span className={typeClassBadge[m.fiscalClass]}>{t(fiscalClassTag(m.fiscalClass))}</span>
                  </span>
                  <span className={typeDesc}>{t(docTypeDescriptionTag(m.type))}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  )
}
