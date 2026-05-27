import { describe, it, expect } from 'vitest'
import {
  ContractId,
  ContractCode,
  Money,
  ContractClassification,
  ContractType,
  ContractStatus,
  ContractModel,
} from './types'

describe('ContractId branded type', () => {
  it('should create a ContractId from a number', () => {
    const id = ContractId(42)
    expect(id).toBe(42)
    expect(typeof id).toBe('number')
  })
})

describe('Contract enums', () => {
  it('ContractClassification should have correct values', () => {
    expect(ContractClassification.CONTRACT).toBe('Contrato')
    expect(ContractClassification.SERVICE_ORDER).toBe('Ordem de Serviço')
  })

  it('ContractType should have correct values', () => {
    expect(ContractType.SUPPLIER).toBe('Fornecedor')
    expect(ContractType.FINANCIER).toBe('Financiador')
    expect(ContractType.COLLABORATOR).toBe('Colaborador')
    expect(ContractType.ACT).toBe('ACT')
  })

  it('ContractStatus should have correct values', () => {
    expect(ContractStatus.PENDING).toBe('Pendente')
    expect(ContractStatus.SIGNED).toBe('Assinado')
    expect(ContractStatus.ONGOING).toBe('Em andamento')
    expect(ContractStatus.FINISHED).toBe('Finalizado')
    expect(ContractStatus.DISTRATO).toBe('Distrato')
  })

  it('ContractModel should have correct values', () => {
    expect(ContractModel.SERVICE).toBe('Serviço')
    expect(ContractModel.DONATION).toBe('Doação')
  })
})
