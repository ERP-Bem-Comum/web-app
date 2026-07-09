import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { partnersRepository } from '#modules/contracts/client/data/repository/partners.repository.instance.ts'
import type { PartnerSearchResult } from '#modules/contracts/client/data/repository/partners.repository.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { listFinancialReferencesFn } from '#modules/financial/public-api/index.ts'
import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { contractCreateViewModel } from './contract-create.view-model.ts'

export type ProgramOption = Readonly<{ value: string; label: string }>

/**
 * Opções REAIS de Centro de Custo + Categoria para o Novo Contrato — consome as referências de categorização
 * do Financeiro (cross-módulo via public-api §I): mesma taxonomia (dados legados migrados) que o Lançar
 * Documento já usa. `value` = NOME (o contrato guarda string livre em `centroDeCusto`/`categorizacao` — o
 * dropdown exibe o legado p/ seleção sem exigir mudança de contrato no backend). Degradação graciosa → [].
 */
export const useContractReferenceOptionsBinding = (): Readonly<{
  costCenterOptions: readonly ProgramOption[]
  categoryOptions: readonly ProgramOption[]
}> => {
  const q = useQuery({
    queryKey: ['financial', 'reference-options', 'contract-create'],
    queryFn: async () => {
      const res = await listFinancialReferencesFn()
      return res.ok ? res.data : { categories: [], costCenters: [] }
    },
    staleTime: 300_000,
  })
  const refs = q.data ?? { categories: [], costCenters: [] }
  return {
    costCenterOptions: refs.costCenters.map((c) => ({ value: c.name, label: `${c.code} — ${c.name}` })),
    categoryOptions: refs.categories.map((c) => ({ value: c.name, label: c.name })),
  }
}

/**
 * Opções REAIS de Plano Orçamentário para o Novo Contrato — consome `GET /budget-plans` (cross-módulo).
 * `value` = id (UUID, casa com `budgetPlanId`); `label` = "ano sigla versão". Hoje vem vazio (core-api#374:
 * driver memory + sem dado); acende sem retrabalho quando o backend subir. Degradação graciosa → [].
 */
export const useContractBudgetPlanOptionsBinding = (): readonly ProgramOption[] => {
  const q = useQuery({
    queryKey: ['budget-plans', 'options', 'contract-create'],
    queryFn: async (): Promise<readonly ProgramOption[]> => {
      const res = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!res.ok) return []
      return res.data.items.map((p) => ({
        value: p.id,
        label: `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}`,
      }))
    },
    staleTime: 60_000,
  })
  return q.data ?? []
}

// D8 (ADR-0013): opções reais de Programa para o seletor do create — UUID (value) → sigla (label).
// Consome a listagem de programas via public-api de `programs` (boundary respeitado). Degradação
// graciosa: erro/sem permissão → lista vazia (campo fica sem opções, mas o create não trava).
export const useContractProgramOptionsBinding = (): readonly ProgramOption[] => {
  const q = useQuery({
    queryKey: ['programs', 'options', 'contract-create'],
    queryFn: async (): Promise<readonly ProgramOption[]> => {
      const res = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page: 1, limit: 25 } })
      return res.ok ? res.data.items.map((p) => ({ value: p.id, label: p.sigla })) : []
    },
    staleTime: 60_000,
  })
  return q.data ?? []
}

export type CreateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: CreateContractInput) => void
}>

export type { PartnerSearchResult } from '#modules/contracts/client/data/repository/partners.repository.ts'

export const useContractCreateBinding = (): Readonly<{ createCommand: CreateContractCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...contractCreateViewModel.mutation,
    onSuccess: (result) => {
      contractCreateViewModel.onSuccess(result)
      // Sucesso → invalida a lista p/ o grid refletir o novo contrato (espelha end-contract/amendment).
      if (isOk(result)) {
        void queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
      }
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? contractCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
  }
}

// Busca UNIFICADA: traz TODOS os parceiros (fornecedores, financiadores, colaboradores) para o
// combobox — o usuário seleciona qualquer um e o tipo do contrato é derivado da escolha (ver
// handleSelectPartner). Não filtra mais pelo `contractType` pré-selecionado. (ACT fica fora até o
// vínculo de ACT ser suportado — filtrado no repository.)
export const usePartnerSearchBinding = (
  query: string,
  isOpen: boolean,
): Readonly<{
  results: readonly PartnerSearchResult[]
  isLoading: boolean
}> => {
  const q = useQuery({
    queryKey: ['partners', 'search', query],
    queryFn: async () => {
      const res = await partnersRepository.search(query)
      if (!isOk(res)) return [] as PartnerSearchResult[]
      return res.value
    },
    enabled: isOpen,
    staleTime: 30_000,
  })

  return {
    results: q.data ?? [],
    isLoading: q.isLoading,
  }
}
