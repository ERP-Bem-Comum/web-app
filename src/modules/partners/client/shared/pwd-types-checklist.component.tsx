/**
 * PwdTypesChecklist — componente BURRO (§XI): a "Pergunta 2" do PcD (spec 131), marcação múltipla dos tipos
 * de deficiência. Só props → JSX; quem decide QUANDO aparece (resposta "Sim"), a ordem e os rótulos é o
 * chamador. Compartilhado pelo detalhe do colaborador e pelo Autocadastro.
 */
import type { ReactNode } from 'react'

import { Checkbox } from '#shared/ui/index.ts'
import { fieldError } from '#shared/ui/brand/brand-form.css.ts'

import {
  group,
  legend,
  options as optionsClass,
  option,
  trailing as trailingClass,
} from './pwd-types-checklist.css.ts'

export type PwdTypesChecklistProps = Readonly<{
  idPrefix: string
  legend: string
  options: readonly Readonly<{ value: string; label: string }>[]
  selected: readonly string[]
  disabled: boolean
  /** Mensagem do que falta ("Marque ao menos um tipo") ou null. */
  error: string | null
  onToggle: (value: string, checked: boolean) => void
  /** Campo exibido na MESMA linha, depois da última opção (o texto de "Outra"). */
  trailing?: ReactNode
}>

export function PwdTypesChecklist(props: PwdTypesChecklistProps): ReactNode {
  return (
    <fieldset className={group} aria-invalid={props.error !== null || undefined}>
      <legend className={legend}>{props.legend}</legend>
      <div className={optionsClass}>
        {props.options.map((o) => {
          const id = `${props.idPrefix}-${o.value}`
          return (
            <label key={o.value} htmlFor={id} className={option} data-disabled={props.disabled}>
              <Checkbox
                id={id}
                checked={props.selected.includes(o.value)}
                disabled={props.disabled}
                onChange={(checked) => {
                  props.onToggle(o.value, checked)
                }}
              />
              {o.label}
            </label>
          )
        })}
        {props.trailing !== undefined ? <div className={trailingClass}>{props.trailing}</div> : null}
      </div>
      {props.error !== null ? (
        <span className={fieldError} role="alert">
          {props.error}
        </span>
      ) : null}
    </fieldset>
  )
}
