/**
 * Opções dos filtros do "Realizado × Planejado" — ADAPTERS React (§XI). Cada dropdown do relatório vira REAL:
 * Programa (`listProgramsFn`), Plano + Ano (`listBudgetPlansFn`) e **Estado/Município da REDE dos planos do
 * Programa** — não da geografia de parceiros: a Rede (`PlanDetail.networks`) é o que está CADASTRADO nos planos
 * daquele programa (paridade com o legado). Cross-módulo só via public-api (§I). Degradação graciosa → [].
 *
 * IDs que o endpoint `/reports/realized` espera: Programa=UUID, Plano=UUID, Estado=**uf**, Município=**ibgeCode**
 * (a Rede identifica estado por `uf` e município por `ref`=ibge). Ano = number.
 */
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { listBudgetPlansFn, getBudgetPlanDetailFn } from '#modules/budget-plans/public-api/index.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

/** Programas ATIVOS → "SIGLA". Uma página basta (o seletor não precisa de todos). Erro → []. */
export function useProgramaOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'realized', 'filter', 'programas'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page: 1, limit: 25 } })
      return r.ok ? r.data.items.map((p) => ({ value: p.id, label: p.sigla === '' ? p.name : p.sigla })) : []
    },
    staleTime: 300_000,
  })
  return q.data ?? []
}

/** Query dos planos — COMPARTILHADA por Plano e Ano (mesma queryKey → um fetch cacheado serve os dois). */
const budgetPlansQuery = {
  queryKey: ['reports', 'realized', 'filter', 'planos'] as const,
  queryFn: async () => {
    const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
    return r.ok ? r.data.items : []
  },
  staleTime: 300_000,
}

/** Planos APROVADOS → "ano sigla versão · cenário" (mesma regra dos outros dropdowns; evita rascunho homônimo). */
export function usePlanoOptions(): readonly FilterOption[] {
  const q = useQuery({
    ...budgetPlansQuery,
    select: (items): readonly FilterOption[] =>
      items
        .filter((p) => p.status === 'APROVADO')
        .map((p) => ({
          value: p.id,
          label:
            `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
            (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
        })),
  })
  return q.data ?? []
}

/** Anos com plano (únicos, DESC) — o `year` é obrigatório no endpoint. Vazio → o default da page cobre. */
export function useAnoOptions(): readonly number[] {
  const q = useQuery({
    ...budgetPlansQuery,
    select: (items): readonly number[] => [...new Set(items.map((p) => p.year))].sort((a, b) => b - a),
  })
  return q.data ?? []
}

// ── Estado/Município da REDE dos planos do Programa ──────────────────────────────
// A Rede (`PlanDetail.networks`) mora no DETALHE do plano; a lista só traz `programAbbreviation`+`children`
// (versões). Então: filtra os planos APROVADOS do programa (pela sigla — a lista não expõe o UUID do programa),
// busca o detalhe de cada um e agrega os `networks`. Estado = `uf` únicos; Município = `kind:'municipality'`
// agrupados por `uf` (a UF entra na cascata). Fan-out de N detalhes (poucos planos/programa), cacheado.

export type NetworkOptions = Readonly<{
  estados: readonly FilterOption[]
  municipiosByUf: Readonly<Record<string, readonly FilterOption[]>>
}>

const EMPTY_NETWORK: NetworkOptions = { estados: [], municipiosByUf: {} }

/** Achata raiz + versões-filhas (a Rede pode variar por versão → união). */
const flattenPlans = <T extends { readonly children: readonly T[] }>(nodes: readonly T[]): readonly T[] =>
  nodes.flatMap((n) => [n, ...flattenPlans(n.children)])

/**
 * Estado/Município cadastrados na Rede dos planos aprovados do PROGRAMA (por sigla). Vazio sem programa.
 * O município carrega a `uf` via `municipiosByUf` p/ a page cascatear pelo Estado escolhido.
 */
export function useNetworkOptions(programaSigla: string): NetworkOptions {
  const q = useQuery({
    queryKey: ['reports', 'realized', 'filter', 'networks', programaSigla] as const,
    enabled: programaSigla !== '',
    queryFn: async (): Promise<NetworkOptions> => {
      const list = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!list.ok) return EMPTY_NETWORK
      const plans = flattenPlans(list.data.items).filter(
        (p) =>
          p.status === 'APROVADO' &&
          (p.programAbbreviation === programaSigla || p.programName === programaSigla),
      )
      const details = await Promise.all(plans.map((p) => getBudgetPlanDetailFn({ data: { id: p.id } })))
      const networks = details.flatMap((r) => (r.ok ? r.data.networks : []))

      const ufs = new Set<string>()
      const munByUf = new Map<string, Map<string, string>>() // uf → (ibge → nome)
      for (const n of networks) {
        if (n.uf !== '') ufs.add(n.uf)
        if (n.kind === 'municipality') {
          const m = munByUf.get(n.uf) ?? new Map<string, string>()
          m.set(n.ref, n.name)
          munByUf.set(n.uf, m)
        }
      }
      const estados = [...ufs].sort().map((uf) => ({ value: uf, label: uf }))
      const municipiosByUf: Record<string, readonly FilterOption[]> = {}
      for (const [uf, m] of munByUf) {
        municipiosByUf[uf] = [...m]
          .map(([ref, name]) => ({ value: ref, label: name }))
          .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
      }
      return { estados, municipiosByUf }
    },
    staleTime: 300_000,
  })
  return q.data ?? EMPTY_NETWORK
}
