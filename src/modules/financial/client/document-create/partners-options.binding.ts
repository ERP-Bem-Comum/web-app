/**
 * Binding de opções de PARCEIRO para o picker do hero (Lançar Documento) — ADAPTER React. Usa o agregador
 * `listAllPartnersFn` (cross-módulo SÓ via public-api — §I): UMA chamada traz os 4 tipos
 * (Fornecedor/Financiador/Ato/Colaborador) com `document` já resolvido (CNPJ p/ PJ, CPF p/ colaborador PF).
 * Mapeia para `PartnerOption` {id, name, subtitle: document, kind}; só ativos; erro/loading → lista vazia.
 *
 * O documento guarda só o id em `supplierRef` (UUID); o front resolve nome/documento client-side (mesma
 * fonte do grid e do combobox de Contratos).
 */
import { useQuery } from '@tanstack/react-query'

import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'

import type { PartnerOption } from './document-form.view.ts'

const partnersOptionsQueryOptions = {
  queryKey: ['financial', 'partners-options'] as const,
  queryFn: async (): Promise<readonly PartnerOption[]> => {
    const r = await listAllPartnersFn()
    if (!r.ok) return []
    return r.data
      .filter((p) => p.active)
      .map((p) => ({ id: p.id, name: p.name, subtitle: p.document, kind: p.kind }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
}

export function usePartnersOptions(): readonly PartnerOption[] {
  const query = useQuery(partnersOptionsQueryOptions)
  return query.data ?? []
}
