/**
 * Binding de opções de PARCEIRO para o picker do hero (Lançar Documento) — ADAPTER React. Agrega os 4 tipos
 * cadastrados (Fornecedor/Financiador/Ato/Colaborador) reusando as list-fns do módulo Parceiros (cross-módulo
 * SÓ via public-api — §I). Mapeia para `PartnerOption` {id, name, subtitle, kind}; erro/loading → lista vazia.
 *
 * O documento guarda só o id em `supplierRef` (UUID); o front resolve nome/documento client-side (espelha
 * partners-map do grid). ACT exibe razão social + CNPJ (o CNPJ só vem no ActDetail → busca o detalhe, são
 * poucos Atos). Colaborador é PF: subtítulo = e-mail (o ListItem não traz CPF; só o Detail — evita N fetches).
 */
import { useQuery } from '@tanstack/react-query'

import {
  listSuppliersFn,
  listFinanciersFn,
  listActsFn,
  getActFn,
} from '#modules/partners/public-api/index.ts'

import { listAllActiveCollaborators } from '#modules/financial/client/shared/list-all-collaborators.binding.ts'

import type { PartnerOption } from './document-form.view.ts'

const PAGE = { active: true, limit: 100 } as const

const partnersOptionsQueryOptions = {
  queryKey: ['financial', 'partners-options'] as const,
  queryFn: async (): Promise<readonly PartnerOption[]> => {
    const [suppliers, financiers, acts, collaborators] = await Promise.all([
      listSuppliersFn({ data: PAGE }),
      listFinanciersFn({ data: PAGE }),
      listActsFn({ data: PAGE }),
      listAllActiveCollaborators(),
    ])
    const options: PartnerOption[] = []
    if (suppliers.ok) {
      for (const s of suppliers.data.items) {
        options.push({ id: s.id, name: s.name, subtitle: s.cnpj, kind: 'supplier' })
      }
    }
    if (financiers.ok) {
      for (const f of financiers.data.items) {
        options.push({ id: f.id, name: f.name, subtitle: f.cnpj, kind: 'financier' })
      }
    }
    if (acts.ok) {
      // ACT exibe RAZÃO SOCIAL (corporateName) + CNPJ. O CNPJ só vem no ActDetail → busca os detalhes
      // (são poucos Atos), igual ao partners-map do grid.
      const details = await Promise.all(acts.data.items.map((a) => getActFn({ data: { id: a.id } })))
      for (const d of details) {
        if (d.ok)
          options.push({ id: d.data.id, name: d.data.corporateName, subtitle: d.data.cnpj, kind: 'act' })
      }
    }
    for (const c of collaborators) {
      options.push({ id: c.id, name: c.name, subtitle: c.email, kind: 'collaborator' })
    }
    return options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
}

export function usePartnersOptions(): readonly PartnerOption[] {
  const query = useQuery(partnersOptionsQueryOptions)
  return query.data ?? []
}
