import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { ok, err } from '../../../../../src/shared/primitives/result.ts'
import {
  deriveDetailState,
  statusActionFor,
} from '../../../../../src/modules/partners/client/supplier-detail/supplier-detail.view-model.ts'
import type { SupplierDetail } from '../../../../../src/modules/partners/client/data/model/supplier.model.ts'

const detail: SupplierDetail = {
  id: '1',
  name: 'Acme',
  email: 'c@acme.dev',
  cnpj: '12345678000190',
  corporateName: 'Acme LTDA',
  fantasyName: 'Acme',
  serviceCategory: 'Limpeza',
  activation: 'active',
  bankAccount: null,
  pixKey: null,
  serviceRating: null,
  ratingComment: null,
}

describe('supplier-detail.view-model', () => {
  it('deriveDetailState: ok → ready com o supplier', () => {
    const s = deriveDetailState(ok(detail))
    assert.equal(s.status, 'ready')
    if (s.status === 'ready') assert.equal(s.supplier.id, '1')
  })

  it('deriveDetailState: not-found → error com tag específica', () => {
    const s = deriveDetailState(err('not-found'))
    assert.equal(s.status, 'error')
    if (s.status === 'error') assert.equal(s.errorTag, 'partners.error.not-found')
  })

  it('statusActionFor: ativo → deactivate; inativo → reactivate', () => {
    assert.equal(statusActionFor('active'), 'deactivate')
    assert.equal(statusActionFor('inactive'), 'reactivate')
  })
})
