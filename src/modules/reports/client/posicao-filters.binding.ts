/**
 * Opções dos filtros do "Posição de Pagamentos" — ADAPTER React (§XI). Cada dropdown vira REAL e com VALUE (o
 * UUID/ref que o core-api#588 aplica). Cross-módulo SÓ via public-api (§I):
 *   • Plano Orçamentário  → `listBudgetPlansFn`   (value = id do plano; planos APROVADOS)
 *   • Fornecedor          → `listSuppliersFn`     (value = id; ativos)
 *   • Conta bancária      → `listCedenteAccountsFn`(value = id; rótulo apelido/texto-livre/banco+conta)
 *   • Centro/Categoria/Subcategoria → CASCATA da ÁRVORE do PLANO selecionado (`use*OptionsFromPlan`, ADR-0051):
 *     a categorização real vive na árvore do plano, não no catálogo operacional flat. Com plano (UUID) as
 *     opções (e seus `value`) vêm do plano → o apply CASA com os títulos; sem plano caem no operacional.
 * Status é ESTÁTICO (enum #588 → i18n) e é montado na page. Período de vencimento são DOIS inputs de data.
 * Todas as listas degradam a `[]` (loading/erro/permissão) — o dropdown nunca quebra.
 */
import { useQuery } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import {
  listCedenteAccountsFn,
  useCostCenterOptionsFromPlan,
  useCategoryOptionsFromPlan,
  useSubcategoryOptionsFromPlan,
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
 * Agrega as 6 listas dos filtros de Posição (status/período são resolvidos na page). Centro/Categoria/
 * Subcategoria vêm da CASCATA da árvore do plano selecionado (`planoRef` → `costCenterRef` → `categoryRef`):
 * trocar o plano recarrega os 3; trocar o centro recarrega a categoria; etc. Sem plano (UUID) caem no
 * catálogo operacional (os hooks já fazem). `CategoryOption` é estruturalmente igual a `FilterOption`.
 */
const PLAN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function usePosicaoFilterOptions(
  planoRef: string,
  costCenterRef: string,
  categoryRef: string,
  // `planScopedOnly` (Relatório Geral): SEM plano selecionado, Centro/Categoria/Subcategoria ficam VAZIOS
  // em vez de cair no catálogo operacional flat (que não faz parte da cascata da taxonomia — ADR-0051).
  // Default `false` preserva a Posição de Pagamentos (mantém o fallback operacional).
  planScopedOnly = false,
): PosicaoFilterOptions {
  const centro = useCostCenterOptionsFromPlan(planoRef)
  const categoria = useCategoryOptionsFromPlan(planoRef, costCenterRef)
  const subcategoria = useSubcategoryOptionsFromPlan(planoRef, categoryRef)
  // Gate só quando pedido E sem plano válido (hooks chamados sempre — ordem estável, §XI).
  const gate = planScopedOnly && !PLAN_UUID_RE.test(planoRef)
  return {
    plano: usePlanoOptions(),
    partner: usePartnerOptions(),
    conta: useContaOptions(),
    centro: gate ? EMPTY : centro,
    categoria: gate ? EMPTY : categoria,
    subcategoria: gate ? EMPTY : subcategoria,
  }
}
