import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { partnersErrorTag } from '../../../../../src/modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '../../../../../src/modules/partners/client/data/repository/supplier.repository.ts'

describe('partnersErrorTag', () => {
  it('mapeia cada PartnersError para uma tag partners.error.*', () => {
    const all: readonly PartnersError[] = [
      'not-found',
      'validation',
      'unauthorized',
      'forbidden',
      'conflict',
      'connectivity',
      'server',
      'collaborator-import-malformed',
      'invalid-registration-transition',
      'deactivation-reason-required',
      'invalid-service-category',
      'invalid-state',
      'invalid-ibge-code',
    ]
    for (const e of all) {
      const tag = partnersErrorTag(e)
      assert.ok(tag.startsWith('partners.error.'), `tag de ${e} deve começar com partners.error.`)
      assert.ok(tag.length > 'partners.error.'.length, `tag de ${e} não pode ser vazia`)
    }
  })

  it('mapeia unauthorized e not-found para tags específicas', () => {
    assert.equal(partnersErrorTag('unauthorized'), 'partners.error.unauthorized')
    assert.equal(partnersErrorTag('not-found'), 'partners.error.not-found')
    assert.equal(partnersErrorTag('invalid-service-category'), 'partners.error.invalid-service-category')
  })
})
