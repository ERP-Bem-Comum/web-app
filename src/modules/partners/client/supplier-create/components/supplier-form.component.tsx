import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Checkbox, Field, Input } from '#shared/ui/index.ts'

import { PIX_KEY_TYPES, isPixKeyType, type SupplierFormController } from './supplier-form.controller.ts'
import {
  cancelButton,
  checkboxRow,
  errorBanner,
  footer,
  form,
  grid,
  saveWrap,
  section,
  sectionTitle,
  select,
} from './supplier-form.css.ts'

const t = createTranslator(ptBR)

export type SupplierFormProps = Readonly<{
  controller: SupplierFormController
  categories: readonly string[]
  /** Mostra as seções Banco/PIX (payment target). Na criação/edição = quem tem `supplier:write`. */
  canEditSensitive: boolean
  /** Bloqueia o campo CNPJ (vital): true na edição sem `supplier:edit-sensitive`. */
  cnpjDisabled?: boolean
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

export function SupplierForm(props: SupplierFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.suppliers.form.invalid') : undefined

  return (
    <form
      className={form}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      {props.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(props.errorTag)}
        </div>
      ) : null}

      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.suppliers.form.section.basic')}</h2>
        <div className={grid}>
          <Field htmlFor="sup-name" label={t('partners.suppliers.form.name')} error={invalid('name')}>
            <Input id="sup-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="sup-corp" label={t('partners.suppliers.form.corporateName')} error={invalid('corporateName')}>
            <Input id="sup-corp" value={c.state.corporateName} onChange={(v) => { c.setField('corporateName', v); }} />
          </Field>
          <Field htmlFor="sup-fant" label={t('partners.suppliers.form.fantasyName')} error={invalid('fantasyName')}>
            <Input id="sup-fant" value={c.state.fantasyName} onChange={(v) => { c.setField('fantasyName', v); }} />
          </Field>
          <Field htmlFor="sup-email" label={t('partners.suppliers.form.email')} error={invalid('email')}>
            <Input id="sup-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
          <Field htmlFor="sup-cnpj" label={t('partners.suppliers.form.cnpj')} error={invalid('cnpj')}>
            <Input id="sup-cnpj" value={c.state.cnpj} disabled={props.cnpjDisabled} onChange={(v) => { c.setField('cnpj', v); }} />
          </Field>
          <Field htmlFor="sup-cat" label={t('partners.suppliers.form.category')} error={invalid('serviceCategory')}>
            <select
              id="sup-cat"
              className={select}
              value={c.state.serviceCategory}
              onChange={(e) => { c.setField('serviceCategory', e.target.value); }}
            >
              <option value="">{t('partners.suppliers.form.select')}</option>
              {props.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {props.canEditSensitive ? (
        <>
          <section className={section}>
            <h2 className={sectionTitle}>{t('partners.suppliers.form.section.banking')}</h2>
            <label className={checkboxRow}>
              <Checkbox
                id="sup-bank-enabled"
                checked={c.state.bankEnabled}
                onChange={(v) => { c.setField('bankEnabled', v); }}
              />
              {t('partners.suppliers.form.enableBanking')}
            </label>
            {c.state.bankEnabled ? (
              <div className={grid}>
                <Field htmlFor="sup-bank" label={t('partners.suppliers.form.bank')} error={invalid('bankAccount.bank')}>
                  <Input id="sup-bank" value={c.state.bank} onChange={(v) => { c.setField('bank', v); }} />
                </Field>
                <Field htmlFor="sup-agency" label={t('partners.suppliers.form.agency')} error={invalid('bankAccount.agency')}>
                  <Input id="sup-agency" value={c.state.agency} onChange={(v) => { c.setField('agency', v); }} />
                </Field>
                <Field htmlFor="sup-acc" label={t('partners.suppliers.form.accountNumber')} error={invalid('bankAccount.accountNumber')}>
                  <Input id="sup-acc" value={c.state.accountNumber} onChange={(v) => { c.setField('accountNumber', v); }} />
                </Field>
                <Field htmlFor="sup-dv" label={t('partners.suppliers.form.checkDigit')} error={invalid('bankAccount.checkDigit')}>
                  <Input id="sup-dv" value={c.state.checkDigit} onChange={(v) => { c.setField('checkDigit', v); }} />
                </Field>
              </div>
            ) : null}
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>{t('partners.suppliers.form.section.pix')}</h2>
            <label className={checkboxRow}>
              <Checkbox id="sup-pix-enabled" checked={c.state.pixEnabled} onChange={(v) => { c.setField('pixEnabled', v); }} />
              {t('partners.suppliers.form.enablePix')}
            </label>
            {c.state.pixEnabled ? (
              <div className={grid}>
                <Field htmlFor="sup-pix-type" label={t('partners.suppliers.form.pixType')} error={invalid('pixKey.keyType')}>
                  <select
                    id="sup-pix-type"
                    className={select}
                    value={c.state.pixKeyType}
                    onChange={(e) => {
                      if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value)
                    }}
                  >
                    {PIX_KEY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {t(`partners.suppliers.pix.${pt}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field htmlFor="sup-pix-key" label={t('partners.suppliers.form.pixKey')} error={invalid('pixKey.key')}>
                  <Input id="sup-pix-key" value={c.state.pixKey} onChange={(v) => { c.setField('pixKey', v); }} />
                </Field>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('partners.suppliers.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button
            type="submit"
            loading={props.running}
            loadingLabel={t('partners.suppliers.form.saving')}
          >
            {t('partners.suppliers.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
