import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { fieldLabel, hint } from '#shared/ui/brand/brand-form.css.ts'

import { PERSON_TYPES, type PersonType } from './supplier-form.controller.ts'
import {
  personTypeField,
  personTypeGroup,
  personTypeOption,
  personTypeOptionOn,
} from './supplier-form.css.ts'

const t = createTranslator(ptBR)

export type PersonTypeSwitchProps = Readonly<{
  value: PersonType
  /** Fora do modo edição (detalhe só-leitura): a chave aparece, sem interação e sem explicação. */
  disabled?: boolean
  /** Edição sem `supplier:edit-sensitive`: trocar o tipo troca o documento (campo vital). Mostra o motivo. */
  locked?: boolean
  onChange: (next: PersonType) => void
}>

/** Chave segmentada "Pessoa Jurídica | Pessoa Física" (#1022). View burra: estado e regra no controller. */
export function PersonTypeSwitch(props: PersonTypeSwitchProps): ReactNode {
  const locked = props.locked === true
  const blocked = locked || props.disabled === true
  return (
    <div className={personTypeField}>
      <span className={fieldLabel} id="sup-person-type-label">
        {t('partners.suppliers.form.personType')}
      </span>
      <div className={personTypeGroup} role="group" aria-labelledby="sup-person-type-label">
        {PERSON_TYPES.map((pt) => (
          <button
            key={pt}
            type="button"
            className={props.value === pt ? personTypeOptionOn : personTypeOption}
            aria-pressed={props.value === pt}
            disabled={blocked}
            onClick={() => {
              props.onChange(pt)
            }}
          >
            {t(`partners.suppliers.personType.${pt}`)}
          </button>
        ))}
      </div>
      {locked && props.disabled !== true ? (
        <span className={hint}>{t('partners.suppliers.form.personTypeLocked')}</span>
      ) : null}
    </div>
  )
}
