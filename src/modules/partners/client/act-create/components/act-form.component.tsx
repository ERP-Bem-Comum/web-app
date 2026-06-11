import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Checkbox, Field, Input } from '#shared/ui/index.ts'

import { OCCUPATION_AREAS, PIX_KEY_TYPES, isPixKeyType, type ActFormController } from './act-form.controller.ts'
import {
  cancelButton,
  errorBanner,
  footer,
  form,
  grid,
  hint,
  saveWrap,
  section,
  sectionTitle,
  select,
} from './act-form.css.ts'

const t = createTranslator(ptBR)

export type ActFormProps = Readonly<{
  controller: ActFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

/**
 * Formulário do Acordo de Cooperação Técnica (instituição/CNPJ). Espelha o form do Fornecedor com 3
 * seções: identificação do instrumento, dados da instituição e repasse financeiro. O toggle
 * `hasFinancialTransfer` revela conta bancária + PIX (exige ao menos um). View burra; sem literais.
 */
export function ActForm(props: ActFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : undefined

  return (
    <form
      className={form}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      {props.errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(props.errorTag)}</div>
      ) : null}

      {/* Seção 1 — Identificação do Instrumento */}
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.instrument')}</h2>
        <div className={grid}>
          <Field htmlFor="act-number" label={t('partners.acts.form.actNumber')} error={invalid('actNumber')}>
            <Input id="act-number" value={c.state.actNumber} onChange={(v) => { c.setField('actNumber', v); }} />
          </Field>
          <Field htmlFor="act-name" label={t('partners.acts.form.name')} error={invalid('name')}>
            <Input id="act-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="act-area" label={t('partners.acts.form.occupationArea')} error={invalid('occupationArea')}>
            <select id="act-area" className={select} value={c.state.occupationArea} onChange={(e) => { c.setField('occupationArea', e.target.value); }}>
              <option value="">{t('partners.acts.form.select')}</option>
              {OCCUPATION_AREAS.map((a) => (
                <option key={a} value={a}>{t(`partners.acts.area.${a}`)}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="act-start" label={t('partners.acts.form.startDate')} error={invalid('startDate')}>
            <Input id="act-start" type="date" value={c.state.startDate} onChange={(v) => { c.setField('startDate', v); }} />
          </Field>
          <Field htmlFor="act-end" label={t('partners.acts.form.endDate')} error={invalid('endDate')}>
            <Input id="act-end" type="date" value={c.state.endDate} onChange={(v) => { c.setField('endDate', v); }} />
          </Field>
        </div>
      </section>

      {/* Seção 2 — Dados da Instituição Parceira */}
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.institution')}</h2>
        <div className={grid}>
          <Field htmlFor="act-cnpj" label={t('partners.acts.form.cnpj')} error={invalid('cnpj')}>
            <Input id="act-cnpj" mask="cnpj" value={c.state.cnpj} onChange={(v) => { c.setField('cnpj', v); }} />
          </Field>
          <Field htmlFor="act-corp" label={t('partners.acts.form.corporateName')} error={invalid('corporateName')}>
            <Input id="act-corp" value={c.state.corporateName} onChange={(v) => { c.setField('corporateName', v); }} />
          </Field>
          <Field htmlFor="act-fantasy" label={t('partners.acts.form.fantasyName')} error={invalid('fantasyName')}>
            <Input id="act-fantasy" value={c.state.fantasyName} onChange={(v) => { c.setField('fantasyName', v); }} />
          </Field>
          <Field htmlFor="act-rep" label={t('partners.acts.form.legalRepresentative')} error={invalid('legalRepresentative')}>
            <Input id="act-rep" value={c.state.legalRepresentative} onChange={(v) => { c.setField('legalRepresentative', v); }} />
          </Field>
          <Field htmlFor="act-email" label={t('partners.acts.form.email')} error={invalid('email')}>
            <Input id="act-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
        </div>
      </section>

      {/* Seção 3 — Repasse Financeiro (toggle revela conta/PIX) */}
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.payment')}</h2>
        <div className={grid}>
          <Field htmlFor="act-transfer" label={t('partners.acts.form.hasFinancialTransfer')} error={invalid('hasFinancialTransfer')}>
            <Checkbox id="act-transfer" checked={c.state.hasFinancialTransfer} onChange={(v) => { c.setField('hasFinancialTransfer', v); }} />
          </Field>
        </div>
        {c.state.hasFinancialTransfer ? (
          <>
            <p className={hint}>{t('partners.acts.form.financialHint')}</p>
            <div className={grid}>
              <Field htmlFor="act-bank" label={t('partners.acts.form.bank')} error={invalid('bankAccount.bank')}>
                <Input id="act-bank" value={c.state.bank} onChange={(v) => { c.setField('bank', v); }} />
              </Field>
              <Field htmlFor="act-agency" label={t('partners.acts.form.agency')} error={invalid('bankAccount.agency')}>
                <Input id="act-agency" value={c.state.agency} onChange={(v) => { c.setField('agency', v); }} />
              </Field>
              <Field htmlFor="act-account" label={t('partners.acts.form.accountNumber')} error={invalid('bankAccount.accountNumber')}>
                <Input id="act-account" value={c.state.accountNumber} onChange={(v) => { c.setField('accountNumber', v); }} />
              </Field>
              <Field htmlFor="act-dv" label={t('partners.acts.form.checkDigit')} error={invalid('bankAccount.checkDigit')}>
                <Input id="act-dv" value={c.state.checkDigit} onChange={(v) => { c.setField('checkDigit', v); }} />
              </Field>
              <Field htmlFor="act-pix-type" label={t('partners.acts.form.pixType')} error={invalid('pixKey.keyType')}>
                <select
                  id="act-pix-type"
                  className={select}
                  value={c.state.pixKeyType}
                  onChange={(e) => { if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value) }}
                >
                  {PIX_KEY_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{t(`partners.acts.pix.${pt}`)}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="act-pix-key" label={t('partners.acts.form.pixKey')} error={invalid('pixKey.key')}>
                <Input id="act-pix-key" value={c.state.pixKey} onChange={(v) => { c.setField('pixKey', v); }} />
              </Field>
            </div>
          </>
        ) : null}
      </section>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('partners.acts.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button type="submit" loading={props.running} loadingLabel={t('partners.acts.form.saving')}>
            {t('partners.acts.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
