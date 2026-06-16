/**
 * Binding de opções de fornecedor para o select do Lançar Documento — ADAPTER React. Reusa
 * `listSuppliersFn` do módulo Parceiros (cross-módulo SÓ via public-api — §I). Mapeia para {id, name};
 * erro/loading → lista vazia (o select fica só com "Selecione…").
 */
import { useQuery } from '@tanstack/react-query'

import { listSuppliersFn } from '#modules/partners/public-api/index.ts'

import type { SupplierOption } from './document-form.view.ts'

const suppliersOptionsQueryOptions = {
  queryKey: ['financial', 'suppliers-options'] as const,
  queryFn: async (): Promise<readonly SupplierOption[]> => {
    const res = await listSuppliersFn({ data: { active: true, limit: 100 } })
    return res.ok ? res.data.items.map((s) => ({ id: s.id, name: s.name })) : []
  },
}

export function useSuppliersOptions(): readonly SupplierOption[] {
  const query = useQuery(suppliersOptionsQueryOptions)
  return query.data ?? []
}
