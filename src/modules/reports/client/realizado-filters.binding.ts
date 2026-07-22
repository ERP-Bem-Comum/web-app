/**
 * Opções dos filtros do "Realizado × Planejado" — ADAPTERS React (§XI). Cada dropdown do relatório vira REAL:
 * Programa (`listProgramsFn`), Plano (`listBudgetPlansFn`), Estado (`listPartnerStatesFn`), Município
 * (`listMunicipalitiesByUfFn`) e Ano (derivado dos planos). Cross-módulo só via public-api (§I). Degradação
 * graciosa: erro/sem permissão → lista vazia (o filtro fica sem opções, mas o relatório não trava).
 *
 * IDs que o endpoint `/reports/realized` espera: Programa=UUID, Plano=UUID, Estado=**uf**, Município=**ibgeCode**
 * (o geography identifica estado por `uf` e município por `ibgeCode`). Ano = number.
 */
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listPartnerStatesFn, listMunicipalitiesByUfFn } from '#modules/partners/public-api/index.ts'

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

/** Estados COM parceria (o relatório filtra pela localização do parceiro) → value = `uf`. Erro → []. */
export function useEstadoOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'realized', 'filter', 'estados'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listPartnerStatesFn()
      return r.ok ? r.data.filter((s) => s.isPartner).map((s) => ({ value: s.uf, label: s.uf })) : []
    },
    staleTime: 300_000,
  })
  return q.data ?? []
}

/** Municípios da UF escolhida → value = `ibgeCode`, label = nome. Sem UF → não busca (cai em []). */
export function useMunicipioOptions(uf: string): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'realized', 'filter', 'municipios', uf] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listMunicipalitiesByUfFn({ data: { uf } })
      return r.ok ? r.data.map((m) => ({ value: m.ibgeCode, label: m.name })) : []
    },
    enabled: uf !== '',
    staleTime: 300_000,
  })
  return q.data ?? []
}
