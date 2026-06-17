/**
 * Mapeadores do core-api de Acts (node:test, puro). `toWriteBody` (domínio→wire) e
 * `detailToModel`/`itemToModel` (wire→domínio). Cobre cnpj só-dígitos, conta/PIX null vs objeto,
 * hasFinancialTransfer, datas, legacyId e active.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  toWriteBody,
  detailToModel,
  itemToModel,
} from '#modules/partners/server/adapters/core-api/core-api-acts.ts'
import { isOk } from '#shared/primitives/result.ts'
import type { CreateActInput } from '#modules/partners/server/domain/act/act.io.ts'

const baseInput: CreateActInput = {
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  cnpj: '11.222.333/0001-81',
  corporateName: 'Instituição Parceira LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  legalRepresentative: 'João Diretor',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: false,
  bankAccount: null,
  pixKey: null,
}

describe('core-api-acts toWriteBody', () => {
  it('normaliza o cnpj para só-dígitos e mantém datas/flag', () => {
    const body = toWriteBody(baseInput)
    assert.equal(body.cnpj, '11222333000181')
    assert.equal(body.startDate, '2026-01-01')
    assert.equal(body.endDate, '2026-12-31')
    assert.equal(body.hasFinancialTransfer, false)
    assert.equal(body.bankAccount, null)
    assert.equal(body.pixKey, null)
    assert.equal(body.actNumber, 'ACT-2026-001')
    assert.equal(body.occupationArea, 'PARC')
  })

  it('passa conta bancária e PIX quando há repasse', () => {
    const body = toWriteBody({
      ...baseInput,
      hasFinancialTransfer: true,
      bankAccount: { bank: '001', agency: '1234', accountNumber: '5678', checkDigit: '9' },
      pixKey: { keyType: 'email', key: 'pix@org.dev' },
    })
    assert.equal(body.hasFinancialTransfer, true)
    assert.deepEqual(body.bankAccount, {
      bank: '001',
      agency: '1234',
      accountNumber: '5678',
      checkDigit: '9',
    })
    assert.deepEqual(body.pixKey, { keyType: 'email', key: 'pix@org.dev' })
  })
})

const rawDetail = {
  id: 'a1',
  legacyId: 42,
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  cnpj: '11222333000181',
  corporateName: 'Instituição Parceira LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  legalRepresentative: 'João Diretor',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: true,
  bankAccount: { bank: '001', agency: '1234', accountNumber: '5678', checkDigit: '9' },
  pixKey: { keyType: 'email' as const, key: 'pix@org.dev' },
  active: true,
  contractCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

describe('core-api-acts detailToModel / itemToModel', () => {
  it('detailToModel mapeia campos novos + legacyId + active', () => {
    const r = detailToModel(rawDetail)
    assert.ok(isOk(r))
    const d = r.value
    assert.equal(d.id, 'a1')
    assert.equal(d.legacyId, 42)
    assert.equal(d.active, true)
    assert.equal(d.cnpj, '11222333000181')
    assert.equal(d.legalRepresentative, 'João Diretor')
    assert.equal(d.startDate, '2026-01-01')
    assert.equal(d.endDate, '2026-12-31')
    assert.equal(d.hasFinancialTransfer, true)
    assert.deepEqual(d.bankAccount, { bank: '001', agency: '1234', accountNumber: '5678', checkDigit: '9' })
    assert.deepEqual(d.pixKey, { keyType: 'email', key: 'pix@org.dev' })
  })

  it('detailToModel tolera legacyId nulo e occupationArea legada', () => {
    const r = detailToModel({
      ...rawDetail,
      legacyId: null,
      occupationArea: 'LEGADO',
      bankAccount: null,
      pixKey: null,
      hasFinancialTransfer: false,
    })
    assert.ok(isOk(r))
    assert.equal(r.value.legacyId, null)
    assert.equal(r.value.occupationArea, 'LEGADO')
    assert.equal(r.value.bankAccount, null)
  })

  it('itemToModel projeta o subconjunto da lista', () => {
    const item = itemToModel(rawDetail)
    assert.equal(item.id, 'a1')
    assert.equal(item.actNumber, 'ACT-2026-001')
    assert.equal(item.corporateName, 'Instituição Parceira LTDA')
    assert.equal(item.occupationArea, 'PARC')
    assert.equal(item.hasFinancialTransfer, true)
    assert.equal(item.active, true)
  })
})
