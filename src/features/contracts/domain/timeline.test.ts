import { describe, it, expect } from 'vitest'
import { buildContractTimeline } from './timeline'
import type { ContractRow } from './types'
import { ContractId } from './types'

function makeContract(overrides: Partial<ContractRow> = {}): ContractRow {
  return {
    id: ContractId(1),
    contractCode: 'C-2024-0001' as any,
    classification: 'Contrato' as any,
    contractModel: 'Serviço' as any,
    object: 'Objeto teste',
    totalValue: 10000 as any,
    contractPeriod: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
    contractType: 'Fornecedor' as any,
    contractStatus: 'Em andamento' as any,
    files: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as ContractRow
}

describe('buildContractTimeline', () => {
  it('returns base contract as the only item when no children', () => {
    const contract = makeContract()
    const timeline = buildContractTimeline(contract)

    expect(timeline).toHaveLength(1)
    expect(timeline[0].kind).toBe('base')
    expect(timeline[0].title).toBe('Contrato Base')
  })

  it('orders children by createdAt desc with base last', () => {
    const contract = makeContract({
      children: [
        {
          id: 2,
          contractCode: 'A-2024-0002',
          classification: 'Contrato',
          contractModel: 'Serviço',
          object: 'Aditivo 2',
          totalValue: 0,
          contractPeriod: { start: new Date('2024-06-01'), end: new Date('2024-12-31') },
          contractType: 'Fornecedor',
          contractStatus: 'Em andamento',
          files: [],
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
          aditivoType: 'prazo',
          aditivoStatus: 'Homologado',
          parentId: 1,
        } as any,
        {
          id: 3,
          contractCode: 'A-2024-0003',
          classification: 'Contrato',
          contractModel: 'Serviço',
          object: 'Aditivo 3',
          totalValue: 5000,
          contractPeriod: { start: new Date('2024-08-01'), end: new Date('2025-06-30') },
          contractType: 'Fornecedor',
          contractStatus: 'Em andamento',
          files: [],
          createdAt: new Date('2024-08-01'),
          updatedAt: new Date('2024-08-01'),
          aditivoType: 'valor',
          aditivoStatus: 'Pendente',
          parentId: 1,
        } as any,
      ],
    })

    const timeline = buildContractTimeline(contract)

    expect(timeline).toHaveLength(3)
    // Mais recente primeiro
    expect(timeline[0].id).toBe(3)
    expect(timeline[0].title).toBe('Aditivo de valor')
    expect(timeline[0].status).toBe('current')
    // Segundo aditivo
    expect(timeline[1].id).toBe(2)
    expect(timeline[1].title).toBe('Aditivo de prazo')
    expect(timeline[1].status).toBe('ok')
    // Base sempre por último
    expect(timeline[2].kind).toBe('base')
    expect(timeline[2].status).toBe('past')
  })

  it('marks homologado aditivo with correct badge', () => {
    const contract = makeContract({
      children: [
        {
          id: 2,
          contractCode: 'A-2024-0002',
          classification: 'Contrato',
          contractModel: 'Serviço',
          object: 'Aditivo',
          totalValue: 0,
          contractPeriod: { start: new Date('2024-06-01'), end: new Date('2024-12-31') },
          contractType: 'Fornecedor',
          contractStatus: 'Em andamento',
          files: [],
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
          aditivoType: 'prazo',
          aditivoStatus: 'Homologado',
          parentId: 1,
        } as any,
      ],
    })

    const timeline = buildContractTimeline(contract)
    expect(timeline[0].badge).toBe('Homologado')
    expect(timeline[0].badgeColor).toContain('text-[#176642]')
  })

  it('marks pending aditivo with correct badge', () => {
    const contract = makeContract({
      children: [
        {
          id: 2,
          contractCode: 'A-2024-0002',
          classification: 'Contrato',
          contractModel: 'Serviço',
          object: 'Aditivo',
          totalValue: 0,
          contractPeriod: { start: new Date('2024-06-01'), end: new Date('2024-12-31') },
          contractType: 'Fornecedor',
          contractStatus: 'Em andamento',
          files: [],
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
          aditivoType: 'prazo',
          aditivoStatus: 'Pendente',
          parentId: 1,
        } as any,
      ],
    })

    const timeline = buildContractTimeline(contract)
    expect(timeline[0].badge).toBe('Pendente')
    expect(timeline[0].badgeColor).toContain('text-[#9a5402]')
  })
})
