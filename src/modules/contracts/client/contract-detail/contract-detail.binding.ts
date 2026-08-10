import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { type Result, isOk } from '#shared/primitives/result.ts'
import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedContractPermissions } from '#modules/contracts/client/data/helpers/can.ts'
import { getBudgetPlanDetailFn, type PlanDetail } from '#modules/budget-plans/public-api/index.ts'
import { contractDetailViewModel, type VigenciaView } from './contract-detail.view-model.ts'

// #502: o contrato guarda `budgetPlanId`/`subcategoryRef` como refs da ÁRVORE do plano (S3), mas o backend não
// devolve o bloco `budgetPlan` nem o nome da subcategoria. Resolvemos ref→nome contra a árvore (como o drawer).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string | null | undefined): v is string => v != null && UUID_RE.test(v)

const planLabelOf = (p: PlanDetail): string =>
  `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
  (p.scenarioName !== null ? ` · ${p.scenarioName}` : '')

/** Nome da subcategoria (folha) varrendo a árvore do plano pelo `ref`. Null se não achar. */
const subcategoriaNameOf = (p: PlanDetail, subRef: string): string | null => {
  for (const cc of p.costCenters) {
    for (const cat of cc.categories) {
      const sub = cat.subCategories.find((s) => s.ref === subRef)
      if (sub !== undefined) return sub.name
    }
  }
  return null
}

export type ContractDetailQueryState = Readonly<{
  data: Result<Contract, ContractsError> | null
  isLoading: boolean
  isError: boolean
  canWrite: boolean
  // Vigência derivada na view-model a partir de um `now` estável (C1): a view não cria relógio.
  vigencia: VigenciaView | null
  // #502: categorização resolvida pela árvore do plano (rótulo do plano + nome da subcategoria). Null = "—".
  planLabel: string | null
  subcategoria: string | null
}>

export const useContractDetailBinding = (id: string): ContractDetailQueryState => {
  const query = useQuery({ ...contractDetailViewModel.query(id) })
  const current = useCurrentUser()
  const granted = grantedContractPermissions(current.user?.permissions)
  // "Agora" estável por carga de página (lazy initializer) — base da barra de vigência, fora do render.
  const [now] = useState(() => new Date())
  const data = query.data ?? null
  const contract = data !== null && isOk(data) ? data.value : null
  const vigencia = contract !== null ? contractDetailViewModel.deriveVigencia(contract, now) : null

  // Árvore do plano carimbado (#502) — cache compartilhado (mesma queryKey do drawer/Fatia 1). Só com UUID válido.
  const budgetPlanId = contract?.budgetPlanId ?? null
  const plan = useQuery({
    queryKey: ['budget-plans', 'detail', 'categorization', budgetPlanId ?? null] as const,
    enabled: isPlanId(budgetPlanId),
    queryFn: async (): Promise<PlanDetail | null> => {
      if (!isPlanId(budgetPlanId)) return null
      const r = await getBudgetPlanDetailFn({ data: { id: budgetPlanId } })
      return r.ok ? r.data : null
    },
    staleTime: 300_000,
  })
  const planData = plan.data ?? null
  const subRef = contract?.subcategoryRef ?? null
  const planLabel = planData !== null ? planLabelOf(planData) : null
  const subcategoria = planData !== null && isPlanId(subRef) ? subcategoriaNameOf(planData, subRef) : null

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    canWrite: can(granted, 'contract:write'),
    vigencia,
    planLabel,
    subcategoria,
  }
}
