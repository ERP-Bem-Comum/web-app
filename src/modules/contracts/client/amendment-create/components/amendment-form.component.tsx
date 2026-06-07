import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { AmendmentFormState } from './amendment-form.controller.ts'

const t = createTranslator(ptBR)

interface Props {
  state: AmendmentFormState
  onUpdate: <K extends keyof AmendmentFormState>(key: K, value: AmendmentFormState[K]) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

const types: AmendmentFormState['type'][] = ['prazo', 'valor', 'escopo', 'outro', 'distrato']

export function AmendmentForm({ state, onUpdate, onSubmit, submitting, errorText }: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <div>
        <label>{t('contracts.amendment.field.type')}</label>
        <div>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { onUpdate('type', type); }}
              style={{ background: state.type === type ? '#e0e0e0' : 'white' }}
            >
              {type ? t(`contracts.amendment.type.${type}`) : ''}
              <small>{type ? t(`contracts.amendment.type.desc.${type}`) : ''}</small>
            </button>
          ))}
        </div>
      </div>
      {state.type === 'prazo' && (
        <label>
          {t('contracts.amendment.field.newEndDate')}
          <input type="date" value={state.newEndDate} onChange={(e) => { onUpdate('newEndDate', e.target.value); }} />
        </label>
      )}
      {state.type === 'valor' && (
        <>
          <div>
            <button type="button" onClick={() => { onUpdate('impactDirection', 'acrescimo'); }}>Acréscimo</button>
            <button type="button" onClick={() => { onUpdate('impactDirection', 'supressao'); }}>Supressão</button>
          </div>
          <label>
            {t('contracts.amendment.field.value')}
            <input type="number" value={state.impactValueCents} onChange={(e) => { onUpdate('impactValueCents', Number(e.target.value)); }} />
          </label>
        </>
      )}
      <label>
        {t('contracts.amendment.field.signedAt')}
        <input type="date" value={state.signedAt} onChange={(e) => { onUpdate('signedAt', e.target.value); }} />
      </label>
      <label>
        {t('contracts.amendment.field.startDate')}
        <input type="date" value={state.startDate} onChange={(e) => { onUpdate('startDate', e.target.value); }} />
      </label>
      <label>
        {t('contracts.amendment.field.description')}
        <textarea value={state.description} onChange={(e) => { onUpdate('description', e.target.value); }} />
      </label>
      {errorText && <div role="alert">{errorText}</div>}
      <button type="submit" disabled={submitting}>{t('contracts.amendment.submit')}</button>
    </form>
  )
}
