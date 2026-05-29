import { describe, it, expect } from 'vitest'
import {
  ContractId,
  ContractCode,
  Money,
  ContractClassification,
  ContractType,
  ContractStatus,
  ContractModel,
  mapBackendStatus,
} from './types'

describe('ContractId branded type', () => {
  it('should create a ContractId from a string UUID', () => {
    const id = ContractId('550e8400-e29b-41d4-a716-446655440000')
    expect(id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(typeof id).toBe('string')
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
    expect(ContractStatus.ACTIVE).toBe('Vigente')
    expect(ContractStatus.EXPIRED).toBe('Encerrado')
    expect(ContractStatus.TERMINATED).toBe('Distrato')
  })

  it('ContractModel should have correct values', () => {
    expect(ContractModel.SERVICE).toBe('Serviço')
    expect(ContractModel.DONATION).toBe('Doação')
  })
})

describe('mapBackendStatus', () => {
  it('maps backend statuses to frontend ContractStatus', () => {
    expect(mapBackendStatus('Pending')).toBe(ContractStatus.PENDING)
    expect(mapBackendStatus('Active')).toBe(ContractStatus.ACTIVE)
    expect(mapBackendStatus('Expired')).toBe(ContractStatus.EXPIRED)
    expect(mapBackendStatus('Terminated')).toBe(ContractStatus.TERMINATED)
  })

  it('defaults unknown status to PENDING', () => {
    expect(mapBackendStatus('Unknown')).toBe(ContractStatus.PENDING)
  })
})
