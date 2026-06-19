/**
 * reconciliationErrorTag (puro, node:test) — cada ReconciliationError vira uma tag
 * `financial.recon.error.*` distinta. Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { reconciliationErrorTag } from '../../../../../src/modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type { ReconciliationError } from '../../../../../src/modules/financial/client/data/repository/reconciliation-error.ts'

const ALL: readonly ReconciliationError[] = [
  'not-found',
  'validation',
  'conflict',
  'unauthorized',
  'forbidden',
  'connectivity',
  'server',
  'import-unsupported-format',
  'import-empty-content',
  'import-malformed',
  'import-empty-statement',
  'period-closed',
  'period-has-pending',
  'invalid-period-range',
  'period-not-found',
  'reconciliation-not-balanced',
  'transaction-already-reconciled',
  'account-closed',
  'payable-not-found',
  'title-not-paid',
  'empty-reconciliation',
  'reconciliation-already-undone',
  'export-unsupported-format',
  'unavailable',
]

describe('reconciliationErrorTag', () => {
  it('mapeia toda variante para uma tag financial.recon.error.*', () => {
    for (const e of ALL) {
      assert.match(reconciliationErrorTag(e), /^financial\.recon\.error\./)
    }
  })

  it('tags são distintas (sem colisão)', () => {
    const tags = new Set(ALL.map(reconciliationErrorTag))
    assert.equal(tags.size, ALL.length)
  })

  it('mapeamentos-chave', () => {
    assert.equal(
      reconciliationErrorTag('reconciliation-not-balanced'),
      'financial.recon.error.reconciliation-not-balanced',
    )
    assert.equal(reconciliationErrorTag('title-not-paid'), 'financial.recon.error.title-not-paid')
    assert.equal(reconciliationErrorTag('unavailable'), 'financial.recon.error.unavailable')
  })
})
