/**
 * Opções dos filtros do "Posição de Pagamentos" — ADAPTER React (§XI). Cada dropdown vira REAL e agora com
 * VALUE (o UUID/ref que o core-api#588 aplica), não só rótulo. Cross-módulo SÓ via public-api (§I):
 *   • Plano Orçamentário  → `listBudgetPlansFn`   (value = id do plano; planos APROVADOS)
 *   • Fornecedor          → `listSuppliersFn`     (value = id; ativos)
 *   • Conta bancária      → `listCedenteAccountsFn`(value = id; rótulo apelido/texto-livre/banco+conta)
 *   • Centro/Categoria/Subcategoria → `listFinancialReferencesFn` (value = id; catálogo FLAT)
 * Status é ESTÁTICO (enum #588 → i18n) e é montado na page. Período de vencimento são DOIS inputs de data
 * (não-lista) — fica fora. Todas as listas degradam a `[]` (loading/erro/permissão) — o dropdown nunca quebra.
 * Espelha o estilo de `realizado-filters.binding.ts` (FilterOption = { value, label }).
 */
import { useQuery } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import {
  listCedenteAccountsFn,
  listFinancialReferencesFn,
  type FinancialReferences,
} from '#modules/financial/public-api/index.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

/** Listas de opções (value+label) por dropdown do relatório de Posição. Status/período não entram aqui. */
export type PosicaoFilterOptions = Readonly<{
  plano: readonly FilterOption[]
  partner: readonly FilterOption[]
  conta: readonly FilterOption[]
  centro: readonly FilterOption[]
  categoria: readonly FilterOption[]
  subcategoria: readonly FilterOption[]
}>

const EMPTY: readonly FilterOption[] = []

/** Planos APROVADOS → value=id, label "ano sigla versão · cenário" (evita rascunho homônimo). */
function usePlanoOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'planos'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!r.ok) return EMPTY
      return r.data.items
        .filter((p) => p.status === 'APROVADO')
        .map((p) => ({
          value: p.id,
          label:
            `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
            (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
        }))
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/** Fornecedores ATIVOS → value=id, label=nome. Uma página basta p/ o seletor. Erro → []. */
function usePartnerOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'fornecedores'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listSuppliersFn({ data: { active: true, order: 'ASC', page: 1, limit: 100 } })
      return r.ok ? r.data.items.map((s) => ({ value: s.id, label: s.name })) : EMPTY
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/** Contas-cedente → value=id; label apelido → texto-livre (#206) → banco+conta-DV. Erro/permissão → []. */
function useContaOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'contas'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listCedenteAccountsFn()
      if (!r.ok) return EMPTY
      return r.data.map((a) => {
        const label =
          a.alias !== ''
            ? a.alias
            : a.typeLabel !== null && a.typeLabel !== ''
              ? a.typeLabel
              : `${a.bankName} ${a.accountNumber}-${a.accountDv}`
        return { value: a.id, label }
      })
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/**
 * Catálogo de referências (Centro/Categoria/Subcategoria) — FLAT, sem cascata por plano nesta fase. Uma única
 * query cacheada serve os 3 selects (`select` por concern). Categoria = nível de topo (`parentId === null`);
 * Subcategoria = filhas (`parentId !== null`). value=id. Erro/permissão → todas as listas caem a [].
 */
const referencesQuery = {
  queryKey: ['reports', 'posicao', 'filter', 'references'] as const,
  queryFn: async (): Promise<FinancialReferences> => {
    const r = await listFinancialReferencesFn()
    return r.ok ? r.data : { categories: [], costCenters: [] }
  },
  staleTime: 60_000,
}

function useCentroOptions(): readonly FilterOption[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly FilterOption[] => refs.costCenters.map((c) => ({ value: c.id, label: c.name })),
  })
  return q.data ?? EMPTY
}

function useCategoriaOptions(): readonly FilterOption[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly FilterOption[] =>
      refs.categories.filter((c) => c.parentId === null).map((c) => ({ value: c.id, label: c.name })),
  })
  return q.data ?? EMPTY
}

function useSubcategoriaOptions(): readonly FilterOption[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly FilterOption[] =>
      refs.categories.filter((c) => c.parentId !== null).map((c) => ({ value: c.id, label: c.name })),
  })
  return q.data ?? EMPTY
}

/** Agrega as 6 listas data-backed dos filtros de Posição (status/período são resolvidos na page). */
export function usePosicaoFilterOptions(): PosicaoFilterOptions {
  return {
    plano: usePlanoOptions(),
    partner: usePartnerOptions(),
    conta: useContaOptions(),
    centro: useCentroOptions(),
    categoria: useCategoriaOptions(),
    subcategoria: useSubcategoriaOptions(),
  }
}
