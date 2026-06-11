import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createFinancierRepository } from '../../../../../../src/modules/partners/client/data/repository/financier.repository.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type {
  FinancierDetail,
  FinancierListResponse,
} from '../../../../../../src/modules/partners/client/data/model/financier.model.ts'

const detail: FinancierDetail = {
  id: 'f1',
  name: 'Fundo XPTO',
  corporateName: 'Fundo XPTO LTDA',
  cnpj: '12345678000190',
  telephone: '1140000000',
  activation: 'active',
  legalRepresentative: 'Maria Silva',
  address: 'Av. Paulista, 1000',
}

const listResponse: FinancierListResponse = {
  items: [
    { id: 'f1', name: 'Fundo XPTO', corporateName: 'Fundo XPTO LTDA', legalRepresentative: 'Maria Silva', cnpj: '12345678000190', telephone: '1140000000', activation: 'active' },
  ],
  meta: { page: 1, limit: 5, total: 1 },
}

const okFn = <T>(data: T) => () => Promise.resolve({ ok: true as const, data })
const errFn = (error: 'not-found' | 'validation' | 'forbidden' | 'conflict') => () =>
  Promise.resolve({ ok: false as const, error })

const baseDeps = {
  listFinanciersFn: okFn(listResponse),
  getFinancierFn: okFn(detail),
  createFinancierFn: okFn(detail),
  updateFinancierFn: okFn(detail),
  deactivateFinancierFn: okFn({ ...detail, activation: 'inactive' as const }),
  reactivateFinancierFn: okFn(detail),
}

describe('FinancierRepository (mapeia FnResult → Result)', () => {
  it('list: ok(data) no sucesso', async () => {
    const repo = createFinancierRepository(baseDeps)
    const r = await repo.list({ order: 'ASC', page: 1, limit: 5 })
    assert.equal(isOk(r) && r.value.meta.total === 1, true)
  })

  it('getById: ok(detail) no sucesso', async () => {
    const repo = createFinancierRepository(baseDeps)
    const r = await repo.getById('f1')
    assert.equal(isOk(r) && r.value.legalRepresentative === 'Maria Silva', true)
  })

  it('create/update: ok(detail)', async () => {
    const repo = createFinancierRepository(baseDeps)
    assert.equal(isOk(await repo.create({ name: 'x', corporateName: 'x', legalRepresentative: 'x', cnpj: '12345678000190', telephone: '1', address: 'a' })), true)
    assert.equal(isOk(await repo.update({ id: 'f1', name: 'x', corporateName: 'x', legalRepresentative: 'x', cnpj: '12345678000190', telephone: '1', address: 'a' })), true)
  })

  it('deactivate/reactivate: ok com activation correto', async () => {
    const repo = createFinancierRepository(baseDeps)
    const d = await repo.deactivate('f1')
    assert.equal(isOk(d) && d.value.activation === 'inactive', true)
    const a = await repo.reactivate('f1')
    assert.equal(isOk(a) && a.value.activation === 'active', true)
  })

  it('propaga erro do BFF como err(PartnersError)', async () => {
    const repo = createFinancierRepository({ ...baseDeps, getFinancierFn: errFn('not-found') })
    const r = await repo.getById('nope')
    assert.equal(isErr(r) && r.error === 'not-found', true)
  })
})
