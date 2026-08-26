import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, formatMask, unmask, type InputMask } from '#shared/ui/index.ts'
import { FileTextIcon, WalletIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'
import {
  PIX_KEY_TYPES,
  isPixKeyType,
  SERVICE_RATINGS,
  isServiceRating,
  type SupplierFormController,
  type SupplierFormState,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'
import { BankSelect, isUnknownBank } from '#shared/ui/brand/bank-select.component.tsx'
import type { ActivationStatus } from '#modules/partners/client/domain/supplier.types.ts'

import {
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  field,
  fieldLabel,
  control,
  input,
  select,
  chevron,
  controlError,
  fieldError,
} from '#shared/ui/brand/brand-form.css.ts'

const t = createTranslator(ptBR)

/** Mesmos rótulos do formulário de criar/editar — o seletor de banco é o mesmo componente. */
const BANK_LABELS = {
  placeholder: t('partners.suppliers.form.bankPlaceholder'),
  frequentGroup: t('partners.suppliers.form.bankFrequent'),
  allGroup: t('partners.suppliers.form.bankAll'),
  unknownPrefix: t('partners.suppliers.form.bankUnknown'),
} as const

export type SupplierDetailContentProps = Readonly<{
  controller: SupplierFormController
  editing: boolean
  canViewSensitive: boolean
  /** CNPJ é vital: só edita com `supplier:edit-sensitive`. */
  cnpjDisabled: boolean
  activation: ActivationStatus
  categories: readonly string[]
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  disabled,
  invalid = false,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  disabled: boolean
  invalid?: boolean
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={`${select} ${invalid ? controlError : ''}`}
        value={value}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={onChange}
      >
        {children}
      </select>
      <span className={chevron}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}

export function SupplierDetailContent(props: SupplierDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('partners.suppliers.form.invalid') : null

  const txt = (
    key: keyof SupplierFormState,
    label: string,
    errKey: string,
    opts?: Readonly<{ type?: 'text' | 'email'; readOnly?: boolean; mask?: InputMask }>,
  ): ReactNode => {
    const disabled = !editing || (opts?.readOnly ?? false)
    const display = opts?.mask !== undefined ? formatMask(opts.mask, c.state[key]) : c.state[key]
    return (
      <div className={field}>
        <label htmlFor={`sd-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`sd-${key}`}
          type={opts?.type ?? 'text'}
          className={`${input} ${isInvalid(errKey) ? controlError : ''}`}
          value={display}
          disabled={disabled}
          inputMode={opts?.mask === 'agency' ? 'numeric' : undefined}
          onChange={(e) => {
            c.setField(key, opts?.mask !== undefined ? unmask(e.target.value, opts.mask) : e.target.value)
          }}
        />
        {invalidMsg(errKey) !== null ? <span className={fieldError}>{invalidMsg(errKey)}</span> : null}
      </div>
    )
  }

  return (
    <>
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <FileTextIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.suppliers.form.section.basic')}</h2>
        </div>
        <div className={sectionBody}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge variant={props.activation === 'active' ? 'active' : 'terminated'} uppercase size="sm">
              {t(`partners.suppliers.status.${props.activation}`)}
            </Badge>
          </div>
          <div className={grid}>
            {txt('name', t('partners.suppliers.form.name'), 'name')}
            {txt('email', t('partners.suppliers.form.email'), 'email', { type: 'email' })}
            {txt('cnpj', t('partners.suppliers.form.cnpj'), 'cnpj', {
              readOnly: props.cnpjDisabled,
              mask: 'cnpj',
            })}
            {txt('corporateName', t('partners.suppliers.form.corporateName'), 'corporateName')}
            {txt('fantasyName', t('partners.suppliers.form.fantasyName'), 'fantasyName')}
            <div className={field}>
              <label htmlFor="sd-serviceCategory" className={fieldLabel}>
                {t('partners.suppliers.form.category')}
              </label>
              <SelectControl
                id="sd-serviceCategory"
                value={c.state.serviceCategory}
                invalid={isInvalid('serviceCategory')}
                disabled={!editing}
                onChange={(e) => {
                  c.setField('serviceCategory', e.target.value)
                }}
              >
                <option value="">{t('partners.suppliers.form.select')}</option>
                {props.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </SelectControl>
              {invalidMsg('serviceCategory') !== null ? (
                <span className={fieldError}>{invalidMsg('serviceCategory')}</span>
              ) : null}
            </div>
            {/* Avaliação/Comentário (§1.6) — exibido sempre; editável só em modo edição (como os demais).
                "Sem avaliação" = null. O core-api aceita/retorna os 2 campos (#32). */}
            <div className={field}>
              <label htmlFor="sd-serviceRating" className={fieldLabel}>
                {t('partners.suppliers.form.serviceRating')}
              </label>
              <SelectControl
                id="sd-serviceRating"
                value={c.state.serviceRating}
                ariaLabel={t('partners.suppliers.form.serviceRating')}
                disabled={!editing}
                onChange={(e) => {
                  c.setField('serviceRating', isServiceRating(e.target.value) ? e.target.value : '')
                }}
              >
                <option value="">{t('partners.suppliers.rating.none')}</option>
                {SERVICE_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {t(`partners.suppliers.rating.${r}`)}
                  </option>
                ))}
              </SelectControl>
            </div>
            {txt('ratingComment', t('partners.suppliers.form.ratingComment'), 'ratingComment')}
          </div>
        </div>
      </section>

      {props.canViewSensitive ? (
        <section className={sectionCard}>
          <div className={sectionHeader}>
            <span className={sectionIcon}>
              <WalletIcon size={17} />
            </span>
            <h2 className={sectionH2}>{t('partners.suppliers.form.section.payment')}</h2>
          </div>
          <div className={sectionBody}>
            <div className={grid}>
              {/* Banco: seletor pelo código FEBRABAN, e não `txt`, porque o campo deixou de ser texto
                  livre. Fora do modo de edição o seletor fica desabilitado, mas continua mostrando
                  "237 · Bradesco" — o código sozinho não diz nada a quem está conferindo. */}
              <div className={field}>
                <label htmlFor="sd-bank" className={fieldLabel}>
                  {t('partners.suppliers.form.bank')}
                </label>
                <BankSelect
                  id="sd-bank"
                  value={c.state.bank}
                  labels={BANK_LABELS}
                  invalid={isInvalid('bankAccount.bank')}
                  disabled={!editing}
                  ariaLabel={t('partners.suppliers.form.bank')}
                  onChange={(code) => {
                    c.setField('bank', code)
                  }}
                />
                {invalidMsg('bankAccount.bank') !== null ? (
                  <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                ) : isUnknownBank(c.state.bank) ? (
                  <span className={fieldError}>{t('partners.suppliers.form.bankUnknownHint')}</span>
                ) : null}
              </div>
              {txt('agency', t('partners.suppliers.form.agency'), 'bankAccount.agency', { mask: 'agency' })}
              {txt('accountNumber', t('partners.suppliers.form.accountNumber'), 'bankAccount.accountNumber')}
              {txt('checkDigit', t('partners.suppliers.form.checkDigit'), 'bankAccount.checkDigit')}
              <div className={field}>
                <label htmlFor="sd-pixKeyType" className={fieldLabel}>
                  {t('partners.suppliers.form.pixType')}
                </label>
                <SelectControl
                  id="sd-pixKeyType"
                  value={c.state.pixKeyType}
                  invalid={isInvalid('pixKey.keyType')}
                  ariaLabel={t('partners.suppliers.form.pixType')}
                  disabled={!editing}
                  onChange={(e) => {
                    if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value)
                  }}
                >
                  {PIX_KEY_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {t(`partners.suppliers.pix.${pt}`)}
                    </option>
                  ))}
                </SelectControl>
                {invalidMsg('pixKey.keyType') !== null ? (
                  <span className={fieldError}>{invalidMsg('pixKey.keyType')}</span>
                ) : null}
              </div>
              {txt('pixKey', t('partners.suppliers.form.pixKey'), 'pixKey.key')}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
