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
 * Listas da Análise. Plano carrega `value=id` (dirige a cascata E o recorte client-side); `planoPrograma`
 * mapeia id-do-plano → rótulo do programa, que é o que torna o filtro de **Programa** aplicável sem backend:
 * a page traduz "Programa X" na lista de planos daquele programa e recorta a resposta do #446 por ela.
 * Centro/Categoria/Subcategoria NÃO estão aqui — vêm da CASCATA da árvore do plano (hooks do financial na page).
 */
export type AnaliseFilterOptions = Readonly<{
  programa: readonly string[]
  plano: readonly FilterOption[]
  /** id do plano → rótulo do programa (mesma derivação `sigla ?? nome` das opções de Programa). */
  planoPrograma: ReadonlyMap<string, string>
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

/** Rótulo do programa de um plano — MESMA derivação das opções de Programa (`sigla` vazia/ausente → nome). */
function programaLabelOf(
  plan: Readonly<{ programAbbreviation: string | null; programName: string }>,
): string {
  const abbr = plan.programAbbreviation
  return abbr === null || abbr === '' ? plan.programName : abbr
}

type PlanoLists = Readonly<{
  options: readonly FilterOption[]
  programByPlan: ReadonlyMap<string, string>
}>
const EMPTY_PLANOS: PlanoLists = { options: EMPTY_OPT, programByPlan: new Map() }

/**
 * Planos APROVADOS → value=id, label "ano sigla versão · cenário" (dirige a cascata e o recorte por Plano).
 *
 * O MAPA programa-por-plano percorre também os `children` (cenários/versões-filhas), que NÃO entram nas opções:
 * um título pode estar carimbado com o ref de um plano-filho, e se ele ficasse fora do mapa o filtro de Programa
 * o descartaria como "plano de programa desconhecido" — sumindo dinheiro da tela em vez de filtrá-lo.
 */
function usePlanoLists(): PlanoLists {
  const q = useQuery({
    queryKey: ['reports', 'analise', 'filter', 'planos'] as const,
    queryFn: async (): Promise<PlanoLists> => {
      const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
      if (!r.ok) return EMPTY_PLANOS

      const programByPlan = new Map<string, string>()
      const walk = (nodes: readonly (typeof r.data.items)[number][]): void => {
        for (const n of nodes) {
          programByPlan.set(n.id, programaLabelOf(n))
          walk(n.children)
        }
      }
      walk(r.data.items)

      const options = r.data.items
        .filter((p) => p.status === 'APROVADO')
        .map((p) => ({
          value: p.id,
          label:
            `${String(p.year)} ${programaLabelOf(p)} ${p.version.toFixed(1)}` +
            (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
        }))
      return { options, programByPlan }
    },
    staleTime: 60_000,
  })
  return q.data ?? EMPTY_PLANOS
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
  const planos = usePlanoLists()
  return {
    programa: useProgramaOptions(),
    plano: planos.options,
    planoPrograma: planos.programByPlan,
    conta: useContaOptions(),
  }
}
