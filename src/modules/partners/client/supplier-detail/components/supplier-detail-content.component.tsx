import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Field, Input } from '#shared/ui/index.ts'
import { FileTextIcon, WalletIcon } from '#shared/ui/icons/index.ts'
import {
  PIX_KEY_TYPES,
  isPixKeyType,
  SERVICE_RATINGS,
  isServiceRating,
  type SupplierFormController,
  type SupplierFormState,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'
import type { ActivationStatus } from '#modules/partners/client/domain/supplier.types.ts'

import {
  stack,
  section,
  sectionTitle,
  statusRow,
  fieldGrid,
  select,
} from './supplier-detail-content.css.ts'

const t = createTranslator(ptBR)

export type SupplierDetailContentProps = Readonly<{
  controller: SupplierFormController
  editing: boolean
  canViewSensitive: boolean
  /** CNPJ é vital: só edita com `supplier:edit-sensitive`. */
  cnpjDisabled: boolean
  activation: ActivationStatus
  categories: readonly string[]
}>

export function SupplierDetailContent(props: SupplierDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.suppliers.form.invalid') : undefined

  const txt = (
    key: keyof SupplierFormState,
    label: string,
    errKey: string,
    opts?: Readonly<{ type?: 'text' | 'email'; disabled?: boolean; mask?: 'cpf' | 'cnpj' | 'phone' }>,
  ): ReactNode => (
    <Field htmlFor={`sd-${key}`} label={label} error={invalid(errKey)}>
      <Input
        id={`sd-${key}`}
        type={opts?.type}
        mask={opts?.mask}
        value={c.state[key]}
        disabled={!editing || (opts?.disabled ?? false)}
        onChange={(v) => { c.setField(key, v); }}
      />
    </Field>
  )

  return (
    <div className={stack}>
      <section className={section}>
        <h2 className={sectionTitle}><FileTextIcon size={18} />{t('partners.suppliers.form.section.basic')}</h2>
        <div className={statusRow}>
          <Badge variant={props.activation === 'active' ? 'active' : 'terminated'} uppercase size="sm">
            {t(`partners.suppliers.status.${props.activation}`)}
          </Badge>
        </div>
        <div className={fieldGrid}>
          {txt('name', t('partners.suppliers.form.name'), 'name')}
          {txt('email', t('partners.suppliers.form.email'), 'email', { type: 'email' })}
          {txt('cnpj', t('partners.suppliers.form.cnpj'), 'cnpj', { disabled: props.cnpjDisabled, mask: 'cnpj' })}
          {txt('corporateName', t('partners.suppliers.form.corporateName'), 'corporateName')}
          {txt('fantasyName', t('partners.suppliers.form.fantasyName'), 'fantasyName')}
          <Field htmlFor="sd-category" label={t('partners.suppliers.form.category')} error={invalid('serviceCategory')}>
            <select
              id="sd-category"
              className={select}
              value={c.state.serviceCategory}
              disabled={!editing}
              onChange={(e) => { c.setField('serviceCategory', e.target.value); }}
            >
              <option value="">{t('partners.suppliers.form.select')}</option>
              {props.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Field>
          {/* Avaliação/Comentário (§1.6) — exibido sempre; editável só em modo edição (como os demais).
              "Sem avaliação" = null. O core-api aceita/retorna os 2 campos (#32). */}
          <Field htmlFor="sd-rating" label={t('partners.suppliers.form.serviceRating')}>
            <select
              id="sd-rating"
              className={select}
              value={c.state.serviceRating}
              disabled={!editing}
              aria-label={t('partners.suppliers.form.serviceRating')}
              onChange={(e) => { c.setField('serviceRating', isServiceRating(e.target.value) ? e.target.value : '') }}
            >
              <option value="">{t('partners.suppliers.rating.none')}</option>
              {SERVICE_RATINGS.map((r) => (
                <option key={r} value={r}>{t(`partners.suppliers.rating.${r}`)}</option>
              ))}
            </select>
          </Field>
          {txt('ratingComment', t('partners.suppliers.form.ratingComment'), 'ratingComment')}
        </div>
      </section>

      {props.canViewSensitive ? (
        <section className={section}>
          <h2 className={sectionTitle}><WalletIcon size={18} />{t('partners.suppliers.form.section.payment')}</h2>
          <div className={fieldGrid}>
            {txt('bank', t('partners.suppliers.form.bank'), 'bankAccount.bank')}
            {txt('agency', t('partners.suppliers.form.agency'), 'bankAccount.agency')}
            {txt('accountNumber', t('partners.suppliers.form.accountNumber'), 'bankAccount.accountNumber')}
            {txt('checkDigit', t('partners.suppliers.form.checkDigit'), 'bankAccount.checkDigit')}
            <Field htmlFor="sd-pix-type" label={t('partners.suppliers.form.pixType')} error={invalid('pixKey.keyType')}>
              <select
                id="sd-pix-type"
                className={select}
                value={c.state.pixKeyType}
                disabled={!editing}
                onChange={(e) => { if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value) }}
              >
                {PIX_KEY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t(`partners.suppliers.pix.${pt}`)}</option>
                ))}
              </select>
            </Field>
            {txt('pixKey', t('partners.suppliers.form.pixKey'), 'pixKey.key')}
          </div>
        </section>
      ) : null}
    </div>
  )
}
