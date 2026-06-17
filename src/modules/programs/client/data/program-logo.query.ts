/**
 * Query options do LOGO de um programa — AGNÓSTICO (puro). Sobre o repository. Busca os bytes (base64)
 * via BFF e devolve um **data URL** pronto p/ `<img src>`, ou `null` quando não há logo. Só dispara
 * quando `logoKey !== null` (o caller usa `enabled`). Cache de 5 min (a imagem muda só no upload).
 */
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'

export const programLogoQueryKey = (id: string) => ['programs', 'logo', id] as const

export const programLogoQueryOptions = (id: string) => ({
  queryKey: programLogoQueryKey(id),
  queryFn: async (): Promise<string | null> => {
    const r = await programsRepository.getLogo(id)
    if (!r.ok || r.value === null) return null
    return `data:${r.value.contentType};base64,${r.value.base64}`
  },
  staleTime: 5 * 60_000,
})
