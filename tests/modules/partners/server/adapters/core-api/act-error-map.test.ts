/**
 * SLUG_TO_ERROR do core-api de Acts (node:test, puro). Os slugs do #32 → PartnersError.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { SLUG_TO_ERROR } from '#modules/partners/server/adapters/core-api/core-api-acts.ts'

describe('core-api-acts SLUG_TO_ERROR', () => {
  it('número de instrumento duplicado (3 variantes) → act-number-duplicate', () => {
    assert.equal(SLUG_TO_ERROR['register-act-number-duplicate'], 'act-number-duplicate')
    assert.equal(SLUG_TO_ERROR['edit-act-number-duplicate'], 'act-number-duplicate')
    assert.equal(SLUG_TO_ERROR['act-number-duplicate'], 'act-number-duplicate')
  })

  it('cnpj inválido → invalid-cnpj', () => {
    assert.equal(SLUG_TO_ERROR['invalid-cnpj'], 'invalid-cnpj')
  })

  it('vigência inválida (2 variantes) → invalid-act-period', () => {
    assert.equal(SLUG_TO_ERROR['period-end-before-start'], 'invalid-act-period')
    assert.equal(SLUG_TO_ERROR['period-zero-duration'], 'invalid-act-period')
  })

  it('repasse sem destino → act-payment-target-required', () => {
    assert.equal(SLUG_TO_ERROR['act-payment-target-required'], 'act-payment-target-required')
  })
})
