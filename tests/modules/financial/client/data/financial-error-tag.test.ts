/**
 * financialErrorTag (puro, node:test) — cada FinancialError vira uma tag `financial.error.*` distinta.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { financialErrorTag } from '../../../../../src/modules/financial/client/data/helpers/financial-error-tag.ts'
import type { FinancialError } from '../../../../../src/modules/financial/client/data/repository/financial-error.ts'

const ALL: readonly FinancialError[] = [
  'not-found',
  'invalid-transition',
  'net-value-invalid',
  'retention-not-allowed',
  'document-incomplete',
  'validation',
  'unauthorized',
  'forbidden',
  'conflict',
  'connectivity',
  'server',
]

describe('financialErrorTag', () => {
  it('mapeia toda variante para uma tag financial.error.*', () => {
    for (const e of ALL) {
      assert.match(financialErrorTag(e), /^financial\.error\./)
    }
  })

  it('tags são distintas (sem colisão)', () => {
    const tags = new Set(ALL.map(financialErrorTag))
    assert.equal(tags.size, ALL.length)
  })

  it('mapeamentos-chave', () => {
    assert.equal(financialErrorTag('net-value-invalid'), 'financial.error.net-value-invalid')
    assert.equal(financialErrorTag('retention-not-allowed'), 'financial.error.retention-not-allowed')
  })
})
