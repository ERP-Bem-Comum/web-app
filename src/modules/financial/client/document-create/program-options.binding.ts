/**
 * Binding de opções de PROGRAMA para a Categorização do Lançar Documento — ADAPTER React. Lista os
 * programas ATIVOS (cross-módulo SÓ via public-api — §I) p/ o dropdown editável de Programa, que envia
 * `programRef` no create. Pagina (o list-fn limita a 25/página). Erro/loading → lista vazia.
 */
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'

export type ProgramOption = Readonly<{ id: string; name: string }>

const programOptionsQueryOptions = {
  queryKey: ['financial', 'program-options'] as const,
  queryFn: async (): Promise<readonly ProgramOption[]> => {
    const out: ProgramOption[] = []
    let page = 1
    for (;;) {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page, limit: 25 } })
      if (!r.ok) break
      for (const p of r.data.items) out.push({ id: p.id, name: p.name })
      const { total, limit } = r.data.meta
      if (r.data.items.length === 0 || page * limit >= total) break
      page += 1
    }
    return out
  },
  staleTime: 60_000,
}

export function useProgramOptions(): readonly ProgramOption[] {
  const query = useQuery(programOptionsQueryOptions)
  return query.data ?? []
}
