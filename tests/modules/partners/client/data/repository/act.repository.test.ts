import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createActRepository } from '../../../../../../src/modules/partners/client/data/repository/act.repository.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type {
  ActDetail,
  ActListResponse,
} from '../../../../../../src/modules/partners/client/data/model/act.model.ts'

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
  legalRepresentative: 'João',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: false,
  bankAccount: null,
  pixKey: null,
  active: true,
  contractCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

const listResponse: ActListResponse = {
  items: [
    {
      id: 'a1',
      actNumber: 'ACT-2026-001',
      name: 'Acordo X',
      email: 'contato@org.dev',
      corporateName: 'Instituição LTDA',
      fantasyName: 'IP',
      occupationArea: 'PARC',
      hasFinancialTransfer: false,
      active: true,
      contractCount: 0,
    },
  ],
  meta: { page: 1, limit: 5, total: 1 },
}

const okFn =
  <T>(data: T) =>
  () =>
    Promise.resolve({ ok: true as const, data })

const baseDeps = {
  listActsFn: okFn(listResponse),
  getActFn: okFn(detail),
  createActFn: okFn(detail),
  updateActFn: okFn(detail),
  deactivateActFn: okFn({ ...detail, active: false }),
  reactivateActFn: okFn(detail),
}

describe('ActRepository (mapeia FnResult → Result)', () => {
  it('list/getById: ok no sucesso', async () => {
    const repo = createActRepository(baseDeps)
    assert.equal(isOk(await repo.list({ order: 'ASC', page: 1, limit: 5 })), true)
    const d = await repo.getById('a1')
    assert.equal(isOk(d) && d.value.cnpj === '11222333000181', true)
  })

  it('deactivate/reactivate: active correto', async () => {
    const repo = createActRepository(baseDeps)
    const d = await repo.deactivate('a1')
    assert.equal(isOk(d) && !d.value.active, true)
  })

  it('propaga erro do BFF como err(PartnersError)', async () => {
    const repo = createActRepository({
      ...baseDeps,
      getActFn: () => Promise.resolve({ ok: false as const, error: 'not-found' as const }),
    })
    const r = await repo.getById('nope')
    assert.equal(isErr(r) && r.error === 'not-found', true)
  })
})
