/**
 * Mutation de atualização de fornecedor — AGNÓSTICO (puro). Sobre o repository.
 */
import { supplierRepository } from '#modules/partners/client/data/repository/supplier.repository.instance.ts'
import type { SupplierWriteInput } from '#modules/partners/client/data/model/supplier.model.ts'

export const supplierUpdateMutationKey = ['suppliers', 'update'] as const

export const supplierUpdateMutationOptions = {
  mutationKey: supplierUpdateMutationKey,
  mutationFn: (input: SupplierWriteInput & Readonly<{ id: string }>) =>
    supplierRepository.update(input),
}
