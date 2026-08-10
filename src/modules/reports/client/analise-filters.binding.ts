/**
 * Opções dos filtros da "Análise de Pagamentos" — ADAPTER React (§XI). Popula os dropdowns com dados REAIS.
 * ⚠️ O endpoint #446 só aceita período + status → estes filtros são VISUAIS (não aplicam). Cross-módulo SÓ via
 * public-api (§I):
 *   • Programa   → `listProgramsFn`       (#modules/programs, ATIVO) — RÓTULO (não dirige nada)
 *   • Conta banc.→ `listCedenteAccountsFn`(#modules/financial)       — RÓTULO
 *   • Plano Orç. → `listBudgetPlansFn`     (#modules/budget-plans, APROVADO) — {value,label}: o `value=id`
 *     DIRIGE a cascata de Centro/Categoria/Subcategoria (que vem da árvore do plano, ver `analise-pagamentos.page`).
 * Status é ESTÁTICO (montado na page) e Período é intervalo (fora daqui). Tudo degrada a `[]` (loading/erro/
 * permissão) — o dropdown nunca quebra.
 */
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listCedenteAccountsFn } from '#modules/financial/public-api/index.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

/**
 * Listas populate-only da Análise: Programa/Conta são rótulos; Plano carrega `value=id` (dirige a cascata).
 * Centro/Categoria/Subcategoria NÃO estão aqui — vêm da CASCATA da árvore do plano (hooks do financial na page).
 */
export type AnaliseFilterOptions = Readonly<{
  programa: readonly string[]
  plano: readonly FilterOption[]
  conta: readonly string[]
}>

const EMPTY: readonly string[] = []
const EMPTY_OPT: readonly FilterOption[] = []

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

/** Planos APROVADOS → value=id, label "ano sigla versão · cenário". O `value` dirige a cascata do plano. */
function usePlanoOptions(): readonly FilterOption[] {
  const q = useQuery({
    queryKey: ['reports', 'analise', 'filter', 'planos'] as const,
    queryFn: async (): Promise<readonly FilterOption[]> => {
      const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!r.ok) return EMPTY_OPT
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
  return q.data ?? EMPTY_OPT
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

/**
 * Agrega as listas populate-only da Análise (Programa/Plano/Conta). Centro/Categoria/Subcategoria NÃO vêm daqui
 * — são a CASCATA da árvore do plano (hooks do financial dirigidos na page). Status/período resolvem na page.
 */
export function useAnaliseFilterOptions(): AnaliseFilterOptions {
  return {
    programa: useProgramaOptions(),
    plano: usePlanoOptions(),
    conta: useContaOptions(),
  }
}
