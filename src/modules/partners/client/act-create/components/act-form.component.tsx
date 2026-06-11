import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'

import { OCCUPATION_AREAS, type ActFormController } from './act-form.controller.ts'
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
 * Formulário de ACT como "Acordo de Cooperação Técnica" (3 seções). Campos reaproveitados do modelo
 * atual (Título←name, Área←occupationArea, Representante←role, E-mail←email) são funcionais; os demais
 * (Número, Vigência, CNPJ/Razão Social/Nome Fantasia, Repasse/Valor, Banco/PIX) são placeholders
 * DESABILITADOS até o backend do ACT ser reformulado (hoje o ACT é pessoa-física). Ver gaps/ticket.
 */
export function ActForm(props: ActFormProps): ReactNode {
  const { controller: c } = props
  const [hasTransfer, setHasTransfer] = useState<'sim' | 'nao'>('nao')
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : undefined

  // Campo do legado ainda sem suporte no backend do ACT → exibido desabilitado.
  const gated = (id: string, label: string, type?: 'text' | 'number'): ReactNode => (
    <Field htmlFor={id} label={label}>
      <Input id={id} type={type} value="" disabled placeholder={t('partners.acts.form.gatedHint')} onChange={() => { /* gated */ }} />
    </Field>
  )

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
          {gated('act-number', t('partners.acts.form.actNumber'))}
          <Field htmlFor="act-name" label={t('partners.acts.form.objectTitle')} error={invalid('name')}>
            <Input id="act-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          {gated('act-validity', t('partners.acts.form.validityMonths'), 'number')}
          <Field htmlFor="act-area" label={t('partners.acts.form.areaAtuacao')} error={invalid('occupationArea')}>
            <select id="act-area" className={select} value={c.state.occupationArea} onChange={(e) => { c.setField('occupationArea', e.target.value); }}>
              <option value="">{t('partners.acts.form.select')}</option>
              {OCCUPATION_AREAS.map((a) => (
                <option key={a} value={a}>{t(`partners.acts.area.${a}`)}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Seção 2 — Dados da Instituição Parceira */}
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.institution')}</h2>
        <div className={grid}>
          {gated('act-cnpj', t('partners.acts.form.partnerCnpj'))}
          {gated('act-corp', t('partners.acts.form.partnerCorporateName'))}
          {gated('act-fantasy', t('partners.acts.form.partnerFantasyName'))}
          <Field htmlFor="act-role" label={t('partners.acts.form.legalRepresentative')} error={invalid('role')}>
            <Input id="act-role" value={c.state.role} onChange={(v) => { c.setField('role', v); }} />
          </Field>
          <Field htmlFor="act-email" label={t('partners.acts.form.emailContact')} error={invalid('email')}>
            <Input id="act-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
        </div>
      </section>

      {/* Seção 3 — Dados Bancários e PIX (inclui "Possui Repasse Financeiro?": Sim → bancários obrigatórios) */}
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.payment')}</h2>
        <div className={grid}>
          <Field htmlFor="act-transfer" label={t('partners.acts.form.hasFinancialTransfer')}>
            <select id="act-transfer" className={select} value={hasTransfer} onChange={(e) => { setHasTransfer(e.target.value === 'sim' ? 'sim' : 'nao'); }}>
              <option value="nao">{t('partners.acts.form.transferNo')}</option>
              <option value="sim">{t('partners.acts.form.transferYes')}</option>
            </select>
          </Field>
          {gated('act-bank', t('partners.acts.form.bank'))}
          {gated('act-agency', t('partners.acts.form.agency'))}
          {gated('act-account', t('partners.acts.form.accountNumber'))}
          {gated('act-dv', t('partners.acts.form.checkDigit'))}
          <Field htmlFor="act-pix-type" label={t('partners.acts.form.pixType')}>
            <select id="act-pix-type" className={select} disabled title={t('partners.acts.form.gatedHint')} aria-label={t('partners.acts.form.pixType')}>
              <option value="">{t('partners.acts.form.select')}</option>
            </select>
          </Field>
          {gated('act-pix-key', t('partners.acts.form.pixKey'))}
        </div>
        {hasTransfer === 'sim' ? <p className={hint}>{t('partners.acts.form.financialHint')}</p> : null}
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
