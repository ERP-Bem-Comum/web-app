/**
 * buildContractListQuery (#116) — query string da listagem de contratos. node:test puro.
 * Cobre o filtro server-side por contraparte (contractorId + contractorType) e a tradução de status.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildContractListQuery } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'
import type { ListContractsInput } from '#modules/contracts/server/domain/contracts.types.ts'

const base: ListContractsInput = { page: 1, limit: 100, order: 'DESC' }

describe('buildContractListQuery (#116 — filtro por contraparte)', () => {
  it('inclui contractorId + contractorType quando informados', () => {
    const qs = new URLSearchParams(
      buildContractListQuery({
        ...base,
        status: 'Em Andamento',
        contractorId: 'partner-uuid-1',
        contractorType: 'supplier',
      }),
    )
    assert.equal(qs.get('contractorId'), 'partner-uuid-1')
    assert.equal(qs.get('contractorType'), 'supplier')
    // status domínio → API (não regrediu): 'Em Andamento' → 'Active'
    assert.equal(qs.get('status'), 'Active')
  })

  it('omite contractorId/contractorType quando ausentes', () => {
    const qs = new URLSearchParams(buildContractListQuery(base))
    assert.equal(qs.has('contractorId'), false)
    assert.equal(qs.has('contractorType'), false)
  })

  it('aceita os 4 tipos de contraparte', () => {
    for (const t of ['supplier', 'financier', 'collaborator', 'act'] as const) {
      const qs = new URLSearchParams(buildContractListQuery({ ...base, contractorType: t }))
      assert.equal(qs.get('contractorType'), t)
    }
  })
})
