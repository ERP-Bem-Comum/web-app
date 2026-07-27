/**
 * Opções dos filtros da "Análise de Pagamentos" — ADAPTER React (§XI). Popula os dropdowns com dados REAIS
 * (só a LISTA). ⚠️ O endpoint #446 só aceita período + status → estes filtros são VISUAIS por ora (não aplicam);
 * populá-los evita a tela mostrar só "Todos". Cross-módulo SÓ via public-api (§I):
 *   • Programa      → `listProgramsFn`          (#modules/programs, ATIVO)
 *   • Plano Orç.    → `listBudgetPlansFn`        (#modules/budget-plans, APROVADO)
 *   • Conta banc.   → `listCedenteAccountsFn`    (#modules/financial)
 *   • Centro/Categoria/Subcategoria → `listFinancialReferencesFn` (#modules/financial, catálogo FLAT)
 * Status é ESTÁTICO (montado na page) e Período é intervalo (fora daqui). Tudo degrada a `[]` (loading/erro/
 * permissão) — o dropdown nunca quebra. Opções são RÓTULOS (string): como não aplicam, não precisam de `value`.
 * Espelha `posicao-filters.binding.ts`.
 */
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import {
  listCedenteAccountsFn,
  listFinancialReferencesFn,
  type FinancialReferences,
} from '#modules/financial/public-api/index.ts'

/** Listas de opções (rótulos) por dropdown da Análise. Status/período não entram aqui. */
export type AnaliseFilterOptions = Readonly<{
  programa: readonly string[]
  plano: readonly string[]
  conta: readonly string[]
  centro: readonly string[]
  categoria: readonly string[]
  subcategoria: readonly string[]
}>

const EMPTY: readonly string[] = []

/** Programas ATIVOS → sigla (ou nome quando sem sigla). */
function useProgramaOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'analise', 'filter', 'programas'] as const,
    queryFn: async (): Promise<readonly string[]> => {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page: 1, limit: 25 } })
      return r.ok ? r.data.items.map((p) => (p.sigla === '' ? p.name : p.sigla)) : EMPTY
    },
    staleTime: 300_000,
  })
  return q.data ?? EMPTY
}

/** Planos APROVADOS → "ano sigla versão · cenário" (mesma regra dos outros dropdowns de relatório). */
function usePlanoOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'analise', 'filter', 'planos'] as const,
    queryFn: async (): Promise<readonly string[]> => {
      const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!r.ok) return EMPTY
      return r.data.items
        .filter((p) => p.status === 'APROVADO')
        .map(
          (p) =>
            `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
            (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
        )
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/** Contas-cedente → apelido; sem apelido, texto-livre (#206) ou banco+conta-DV. Erro/permissão → []. */
function useContaOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'analise', 'filter', 'contas'] as const,
    queryFn: async (): Promise<readonly string[]> => {
      const r = await listCedenteAccountsFn()
      if (!r.ok) return EMPTY
      return r.data.map((a) => {
        if (a.alias !== '') return a.alias
        if (a.typeLabel !== null && a.typeLabel !== '') return a.typeLabel
        return `${a.bankName} ${a.accountNumber}-${a.accountDv}`
      })
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/** Catálogo de referências (Centro/Categoria/Subcategoria) — FLAT. Uma query cacheada serve os 3 selects. */
const referencesQuery = {
  queryKey: ['reports', 'analise', 'filter', 'references'] as const,
  queryFn: async (): Promise<FinancialReferences> => {
    const r = await listFinancialReferencesFn()
    return r.ok ? r.data : { categories: [], costCenters: [] }
  },
  staleTime: 60_000,
}

function useCentroOptions(): readonly string[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly string[] => refs.costCenters.map((c) => c.name),
  })
  return q.data ?? EMPTY
}

function useCategoriaOptions(): readonly string[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly string[] =>
      refs.categories.filter((c) => c.parentId === null).map((c) => c.name),
  })
  return q.data ?? EMPTY
}

function useSubcategoriaOptions(): readonly string[] {
  const q = useQuery({
    ...referencesQuery,
    select: (refs): readonly string[] =>
      refs.categories.filter((c) => c.parentId !== null).map((c) => c.name),
  })
  return q.data ?? EMPTY
}

/** Agrega as 6 listas data-backed dos filtros da Análise (status/período são resolvidos na page). */
export function useAnaliseFilterOptions(): AnaliseFilterOptions {
  return {
    programa: useProgramaOptions(),
    plano: usePlanoOptions(),
    conta: useContaOptions(),
    centro: useCentroOptions(),
    categoria: useCategoriaOptions(),
    subcategoria: useSubcategoriaOptions(),
  }
}
