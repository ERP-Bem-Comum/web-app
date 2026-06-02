import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const t = createTranslator(ptBR)

interface Props {
  email: string
  telephone: string
  observations: string
  onEmailChange: (v: string) => void
  onTelephoneChange: (v: string) => void
  onObservationsChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

export function ContractEditForm(props: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onSubmit() }}>
      <label>{t('contracts.edit.field.email')}</label>
      <input value={props.email} onChange={(e) => props.onEmailChange(e.target.value)} />
      <label>{t('contracts.edit.field.telephone')}</label>
      <input value={props.telephone} onChange={(e) => props.onTelephoneChange(e.target.value)} />
      <label>{t('contracts.edit.field.observations')}</label>
      <textarea value={props.observations} onChange={(e) => props.onObservationsChange(e.target.value)} />
      {props.errorText && <div role="alert">{props.errorText}</div>}
      <button type="submit" disabled={props.submitting}>{t('contracts.edit.submit')}</button>
    </form>
  )
}
