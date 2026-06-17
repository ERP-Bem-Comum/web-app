import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveDetailState,
  statusActionFor,
} from '../../../../../src/modules/partners/client/financier-detail/financier-detail.view-model.ts'
import { ok, err } from '../../../../../src/shared/primitives/result.ts'
import type { FinancierDetail } from '../../../../../src/modules/partners/client/data/model/financier.model.ts'

const detail: FinancierDetail = {
  id: 'f1',
  name: 'Fundo XPTO',
  corporateName: 'Fundo XPTO LTDA',
  cnpj: '12345678000190',
  telephone: '1140000000',
  activation: 'active',
  legalRepresentative: 'Maria Silva',
  address: 'Av. Paulista, 1000',
  bankAccount: null,
  pixKey: null,
}

describe('financier-detail.view-model', () => {
  it('deriveDetailState: ok → ready com o financiador', () => {
    const s = deriveDetailState(ok(detail))
    assert.equal(s.status, 'ready')
    assert.equal(s.status === 'ready' && s.financier.legalRepresentative, 'Maria Silva')
  })

  it('deriveDetailState: err → error com tag i18n', () => {
    const s = deriveDetailState(err('not-found'))
    assert.equal(s.status, 'error')
    assert.equal(s.status === 'error' && s.errorTag, 'partners.error.not-found')
  })

  it('statusActionFor: ativo → deactivate; inativo → reactivate', () => {
    assert.equal(statusActionFor('active'), 'deactivate')
    assert.equal(statusActionFor('inactive'), 'reactivate')
  })
})
