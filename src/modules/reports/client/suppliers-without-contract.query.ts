/**
 * suppliersWithoutContractQueryOptions — data AGNÓSTICA de "Fornecedores sem Contrato" (#114; sem React). A
 * queryFn devolve o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. Sem input
 * (o BFF agrega por fornecedor). Espelha `posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { SupplierWithoutContract } from '#modules/reports/client/data/model/supplier-without-contract.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'
import type { SuppliersWithoutContractFilter } from './data/model/supplier-without-contract.model.ts'

export type SuppliersWithoutContractResult = Readonly<{
  data: readonly SupplierWithoutContract[] | null
  error: ReportsError | null
}>

/** Namespace da queryKey; o FILTRO aplicado entra como 2º segmento → filtrar troca a chave e re-busca. */
export const suppliersWithoutContractQueryKey = ['reports', 'suppliers-without-contract'] as const

export const suppliersWithoutContractQueryOptions = (filter: SuppliersWithoutContractFilter = {}) => ({
  queryKey: [...suppliersWithoutContractQueryKey, filter] as const,
  queryFn: async (): Promise<SuppliersWithoutContractResult> => {
    const res = await reportsRepository.getSuppliersWithoutContract(filter)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
