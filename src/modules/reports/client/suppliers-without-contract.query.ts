/**
 * suppliersWithoutContractQueryOptions — data AGNÓSTICA de "Fornecedores sem Contrato" (#114; sem React). A
 * queryFn devolve o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. Sem input
 * (o BFF agrega por fornecedor). Espelha `posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { SupplierWithoutContract } from '#modules/reports/client/data/model/supplier-without-contract.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type SuppliersWithoutContractResult = Readonly<{
  data: readonly SupplierWithoutContract[] | null
  error: ReportsError | null
}>

export const suppliersWithoutContractQueryKey = ['reports', 'suppliers-without-contract'] as const

export const suppliersWithoutContractQueryOptions = () => ({
  queryKey: suppliersWithoutContractQueryKey,
  queryFn: async (): Promise<SuppliersWithoutContractResult> => {
    const res = await reportsRepository.getSuppliersWithoutContract()
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
