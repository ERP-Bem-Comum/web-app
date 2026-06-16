/**
 * Form de Lançar Documento — view BURRA (§XI): props + JSX, sem hooks de dados/estado. Recebe os campos e
 * setters do controller por props. Bloco de retenções só aparece para NFS-e/RPA (gating). Layout do mock;
 * cores via tokens institucionais. Painel PDF/OCR, validação/divergência, aprovador = gated (fora do v1).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  retentionsEnabledFor,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  RETENTION_KEYS,
  isDocumentType,
  isPaymentMethod,
  type DocumentType,
  type PaymentMethod,
  type DocumentFormFields,
  type RetentionFieldsReais,
  type SupplierOption,
} from '../document-form.view.ts'
import {
  control,
  controlMono,
  field,
  fieldGrid,
  fieldLabel,
  retentionsHint,
  section,
  sectionTitle,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type DocumentFormProps = Readonly<{
  fields: DocumentFormFields
  suppliers: readonly SupplierOption[]
  onType: (value: DocumentType | '') => void
  onPaymentMethod: (value: PaymentMethod | '') => void
  onSupplier: (ref: string) => void
  onText: (key: 'documentNumber' | 'series' | 'grossValue' | 'dueDate' | 'description', value: string) => void
  onRetention: (key: keyof RetentionFieldsReais, value: string) => void
}>

export function DocumentForm(props: DocumentFormProps): ReactNode {
  const { fields } = props
  const retEnabled = retentionsEnabledFor(fields.type)

  return (
    <>
      {/* Identificação */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.identificacao')}</h3>
        <div className={fieldGrid.six}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-type">{t('financial.create.field.type')}</label>
            <select id="fin-type" className={control} value={fields.type} onChange={(e) => { props.onType(isDocumentType(e.target.value) ? e.target.value : '') }}>
              <option value="">{t('financial.create.select')}</option>
              {DOCUMENT_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-num">{t('financial.create.field.documentNumber')}</label>
            <input id="fin-num" className={control} value={fields.documentNumber} onChange={(e) => { props.onText('documentNumber', e.target.value) }} />
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-serie">{t('financial.create.field.series')}</label>
            <input id="fin-serie" className={control} value={fields.series} onChange={(e) => { props.onText('series', e.target.value) }} />
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-venc">{t('financial.create.field.dueDate')}</label>
            <input id="fin-venc" type="date" className={control} value={fields.dueDate} onChange={(e) => { props.onText('dueDate', e.target.value) }} />
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-bruto">{t('financial.create.field.grossValue')}</label>
            <input id="fin-bruto" className={controlMono} inputMode="decimal" placeholder="R$ 0,00" value={fields.grossValue} onChange={(e) => { props.onText('grossValue', e.target.value) }} />
          </div>
        </div>
        <div className={fieldGrid.wide}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-desc">{t('financial.create.field.description')}</label>
            <input id="fin-desc" className={control} value={fields.description} onChange={(e) => { props.onText('description', e.target.value) }} />
          </div>
        </div>
      </section>

      {/* Retenções — só NFS-e/RPA */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.retencoes')}</h3>
        {retEnabled ? (
          <div className={fieldGrid.six}>
            {RETENTION_KEYS.map((key) => (
              <div className={field} key={key}>
                <label className={fieldLabel} htmlFor={`fin-ret-${key}`}>{t(`financial.create.retention.${key}`)}</label>
                <input id={`fin-ret-${key}`} className={controlMono} inputMode="decimal" placeholder="R$ 0,00" value={fields.retentions[key]} onChange={(e) => { props.onRetention(key, e.target.value) }} />
              </div>
            ))}
          </div>
        ) : (
          <p className={retentionsHint}>{t('financial.create.retention.disabled')}</p>
        )}
      </section>

      {/* Pagamento + Fornecedor */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.pagamento')}</h3>
        <div className={fieldGrid.two}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forma">{t('financial.create.field.paymentMethod')}</label>
            <select id="fin-forma" className={control} value={fields.paymentMethod} onChange={(e) => { props.onPaymentMethod(isPaymentMethod(e.target.value) ? e.target.value : '') }}>
              <option value="">{t('financial.create.select')}</option>
              {PAYMENT_METHODS.map((pm) => <option key={pm} value={pm}>{t(`financial.paymentMethod.${pm}`)}</option>)}
            </select>
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forn">{t('financial.create.field.supplier')}</label>
            <select id="fin-forn" className={control} value={fields.supplierRef} onChange={(e) => { props.onSupplier(e.target.value) }}>
              <option value="">{t('financial.create.select')}</option>
              {props.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </section>
    </>
  )
}
