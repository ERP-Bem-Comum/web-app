import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getContractorFromRow } from '../../../../../src/modules/contracts/client/contract-list/contract-list.view-model.ts'
import type { ContractRow } from '../../../../../src/modules/contracts/client/domain/types.ts'

const mk = (over: Partial<ContractRow>): ContractRow => over as unknown as ContractRow

describe('getContractorFromRow (contratado por tipo, incl. ACT)', () => {
  it("ACT retorna o snapshot 'act' (não supplier)", () => {
    const row = mk({ contractType: 'ACT', act: { id: 'a1', name: 'Acordo X' } as never, supplier: undefined })
    const c = getContractorFromRow(row)
    assert.equal(c?.name, 'Acordo X')
  })

  it('Fornecedor retorna supplier; Financiador → financier; Colaborador → collaborator', () => {
    assert.equal(getContractorFromRow(mk({ contractType: 'Fornecedor', supplier: { name: 'F' } as never }))?.name, 'F')
    assert.equal(getContractorFromRow(mk({ contractType: 'Financiador', financier: { name: 'Fi' } as never }))?.name, 'Fi')
    assert.equal(getContractorFromRow(mk({ contractType: 'Colaborador', collaborator: { name: 'C' } as never }))?.name, 'C')
  })
})
