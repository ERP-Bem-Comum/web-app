import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractFormState } from './contract-form.controller.ts'

const t = createTranslator(ptBR)

interface Props {
  state: ContractFormState
  onUpdate: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

export function ContractForm({ state, onUpdate, onSubmit, submitting, errorText }: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <fieldset>
        <legend>{t('contracts.create.section.basic')}</legend>
        <label>{t('contracts.create.field.title')}</label>
        <input value={state.title} onChange={(e) => { onUpdate('title', e.target.value); }} />
        <label>{t('contracts.create.field.objective')}</label>
        <textarea value={state.objective} onChange={(e) => { onUpdate('objective', e.target.value); }} />
        <label>{t('contracts.create.field.classification')}</label>
        <select value={state.classification} onChange={(e) => { onUpdate('classification', e.target.value as 'Contract' | 'ServiceOrder'); }}>
          <option value="Contract">Contrato</option>
          <option value="ServiceOrder">Ordem de Serviço</option>
        </select>
        <label>{t('contracts.create.field.value')}</label>
        <input type="number" value={state.originalValueCents} onChange={(e) => { onUpdate('originalValueCents', Number(e.target.value)); }} />
        <label>{t('contracts.create.field.period')}</label>
        <input type="date" value={state.originalPeriodStart} onChange={(e) => { onUpdate('originalPeriodStart', e.target.value); }} />
        <input type="date" value={state.originalPeriodEnd} onChange={(e) => { onUpdate('originalPeriodEnd', e.target.value); }} />
      </fieldset>
      {errorText && <div role="alert">{errorText}</div>}
      <button type="submit" disabled={submitting}>{t('contracts.create.submit')}</button>
    </form>
  )
}
