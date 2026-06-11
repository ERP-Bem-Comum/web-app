import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { partnersRepository } from '#modules/contracts/client/data/repository/partners.repository.instance.ts'
import type { PartnerSearchResult } from '#modules/contracts/client/data/repository/partners.repository.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { contractCreateViewModel } from './contract-create.view-model.ts'

export type ProgramOption = Readonly<{ value: string; label: string }>

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
      execute: (input) => { mutation.mutate(input); },
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
