/**
 * Controller (§XI, ADR-0009) do form do Autocadastro (#040). Estado TRANSIENTE = os campos da 2ª fase
 * (`CollaboratorCompleteFieldsState`, núcleo puro reusado do detail SEM tocá-lo) + o `cpfPrefix` (prova
 * de posse leve). NÃO faz fetch. `buildSubmit(token)` monta o input do POST reusando `buildCompleteFields`
 * (que retorna EXATAMENTE os campos do submit menos o id) + `{ token, cpfPrefix: <só dígitos> }`.
 */
import { useCallback, useState } from 'react'

// Núcleo PURO dos campos da 2ª etapa — reuso do detail sem arrastar React nem mudar comportamento.
import {
  emptyCompleteFieldsState,
  buildCompleteFields,
  GENDER_IDENTITY_OTHER,
  PWD_TYPE_OTHER,
  pwdIssues as computePwdIssues,
  togglePwdType,
  type CollaboratorCompleteFieldsState,
  type PwdIssue,
} from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import {
  GENDER_IDENTITY_OPTIONS,
  RACES,
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_OPTIONS,
  FOOD_CATEGORIES,
  SEXES,
  MARITAL_STATUSES,
  PWD_ANSWERS,
  PWD_TYPES,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

// Re-export dos enums dos selects p/ a view burra consumir SEM importar `data/` direto (boundary §XI:
// client-ui não depende de client-data; o controller — client-controller — pode, e é sameFeature).
export {
  GENDER_IDENTITY_OPTIONS,
  GENDER_IDENTITY_OTHER,
  RACES,
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_OPTIONS,
  FOOD_CATEGORIES,
  SEXES,
  MARITAL_STATUSES,
  PWD_ANSWERS,
  PWD_TYPES,
  PWD_TYPE_OTHER,
  togglePwdType,
}

// Normalização local (só-dígitos) do cpfPrefix — puro, inline p/ não acoplar o controller ao view-model
// (boundary: client-controller não depende de client-view-model). Mesma regra do view-model/onlyDigits.
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

export interface AutocadastroFormController {
  readonly state: CollaboratorCompleteFieldsState
  readonly cpfPrefix: string
  readonly setField: <K extends keyof CollaboratorCompleteFieldsState>(
    key: K,
    value: CollaboratorCompleteFieldsState[K],
  ) => void
  readonly setCpfPrefix: (value: string) => void
  /** O que falta no PcD (spec 131) — a pergunta 1 é obrigatória aqui. Vazio = pode enviar. */
  readonly pwdIssues: readonly PwdIssue[]
  /**
   * Monta o input do POST: token + cpfPrefix (só dígitos) + campos da 2ª fase (via `buildCompleteFields`).
   * `null` enquanto o PcD estiver incompleto — o botão já fica desativado, isto é a defesa.
   */
  readonly buildSubmit: (token: string) => AutocadastroSubmitInput | null
}

export function useAutocadastroFormController(onDirty: (() => void) | undefined): AutocadastroFormController {
  const [state, setState] = useState<CollaboratorCompleteFieldsState>(emptyCompleteFieldsState)
  const [cpfPrefix, setCpfPrefixState] = useState('')

  const setField = useCallback<AutocadastroFormController['setField']>(
    (key, value) => {
      setState((s) => ({ ...s, [key]: value }))
      onDirty?.()
    },
    [onDirty],
  )

  const setCpfPrefix = useCallback(
    (value: string): void => {
      setCpfPrefixState(value)
      onDirty?.()
    },
    [onDirty],
  )

  const pwdIssues = computePwdIssues(state, { required: true })

  const buildSubmit = useCallback(
    (token: string): AutocadastroSubmitInput | null => {
      const { pwd, ...fields } = buildCompleteFields(state)
      if (pwd === undefined || computePwdIssues(state, { required: true }).length > 0) return null
      return { token, cpfPrefix: onlyDigits(cpfPrefix), pwd, ...fields }
    },
    [cpfPrefix, state],
  )

  return { state, cpfPrefix, setField, setCpfPrefix, pwdIssues, buildSubmit }
}
