/**
 * ContractDetail query key + view-model (node:test) — unidades puras.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { contractDetailQueryKey, contractDetailQueryOptions } from '#modules/contracts/client/contract-detail/contract-detail.query.ts'

describe('contractDetailQueryKey', () => {
  it('retorna chave com id', () => {
    const key = contractDetailQueryKey('abc-123')
    assert.deepStrictEqual(key, ['contracts', 'detail', 'abc-123'])
  })
})

describe('contractDetailQueryOptions', () => {
  it('retorna queryKey e queryFn', () => {
    const opts = contractDetailQueryOptions('abc-123')
    assert.deepStrictEqual(opts.queryKey, ['contracts', 'detail', 'abc-123'])
    assert.strictEqual(typeof opts.queryFn, 'function')
  })
})
