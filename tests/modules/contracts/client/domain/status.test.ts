import { describe, it } from 'node:test'
import assert from 'node:assert'
import { deriveStatus } from '../../../../../src/modules/contracts/client/domain/status.ts'
import type { ContractRow } from '../../../../../src/modules/contracts/client/domain/types.ts'
import type { ContractId, Money, ContractCode } from '../../../../../src/modules/contracts/client/domain/types.ts'

function makeRow(status: string): ContractRow {
  return {
    id: 'c1' as unknown as ContractId,
    classification: 'Contrato',
    contractModel: 'Serviço',
    object: 'Test',
    totalValue: 1000 as unknown as Money,
    contractPeriod: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
    contractType: 'Fornecedor',
    contractStatus: status as ContractRow['contractStatus'],
    contractCode: '001' as unknown as ContractCode,
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('deriveStatus', () => {
  it('returns "em-andamento" for Em Andamento', () => {
    const row = makeRow('Em Andamento')
    const result = deriveStatus(row, false)
    assert.strictEqual(result.key, 'em-andamento')
    assert.strictEqual(result.label, 'EM ANDAMENTO')
  })

  it('returns "finalizado" for Finalizado', () => {
    const row = makeRow('Finalizado')
    const result = deriveStatus(row, false)
    assert.strictEqual(result.key, 'finalizado')
    assert.strictEqual(result.label, 'FINALIZADO')
  })

  it('returns "pendente" for Pendente', () => {
    const row = makeRow('Pendente')
    const result = deriveStatus(row, false)
    assert.strictEqual(result.key, 'pendente')
    assert.strictEqual(result.label, 'PENDENTE')
  })

  it('returns "distrato" for Distrato', () => {
    const row = makeRow('Distrato')
    const result = deriveStatus(row, false)
    assert.strictEqual(result.key, 'distrato')
    assert.strictEqual(result.label, 'DISTRATO')
  })
})
