/**
 * Controller do form "Adicionar Plano Orçamentário" (§XI: form-state em React vive SÓ no controller/binding).
 * UI-state do modal + validação (via ViewModel puro) + submit REAL: `useMutation(repository.create)` →
 * `POST /budget-plans`. No sucesso, invalida a lista (a grid relê o real) e fecha; no 409, mostra o conflito
 * do BACKEND (a unicidade deixou de ser checada client-side).
 *
 * Dropdown de Programa: usa os PROGRAMAS REAIS (ATIVO) do módulo `programs` (`listProgramsFn`), com
 * `{ abbreviation: sigla, ref: id }`. O `id` do programa É o mesmo UUID que o catálogo do budget-plans
 * (`ProgramCatalogFromPrograms`) valida no `POST` — ambos leem `prg_programs`. Evita o `GET /budget-plans/options`,
 * que hoje quebra na serialização (`redes[].ref` não-UUID — bug de backend, handoff ao tech lead).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import {
  CreateBudgetPlanInputSchema,
  type BudgetPlanProgramOption,
} from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import { planejamentoListQueryKey } from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import {
  createPlanInitialForm,
  validateCreatePlan,
  createErrorTag,
  toCreateInput,
  importYearsState,
  type CreatePlanForm,
  type CreatePlanError,
  type ImportYearsState,
} from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'

const EMPTY_OPTIONS: readonly BudgetPlanProgramOption[] = []

/** Chave dos anos de origem por programa (spec 134). Exportada p/ teste e invalidação. */
export const importSourceYearsQueryKey = (programRef: string) =>
  ['budget-plans', 'import-source-years', programRef] as const

/**
 * Opções de PROGRAMA para o modal "Criar Plano" — programas REAIS ATIVO do módulo `programs`, mapeados p/
 * `{ abbreviation: sigla, ref: id }`. O dropdown exibe `abbreviation`; o submit manda o `ref` (= UUID do
 * programa, o mesmo que o catálogo do budget-plans valida). Erro/loading/sem-permissão → [].
 */
export function useCreateProgramOptions(): readonly BudgetPlanProgramOption[] {
  const q = useQuery({
    queryKey: ['programs', 'options', 'budget-plan-create'],
    queryFn: async (): Promise<readonly BudgetPlanProgramOption[]> => {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page: 1, limit: 25 } })
      return r.ok ? r.data.items.map((p) => ({ abbreviation: p.sigla, ref: p.id })) : EMPTY_OPTIONS
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY_OPTIONS
}

export type CreatePlanController = Readonly<{
  form: CreatePlanForm
  errorTag: CreatePlanError | null
  submitting: boolean
  /** Spec 134 — situação do seletor "Criar a partir do ano de" (anos com plano APROVADO do programa). */
  importYears: ImportYearsState
  setYear: (v: string) => void
  setProgram: (v: string) => void
  toggleImport: (v: boolean) => void
  setImportFromYear: (v: string) => void
  reset: () => void
  submit: () => void
}>

export function useCreatePlan(onCreated: () => void): CreatePlanController {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreatePlanForm>(createPlanInitialForm)
  const [errorTag, setErrorTag] = useState<CreatePlanError | null>(null)

  const reset = (): void => {
    setForm(createPlanInitialForm)
    setErrorTag(null)
  }

  // Spec 134: os anos de origem dependem do PROGRAMA e só interessam com "Importar dados" ligado. Falha → `null`
  // (o seletor diz que não carregou, em vez de parecer "nenhum plano aprovado").
  const yearsQuery = useQuery({
    queryKey: importSourceYearsQueryKey(form.program),
    queryFn: async (): Promise<readonly number[] | null> => {
      const r = await budgetPlansRepository.listImportSourceYears(form.program)
      return isOk(r) ? r.value : null
    },
    enabled: form.importData && form.program !== '',
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: budgetPlansRepository.create,
    onSuccess: (res) => {
      if (isOk(res)) {
        // A grid lê o real → invalidar a lista faz o plano novo aparecer sem reload (§XI server-state).
        void queryClient.invalidateQueries({ queryKey: planejamentoListQueryKey })
        reset()
        onCreated()
        return
      }
      setErrorTag(createErrorTag(res.error))
    },
    onError: () => {
      setErrorTag('budget-plans.create.unexpected')
    },
  })

  return {
    form,
    errorTag,
    submitting: mutation.isPending,
    importYears: importYearsState(form.program, form.year, yearsQuery.data),
    setYear: (v) => {
      setForm((f) => ({ ...f, year: v }))
      setErrorTag(null)
    },
    setProgram: (v) => {
      // Os anos de origem são do programa: trocar o programa invalida o ano já escolhido.
      setForm((f) => ({ ...f, program: v, importFromYear: '' }))
      setErrorTag(null)
    },
    toggleImport: (v) => {
      setForm((f) => ({ ...f, importData: v, importFromYear: v ? f.importFromYear : '' }))
      setErrorTag(null)
    },
    setImportFromYear: (v) => {
      setForm((f) => ({ ...f, importFromYear: v }))
      setErrorTag(null)
    },
    reset,
    submit: () => {
      const error = validateCreatePlan(form)
      if (error !== null) {
        setErrorTag(error)
        return
      }
      // Zod é a fonte da forma: `programRef` precisa ser um UUID válido (blinda contra estado inválido).
      const parsed = CreateBudgetPlanInputSchema.safeParse(toCreateInput(form))
      if (!parsed.success) {
        setErrorTag('budget-plans.create.requiredProgram')
        return
      }
      setErrorTag(null)
      mutation.mutate(parsed.data)
    },
  }
}
