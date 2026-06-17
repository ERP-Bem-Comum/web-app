/**
 * Bindings do LOGO de Programa (display + upload) — ADAPTER React. Display: `useQuery` (só quando há
 * logoKey) → data URL. Upload: `useMutation` → repository.uploadLogo; no sucesso invalida tudo de
 * `['programs']` (lista + detalhe + a própria imagem). Errors-as-values → tag i18n.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'
import { programsErrorTag } from '#modules/programs/client/data/helpers/programs-error-tag.ts'
import {
  programLogoQueryOptions,
  programLogoQueryKey,
} from '#modules/programs/client/data/program-logo.query.ts'

export type ProgramLogoView = Readonly<{ url: string | null; loading: boolean }>

/** Display: busca o logo só quando o programa tem `logoKey` (senão devolve null sem chamar o BFF). */
export function useProgramLogo(id: string, logoKey: string | null): ProgramLogoView {
  const q = useQuery({ ...programLogoQueryOptions(id), enabled: logoKey !== null })
  return { url: logoKey !== null ? (q.data ?? null) : null, loading: logoKey !== null && q.isLoading }
}

export type ProgramLogoUploadCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (fileBase64: string, mimeType: string) => void
}>

export function useProgramLogoUpload(id: string): ProgramLogoUploadCommand {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['programs', 'logo', 'upload', id] as const,
    mutationFn: (input: Readonly<{ fileBase64: string; mimeType: string }>) =>
      programsRepository.uploadLogo({ id, ...input }),
    onSuccess: (res) => {
      if (!isOk(res)) return
      void queryClient.invalidateQueries({ queryKey: programLogoQueryKey(id) })
      void queryClient.invalidateQueries({ queryKey: ['programs', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['programs', 'detail', id] })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? programsErrorTag(data.error)
      : mutation.isError
        ? 'programs.error.server'
        : null

  return {
    running: mutation.isPending,
    errorTag,
    execute: (fileBase64, mimeType) => {
      mutation.mutate({ fileBase64, mimeType })
    },
  }
}
