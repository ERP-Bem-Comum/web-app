/**
 * Binding de opções de PARCEIRO para o picker do hero (Lançar Documento) — ADAPTER React. Agrega os tipos
 * cadastrados (Fornecedor/Financiador/Ato) reusando as list-fns do módulo Parceiros (cross-módulo SÓ via
 * public-api — §I). Mapeia para `PartnerOption` {id, name, cnpj, kind}; erro/loading → lista vazia.
 *
 * Colaborador fica de fora (a public-api de Parceiros não expõe list-fn de colaborador). ⚠️ O documento
 * guarda o id em `supplierRef`, que hoje o core-api só aceita p/ Fornecedor — ver issue de backend.
 */
import { useQuery } from '@tanstack/react-query'

import { listSuppliersFn, listFinanciersFn, listActsFn } from '#modules/partners/public-api/index.ts'

import type { PartnerOption } from './document-form.view.ts'

const PAGE = { active: true, limit: 100 } as const

const partnersOptionsQueryOptions = {
  queryKey: ['financial', 'partners-options'] as const,
  queryFn: async (): Promise<readonly PartnerOption[]> => {
    const [suppliers, financiers, acts] = await Promise.all([
      listSuppliersFn({ data: PAGE }),
      listFinanciersFn({ data: PAGE }),
      listActsFn({ data: PAGE }),
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
      for (const a of acts.data.items) {
        options.push({ id: a.id, name: a.name, subtitle: a.actNumber, kind: 'act' })
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
}

export function usePartnersOptions(): readonly PartnerOption[] {
  const query = useQuery(partnersOptionsQueryOptions)
  return query.data ?? []
}
