import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveDetailState,
  statusActionFor,
} from '../../../../../src/modules/partners/client/act-detail/act-detail.view-model.ts'
import { ok, err } from '../../../../../src/shared/primitives/result.ts'
import type { ActDetail } from '../../../../../src/modules/partners/client/data/model/act.model.ts'

const detail: ActDetail = {
  id: 'a1',
  legacyId: null,
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  cnpj: '11222333000181',
  corporateName: 'Instituição LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  legalRepresentative: 'João Diretor',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: false,
  bankAccount: null,
  pixKey: null,
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

describe('act-detail.view-model', () => {
  it('deriveDetailState: ok → ready com o Acordo (campos institucionais)', () => {
    const s = deriveDetailState(ok(detail))
    assert.equal(s.status, 'ready')
    assert.equal(s.status === 'ready' && s.act.cnpj, '11222333000181')
    assert.equal(s.status === 'ready' && s.act.corporateName, 'Instituição LTDA')
  })

  it('deriveDetailState: err → error com tag i18n', () => {
    const s = deriveDetailState(err('not-found'))
    assert.equal(s.status === 'error' && s.errorTag, 'partners.error.not-found')
  })

  it('statusActionFor: ativo → deactivate; inativo → reactivate', () => {
    assert.equal(statusActionFor(true), 'deactivate')
    assert.equal(statusActionFor(false), 'reactivate')
  })
})
