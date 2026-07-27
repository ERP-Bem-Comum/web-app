/**
 * Opções dos filtros do "Posição de Pagamentos" — ADAPTER React (§XI). Cada dropdown vira REAL (só a LISTA;
 * APLICAR o filtro depende do core-api#588, ainda não exposto). Cross-módulo SÓ via public-api (§I):
 *   • Plano Orçamentário  → `listBudgetPlansFn`   (#modules/budget-plans, planos APROVADOS)
 *   • Fornecedor          → `listSuppliersFn`     (#modules/partners, ativos)
 *   • Conta bancária      → `listCedenteAccountsFn`(#modules/financial, contas-cedente)
 *   • Centro/Categoria/Subcategoria → `listFinancialReferencesFn` (#modules/financial, catálogo FLAT)
 * Status é ESTÁTICO (i18n dos chips do CAP) e é montado na page. Período de vencimento é intervalo de datas
 * (não-lista) — fica fora. Todas as listas degradam a `[]` (loading/erro/permissão) — o dropdown nunca quebra.
 *
 * As opções aqui são RÓTULOS (string) porque o select ainda não APLICA — quando o #588 subir, cada opção
 * ganha `value` (UUID/uf/etc.). Espelha o estilo de `realizado-filters.binding.ts`.
 */
import { useQuery } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import {
  listCedenteAccountsFn,
  listFinancialReferencesFn,
  type FinancialReferences,
} from '#modules/financial/public-api/index.ts'

/** Listas de opções (rótulos) por dropdown do relatório de Posição. Status/período não entram aqui. */
export type PosicaoFilterOptions = Readonly<{
  plano: readonly string[]
  partner: readonly string[]
  conta: readonly string[]
  centro: readonly string[]
  categoria: readonly string[]
  subcategoria: readonly string[]
}>

const EMPTY: readonly string[] = []

/** Planos APROVADOS → "ano sigla versão · cenário" (mesma regra dos outros dropdowns; evita rascunho homônimo). */
function usePlanoOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'planos'] as const,
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

/** Fornecedores ATIVOS → nome. Uma página basta p/ o seletor (limite máx do endpoint). Erro → []. */
function usePartnerOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'fornecedores'] as const,
    queryFn: async (): Promise<readonly string[]> => {
      const r = await listSuppliersFn({ data: { active: true, order: 'ASC', page: 1, limit: 100 } })
      return r.ok ? r.data.items.map((s) => s.name) : EMPTY
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY
}

/** Contas-cedente → apelido; sem apelido, cai no texto-livre (#206) ou banco+conta-DV. Erro/permissão → []. */
function useContaOptions(): readonly string[] {
  const q = useQuery({
    queryKey: ['reports', 'posicao', 'filter', 'contas'] as const,
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

/**
 * Catálogo de referências (Centro/Categoria/Subcategoria) — FLAT, sem cascata por plano nesta fase. Uma única
 * query cacheada serve os 3 selects (`select` por concern). Categoria = nível de topo (`parentId === null`);
 * Subcategoria = filhas (`parentId !== null`). Erro/permissão → todas as listas caem a [].
 */
const referencesQuery = {
  queryKey: ['reports', 'posicao', 'filter', 'references'] as const,
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
