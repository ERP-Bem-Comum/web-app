import { describe, it, expect } from 'vitest'
import { ContractListFiltersSchema, ContractCreateInputSchema } from './schemas'
import { ContractClassification, ContractModel, ContractType, ContractStatus } from './types'

describe('ContractListFiltersSchema', () => {
  it('should parse valid filters with defaults', () => {
    const result = ContractListFiltersSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.order).toBe('DESC')
  })

  it('should parse search and status filters', () => {
    const result = ContractListFiltersSchema.parse({
      search: 'obra',
      contractStatus: ContractStatus.PENDING,
      page: 2,
      limit: 25,
    })
    expect(result.search).toBe('obra')
    expect(result.contractStatus).toBe('Pendente')
    expect(result.page).toBe(2)
    expect(result.limit).toBe(25)
  })

  it('should reject invalid page', () => {
    expect(() => ContractListFiltersSchema.parse({ page: 0 })).toThrow()
  })
})

describe('ContractCreateInputSchema', () => {
  it('should parse valid create input', () => {
    const result = ContractCreateInputSchema.parse({
      classification: ContractClassification.CONTRACT,
      contractModel: ContractModel.SERVICE,
      object: 'Prestação de serviços de TI',
      totalValue: 50000,
      contractPeriod: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
      contractType: ContractType.SUPPLIER,
      supplierId: 1,
      budgetPlanId: 2,
    })
    expect(result.object).toBe('Prestação de serviços de TI')
    expect(result.totalValue).toBe(50000)
  })

  it('should reject empty object', () => {
    expect(() =>
      ContractCreateInputSchema.parse({
        classification: ContractClassification.CONTRACT,
        contractModel: ContractModel.SERVICE,
        object: '',
        totalValue: 0,
        contractPeriod: { start: new Date(), end: new Date() },
        contractType: ContractType.SUPPLIER,
      }),
    ).toThrow()
  })
})
