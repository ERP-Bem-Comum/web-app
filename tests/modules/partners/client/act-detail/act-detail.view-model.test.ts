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
  name: 'João Souza',
  email: 'joao@org.dev',
  occupationArea: 'PARC',
  role: 'Analista',
  registration: 'pre-registration',
  activation: 'active',
  cpf: '12345678909',
  startOfContract: '2026-01-15',
  employmentRelationship: 'CLT',
}

describe('act-detail.view-model', () => {
  it('deriveDetailState: ok → ready com o ACT (inclui campos PF)', () => {
    const s = deriveDetailState(ok(detail))
    assert.equal(s.status, 'ready')
    assert.equal(s.status === 'ready' && s.act.cpf, '12345678909')
    assert.equal(s.status === 'ready' && s.act.employmentRelationship, 'CLT')
  })

  it('deriveDetailState: err → error com tag i18n', () => {
    const s = deriveDetailState(err('not-found'))
    assert.equal(s.status === 'error' && s.errorTag, 'partners.error.not-found')
  })

  it('statusActionFor: ativo → deactivate; inativo → reactivate', () => {
    assert.equal(statusActionFor('active'), 'deactivate')
    assert.equal(statusActionFor('inactive'), 'reactivate')
  })
})
