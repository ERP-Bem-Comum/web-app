/**
 * Mutation options da criação de fornecedor — AGNÓSTICO (puro). Sobre o repository.
 */
import { supplierRepository } from '#modules/partners/client/data/repository/supplier.repository.instance.ts'
import type { SupplierWriteInput } from '#modules/partners/client/data/model/supplier.model.ts'

export const supplierCreateMutationKey = ['suppliers', 'create'] as const

export const supplierCreateMutationOptions = {
  mutationKey: supplierCreateMutationKey,
  mutationFn: (input: SupplierWriteInput) => supplierRepository.create(input),
}
