import { describe, it, expect } from 'vitest'
import { ContractCreateInputSchema, AditiveCreateInputSchema } from '@/features/contracts/domain/schemas'
import { ContractClassification, ContractModel, ContractType, ContractStatus } from '@/features/contracts/domain/types'

const validBase = {
  classification: ContractClassification.SERVICE_ORDER,
  contractModel: ContractModel.SERVICE,
  object: 'Serviços de consultoria',
  totalValue: 5000,
  contractPeriod: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
  contractType: ContractType.SUPPLIER,
  supplierId: 1,
  bancaryInfo: { bank: '001', agency: '0001', accountNumber: '12345', dv: '0' },
  pixInfo: { key_type: 'CNPJ', key: '12.345.678/0001-90' },
}

describe('ContractCreateInputSchema', () => {
  it('deve aceitar uma OS com valor dentro do teto (<= 9999.99)', () => {
    const result = ContractCreateInputSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar uma OS com valor acima do teto (> 9999.99)', () => {
    const result = ContractCreateInputSchema.safeParse({
      ...validBase,
      totalValue: 15000,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('totalValue'))
      expect(issue?.message).toContain('9.999,99')
    }
  })

  it('deve aceitar Contrato com valor acima do teto de OS', () => {
    const result = ContractCreateInputSchema.safeParse({
      ...validBase,
      classification: ContractClassification.CONTRACT,
      totalValue: 50000,
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar SUPPLIER sem dados bancários nem PIX', () => {
    const result = ContractCreateInputSchema.safeParse({
      ...validBase,
      bancaryInfo: { bank: null, agency: null, accountNumber: null, dv: null },
      pixInfo: { key_type: null, key: null },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('bancaryInfo'))
      expect(issue?.message).toContain('PIX')
    }
  })

  it('deve aceitar FINANCIER sem dados bancários', () => {
    const result = ContractCreateInputSchema.safeParse({
      ...validBase,
      contractType: ContractType.FINANCIER,
      financierId: 1,
      supplierId: null,
      bancaryInfo: { bank: null, agency: null, accountNumber: null, dv: null },
      pixInfo: { key_type: null, key: null },
    })
    expect(result.success).toBe(true)
  })
})

describe('AditiveCreateInputSchema', () => {
  const validAditive = {
    parentId: 1,
    aditivoType: 'escopo' as const,
    object: 'Ajuste de plano de trabalho',
  }

  it('deve aceitar aditivo de escopo válido', () => {
    const result = AditiveCreateInputSchema.safeParse(validAditive)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar aditivo de valor sem totalValue', () => {
    const result = AditiveCreateInputSchema.safeParse({
      ...validAditive,
      aditivoType: 'valor',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('totalValue'))
      expect(issue?.message).toContain('Valor é obrigatório')
    }
  })

  it('deve aceitar aditivo de valor com totalValue', () => {
    const result = AditiveCreateInputSchema.safeParse({
      ...validAditive,
      aditivoType: 'valor',
      totalValue: 5000,
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar aditivo de prazo sem contractPeriod.end', () => {
    const result = AditiveCreateInputSchema.safeParse({
      ...validAditive,
      aditivoType: 'prazo',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('end'))
      expect(issue?.message).toContain('Nova data fim')
    }
  })

  it('deve aceitar aditivo de prazo com contractPeriod.end', () => {
    const result = AditiveCreateInputSchema.safeParse({
      ...validAditive,
      aditivoType: 'prazo',
      contractPeriod: { end: new Date('2026-12-31') },
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar aditivo sem object (resumo)', () => {
    const result = AditiveCreateInputSchema.safeParse({
      ...validAditive,
      object: '',
    })
    expect(result.success).toBe(false)
  })
})
