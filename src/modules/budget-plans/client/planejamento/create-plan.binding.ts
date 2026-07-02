/**
 * Controller do form "Adicionar Plano Orçamentário" (§XI: form-state em React vive SÓ no controller/binding).
 * UI-state do modal + validação (via ViewModel puro) + submit. Front-first: a unicidade é checada contra o
 * placeholder da lista; o submit monta o `CreateBudgetPlanInput` (Zod) e é TODO(#113 POST /budget-plans).
 *
 * 🔁 TODO(#113): trocar o `programToId`/placeholder por `useMutation(budgetPlansRepository.create)` +
 * invalidação da query da lista; o form-state e a view NÃO mudam — só o submit passa a integrar de fato.
 */
import { useMemo, useState } from 'react'

import { CreateBudgetPlanInputSchema } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import { PLANEJAMENTO_PLACEHOLDER } from '#modules/budget-plans/client/data/planejamento-list.placeholder.ts'
import {
  createPlanInitialForm,
  validateCreatePlan,
  IMPORT_YEARS,
  type CreatePlanForm,
  type CreatePlanError,
} from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'

// A VIEW não importa `data/`/view-model direto (§XI MVVM) — os anos de import passam pela camada de binding.
export { IMPORT_YEARS }

export type CreatePlanController = Readonly<{
  form: CreatePlanForm
  errorTag: CreatePlanError | null
  setYear: (v: string) => void
  setProgram: (v: string) => void
  toggleImport: (v: boolean) => void
  setImportFromYear: (v: string) => void
  reset: () => void
  submit: () => void
}>

/**
 * `programToId`: resolve a opção textual do dropdown (abreviação/nome) para o `programId` numérico do
 * `CreateBudgetPlanInput`. Front-first: sem catálogo de programas ainda, mapeia por índice estável (>0).
 */
export function useCreatePlan(
  programOptions: readonly string[],
  onCreated: () => void,
): CreatePlanController {
  const [form, setForm] = useState<CreatePlanForm>(createPlanInitialForm)
  const [errorTag, setErrorTag] = useState<CreatePlanError | null>(null)

  const programToId = useMemo<ReadonlyMap<string, number>>(
    () => new Map(programOptions.map((p, i) => [p, i + 1])),
    [programOptions],
  )

  const reset = (): void => {
    setForm(createPlanInitialForm)
    setErrorTag(null)
  }

  return {
    form,
    errorTag,
    setYear: (v) => {
      setForm((f) => ({ ...f, year: v }))
      setErrorTag(null)
    },
    setProgram: (v) => {
      setForm((f) => ({ ...f, program: v }))
      setErrorTag(null)
    },
    toggleImport: (v) => {
      setForm((f) => ({ ...f, importData: v, importFromYear: v ? f.importFromYear : '' }))
    },
    setImportFromYear: (v) => {
      setForm((f) => ({ ...f, importFromYear: v }))
    },
    reset,
    submit: () => {
      const error = validateCreatePlan(form, PLANEJAMENTO_PLACEHOLDER)
      if (error !== null) {
        setErrorTag(error)
        return
      }
      const programId = programToId.get(form.program) ?? 0
      // Monta o input do contrato real (Zod é a fonte da forma). `safeParse` blinda contra estado inválido.
      const parsed = CreateBudgetPlanInputSchema.safeParse({
        year: Number(form.year),
        programId,
        ...(form.importData && form.importFromYear !== ''
          ? { yearForImport: Number(form.importFromYear) }
          : {}),
      })
      if (!parsed.success) {
        setErrorTag('budget-plans.create.requiredProgram')
        return
      }
      // TODO(#113 POST /budget-plans): enviar `parsed.data` via budgetPlansRepository.create + invalidar a lista.
      reset()
      onCreated()
    },
  }
}
