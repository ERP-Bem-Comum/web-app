import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { BankSelect, isUnknownBank } from '#shared/ui/brand/bank-select.component.tsx'
import { BANK_LABELS, BANK_UNKNOWN_HINT } from '#modules/partners/client/shared/bank-select-labels.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Checkbox, formatMask, unmask, type InputMask } from '#shared/ui/index.ts'
import { ChevronDownIcon, FileTextIcon, HeartHandshakeIcon, WalletIcon } from '#shared/ui/icons/index.ts'
import {
  OCCUPATION_AREAS,
  PIX_KEY_TYPES,
  isPixKeyType,
  type ActFormController,
  type ActFormState,
} from '#modules/partners/client/act-create/components/act-form.controller.ts'
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
import { formErrorTag } from '#modules/partners/client/shared/form-error-labels.ts'

const t = createTranslator(ptBR)

export type ActDetailContentProps = Readonly<{
  controller: ActFormController
  editing: boolean
  active: boolean
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
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
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

export function ActDetailContent(props: ActDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalidMsg = (key: string): string | null => {
    // O slug do schema vira frase pelo mapa compartilhado; regra ainda não nomeada cai na genérica.
    const tag = formErrorTag(c.errors[key], 'partners.acts.form.invalid')
    return tag === null ? null : t(tag)
  }

  // Só campos string do estado (exclui o boolean `hasFinancialTransfer` e o enum `pixKeyType`).
  type TextKey = {
    [K in keyof ActFormState]: ActFormState[K] extends string ? K : never
  }[keyof ActFormState]
  const txt = (
    key: Exclude<TextKey, 'pixKeyType'>,
    label: string,
    errKey: string,
    opts?: Readonly<{ type?: 'text' | 'email' | 'date'; mask?: InputMask }>,
  ): ReactNode => {
    const display = opts?.mask !== undefined ? formatMask(opts.mask, c.state[key]) : c.state[key]
    return (
      <div className={field}>
        <label htmlFor={`ad-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`ad-${key}`}
          type={opts?.type ?? 'text'}
          className={`${input} ${c.errors[errKey] !== undefined ? controlError : ''}`}
          value={display}
          disabled={!editing}
          inputMode={opts?.mask !== undefined ? 'numeric' : undefined}
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
          <h2 className={sectionH2}>{t('partners.acts.form.section.instrument')}</h2>
        </div>
        <div className={sectionBody}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge variant={props.active ? 'active' : 'terminated'} uppercase size="sm">
              {t(`partners.acts.status.${props.active ? 'active' : 'inactive'}`)}
            </Badge>
          </div>
          <div className={grid}>
            {txt('actNumber', t('partners.acts.form.actNumber'), 'actNumber')}
            {txt('name', t('partners.acts.form.name'), 'name')}
            <div className={field}>
              <label htmlFor="ad-occupationArea" className={fieldLabel}>
                {t('partners.acts.form.occupationArea')}
              </label>
              <SelectControl
                id="ad-occupationArea"
                value={c.state.occupationArea}
                ariaLabel={t('partners.acts.form.occupationArea')}
                disabled={!editing}
                invalid={c.errors.occupationArea !== undefined}
                onChange={(e) => {
                  c.setField('occupationArea', e.target.value)
                }}
              >
                <option value="">{t('partners.acts.form.select')}</option>
                {OCCUPATION_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {t(`partners.acts.area.${a}`)}
                  </option>
                ))}
              </SelectControl>
              {invalidMsg('occupationArea') !== null ? (
                <span className={fieldError}>{invalidMsg('occupationArea')}</span>
              ) : null}
            </div>
            {txt('startDate', t('partners.acts.form.startDate'), 'startDate', { type: 'date' })}
            {txt('endDate', t('partners.acts.form.endDate'), 'endDate', { type: 'date' })}
          </div>
        </div>
      </section>

      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <HeartHandshakeIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.acts.form.section.institution')}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            {txt('cnpj', t('partners.acts.form.cnpj'), 'cnpj', { mask: 'cnpj' })}
            {txt('corporateName', t('partners.acts.form.corporateName'), 'corporateName')}
            {txt('fantasyName', t('partners.acts.form.fantasyName'), 'fantasyName')}
            {txt('legalRepresentative', t('partners.acts.form.legalRepresentative'), 'legalRepresentative')}
            {txt('email', t('partners.acts.form.email'), 'email', { type: 'email' })}
          </div>
        </div>
      </section>

      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <WalletIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.acts.form.section.payment')}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            <div className={field}>
              <label htmlFor="ad-transfer" className={fieldLabel}>
                {t('partners.acts.form.hasFinancialTransfer')}
              </label>
              <Checkbox
                id="ad-transfer"
                checked={c.state.hasFinancialTransfer}
                disabled={!editing}
                onChange={(v) => {
                  c.setField('hasFinancialTransfer', v)
                }}
              />
              {invalidMsg('hasFinancialTransfer') !== null ? (
                <span className={fieldError}>{invalidMsg('hasFinancialTransfer')}</span>
              ) : null}
            </div>

            {c.state.hasFinancialTransfer ? (
              <>
                {/* Banco: seletor pelo código FEBRABAN, e não `txt`, porque o campo deixou de ser texto
                    livre. Fora do modo de edição o seletor fica desabilitado, mas continua mostrando
                    "237 · Bradesco" — o código sozinho não diz nada a quem está conferindo. */}
                <div className={field}>
                  <label htmlFor="ad-bank" className={fieldLabel}>
                    {t('partners.acts.form.bank')}
                  </label>
                  <BankSelect
                    id="ad-bank"
                    value={c.state.bank}
                    labels={BANK_LABELS}
                    invalid={c.errors['bankAccount.bank'] !== undefined}
                    disabled={!editing}
                    ariaLabel={t('partners.acts.form.bank')}
                    onChange={(code) => {
                      c.setField('bank', code)
                    }}
                  />
                  {invalidMsg('bankAccount.bank') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                  ) : isUnknownBank(c.state.bank) ? (
                    <span className={fieldError}>{BANK_UNKNOWN_HINT}</span>
                  ) : null}
                </div>
                {txt('agency', t('partners.acts.form.agency'), 'bankAccount.agency')}
                {txt('accountNumber', t('partners.acts.form.accountNumber'), 'bankAccount.accountNumber')}
                {txt('checkDigit', t('partners.acts.form.checkDigit'), 'bankAccount.checkDigit')}
                <div className={field}>
                  <label htmlFor="ad-pix-type" className={fieldLabel}>
                    {t('partners.acts.form.pixType')}
                  </label>
                  <SelectControl
                    id="ad-pix-type"
                    value={c.state.pixKeyType}
                    ariaLabel={t('partners.acts.form.pixType')}
                    disabled={!editing}
                    invalid={c.errors['pixKey.keyType'] !== undefined}
                    onChange={(e) => {
                      if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value)
                    }}
                  >
                    {PIX_KEY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {t(`partners.acts.pix.${pt}`)}
                      </option>
                    ))}
                  </SelectControl>
                  {invalidMsg('pixKey.keyType') !== null ? (
                    <span className={fieldError}>{invalidMsg('pixKey.keyType')}</span>
                  ) : null}
                </div>
                {txt('pixKey', t('partners.acts.form.pixKey'), 'pixKey.key')}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
