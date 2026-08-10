/**
 * Binding de opções de PLANO ORÇAMENTÁRIO para a Categorização do Lançar Documento — ADAPTER React. Lista os
 * planos via `GET /budget-plans` (cross-módulo SÓ via public-api de budget-plans — §I) p/ o dropdown de Plano
 * Orçamentário. `value` = id (UUID); `label` = "ano sigla versão". Hoje vem vazio (core-api#374: driver memory
 * + sem dado); acende sem retrabalho quando o backend subir. Erro/loading/sem-permissão → lista vazia.
 */
import { useQuery } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'

export type PlanoOption = Readonly<{ value: string; label: string }>

export function usePlanoOrcamentarioOptions(): readonly PlanoOption[] {
  const query = useQuery({
    queryKey: ['budget-plans', 'options', 'lancar-documento'],
    queryFn: async (): Promise<readonly PlanoOption[]> => {
      const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!r.ok) return []
      return (
        r.data.items
          // Só APROVADOS (decisão da P.O.): a categorização usa a estrutura COMPROMETIDA do plano, não um
          // rascunho em edição. Também remove o ruído — o catálogo tem vários rascunhos duplicados de teste
          // "2026 ABC 1.0" que colidem no rótulo e fariam a usuária escolher uma árvore vazia sem querer.
          .filter((p) => p.status === 'APROVADO')
          .map((p) => ({
            value: p.id,
            // Cenário no rótulo p/ distinguir planos homônimos (dois aprovados do mesmo ano/programa/versão
            // só diferem pelo cenário). Sem cenário → rótulo base.
            label:
              `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
              (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
          }))
      )
    },
    staleTime: 60_000,
  })
  return query.data ?? []
}
