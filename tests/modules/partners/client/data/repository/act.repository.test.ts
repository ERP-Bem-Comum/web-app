import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createActRepository } from '../../../../../../src/modules/partners/client/data/repository/act.repository.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type { ActDetail, ActListResponse } from '../../../../../../src/modules/partners/client/data/model/act.model.ts'

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

const listResponse: ActListResponse = {
  items: [
    { id: 'a1', name: 'João Souza', email: 'joao@org.dev', occupationArea: 'PARC', role: 'Analista', registration: 'pre-registration', activation: 'active' },
  ],
  meta: { page: 1, limit: 5, total: 1 },
}

const okFn = <T>(data: T) => () => Promise.resolve({ ok: true as const, data })

const baseDeps = {
  listActsFn: okFn(listResponse),
  getActFn: okFn(detail),
  createActFn: okFn(detail),
  updateActFn: okFn(detail),
  deactivateActFn: okFn({ ...detail, activation: 'inactive' as const }),
  reactivateActFn: okFn(detail),
}

describe('ActRepository (mapeia FnResult → Result)', () => {
  it('list/getById: ok no sucesso', async () => {
    const repo = createActRepository(baseDeps)
    assert.equal(isOk(await repo.list({ order: 'ASC', page: 1, limit: 5 })), true)
    const d = await repo.getById('a1')
    assert.equal(isOk(d) && d.value.cpf === '12345678909', true)
  })

  it('deactivate/reactivate: activation correto', async () => {
    const repo = createActRepository(baseDeps)
    const d = await repo.deactivate('a1')
    assert.equal(isOk(d) && d.value.activation === 'inactive', true)
  })

  it('propaga erro do BFF como err(PartnersError)', async () => {
    const repo = createActRepository({ ...baseDeps, getActFn: () => Promise.resolve({ ok: false as const, error: 'not-found' as const }) })
    const r = await repo.getById('nope')
    assert.equal(isErr(r) && r.error === 'not-found', true)
  })
})
