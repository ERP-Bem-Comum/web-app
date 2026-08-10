/**
 * useAutocadastroBinding — ADAPTER React (#040, ADR-0009, §XI): liga o `autocadastroViewModel` agnóstico
 * às primitivas reativas (TanStack `useQuery` do preview + `useMutation` do submit). É o ÚNICO ponto que
 * toca o framework. Expõe o estado derivado da PÁGINA (invalid | loading | ready) e o `submitCommand`.
 *
 * Regras (#040): o preview só busca com token (`enabled`); o submit 400 'cpf-mismatch' NÃO navega —
 * mantém o form e devolve a `errorTag` (a página mostra a mensagem). Sucesso (2xx) → `succeeded`.
 */
import { useMutation, useQuery } from '@tanstack/react-query'

import { isErr, isOk } from '#shared/primitives/result.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'
import { autocadastroViewModel, type AutocadastroPageState } from '../viewModel/autocadastro.view-model.ts'

export type AutocadastroSubmitCommand = Readonly<{
  running: boolean
  succeeded: boolean
  /** Tag i18n do erro do submit (400 cpf-mismatch / 404 invalid / rede) ou null. */
  errorTag: string | null
  execute: (input: AutocadastroSubmitInput) => void
  /** Limpa o erro do submit (chamado ao editar o form). */
  resetError: () => void
}>

export const useAutocadastroBinding = (
  token: string | null,
): Readonly<{
  pageState: AutocadastroPageState
  submitCommand: AutocadastroSubmitCommand
}> => {
  const hasToken = token !== null && token.trim() !== ''

  const preview = useQuery({
    ...autocadastroViewModel.previewQuery(token ?? ''),
    enabled: hasToken,
  })

  const pageState = autocadastroViewModel.derivePageState({
    token,
    pending: preview.isPending,
    result: preview.data,
  })

  const mutation = useMutation(autocadastroViewModel.submitMutation)

  const data = mutation.data
  const succeeded = data !== undefined && isOk(data)
  // Erro ESPERADO (400 cpf-mismatch / 404 invalid / rede) chega como Result.err; lançado → mutation.error.
  const errorTag =
    data !== undefined && isErr(data)
      ? autocadastroViewModel.toErrorTag(data.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  return {
    pageState,
    submitCommand: {
      running: mutation.isPending,
      succeeded,
      errorTag,
      execute: (input) => {
        mutation.mutate(input)
      },
      resetError: () => {
        mutation.reset()
      },
    },
  }
}
