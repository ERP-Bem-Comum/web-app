import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { ActListFiltersSchema } from '../../../../../src/modules/partners/client/data/act-list-filters.schema.ts'
import { ActFormSchema } from '../../../../../src/modules/partners/client/data/model/act.model.ts'

describe('ActListFiltersSchema', () => {
  it('aplica defaults (order ASC, page 1, limit 5)', () => {
    const r = ActListFiltersSchema.parse({})
    assert.equal(r.order, 'ASC')
    assert.equal(r.page, 1)
    assert.equal(r.limit, 5)
  })

  it('degrada page/limit inválidos da URL para o default', () => {
    assert.equal(ActListFiltersSchema.parse({ page: 'abc' }).page, 1)
    assert.equal(ActListFiltersSchema.parse({ limit: 999 }).limit, 5)
  })

  it("active='false' da URL vira false", () => {
    assert.equal(ActListFiltersSchema.parse({ active: 'false' }).active, false)
    assert.equal(ActListFiltersSchema.parse({ active: true }).active, true)
  })

  it('aceita hasFinancialTransfer e occupationArea', () => {
    assert.equal(ActListFiltersSchema.parse({ hasFinancialTransfer: 'true' }).hasFinancialTransfer, true)
    assert.equal(ActListFiltersSchema.parse({ occupationArea: 'PARC' }).occupationArea, 'PARC')
    assert.equal(ActListFiltersSchema.safeParse({ occupationArea: 'XXX' }).success, false)
  })
})

const validForm = {
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  cnpj: '11.222.333/0001-81',
  corporateName: 'Instituição LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  legalRepresentative: 'João',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: false,
  bankAccount: null,
  pixKey: null,
}

describe('ActFormSchema', () => {
  it('aceita os campos válidos e normaliza o CNPJ para 14 dígitos', () => {
    const r = ActFormSchema.parse(validForm)
    assert.equal(r.cnpj, '11222333000181')
    assert.equal(r.occupationArea, 'PARC')
    assert.equal(r.hasFinancialTransfer, false)
  })

  it('aceita CNPJ sem máscara', () => {
    assert.equal(ActFormSchema.parse({ ...validForm, cnpj: '11222333000181' }).cnpj, '11222333000181')
  })

  it('rejeita CNPJ inválido, enum fora da lista, data inválida e obrigatório vazio', () => {
    assert.equal(ActFormSchema.safeParse({ ...validForm, cnpj: '123' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, occupationArea: 'XXX' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, startDate: '01/01/2026' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, name: '' }).success, false)
  })
})
