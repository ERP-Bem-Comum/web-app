/**
 * useSelectedDocs (#201) — resolve os DOCUMENTOS dos títulos selecionados no grid por título, para as
 * ações em massa do footer (Aprovar/Reabrir/Excluir/Vencimento são do DOCUMENTO e precisam do `version`
 * + status do documento, que o `/payable-titles` não traz — core-api#229). Busca extra sob demanda
 * (GET /documents/:id por documento distinto); habilita só quando há seleção. Erros viram lista vazia.
 *
 * Quando o #229 enriquecer `/payable-titles` com version+status do documento, este binding sai e os alvos
 * passam a sair direto da linha.
 */
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentStatus } from '#modules/financial/client/data/model/document.model.ts'

export type SelectedDoc = Readonly<{ id: string; status: DocumentStatus; version: number }>

export function useSelectedDocs(documentIds: readonly string[]): Readonly<{
  docs: readonly SelectedDoc[]
  loading: boolean
}> {
  const ids = [...documentIds].sort() // chave estável (ordem da seleção não importa)
  const query = useQuery({
    queryKey: ['financial', 'documents', 'selected-meta', ids] as const,
    queryFn: async (): Promise<readonly SelectedDoc[]> => {
      const results = await Promise.all(ids.map((id) => financialRepository.getById(id)))
      return results.flatMap((r) =>
        isOk(r) ? [{ id: r.value.id, status: r.value.status, version: r.value.version }] : [],
      )
    },
    enabled: ids.length > 0,
    staleTime: 15_000,
  })
  return { docs: query.data ?? [], loading: query.isFetching }
}
