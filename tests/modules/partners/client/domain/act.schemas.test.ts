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
})

const validForm = {
  name: 'João Souza',
  email: 'joao@org.dev',
  cpf: '123.456.789-09',
  occupationArea: 'PARC',
  role: 'Analista',
  startOfContract: '2026-01-15',
  employmentRelationship: 'CLT',
}

describe('ActFormSchema', () => {
  it('aceita os 7 campos válidos e normaliza o CPF para 11 dígitos', () => {
    const r = ActFormSchema.parse(validForm)
    assert.equal(r.cpf, '12345678909')
    assert.equal(r.occupationArea, 'PARC')
    assert.equal(r.employmentRelationship, 'CLT')
  })

  it('aceita CPF sem máscara', () => {
    assert.equal(ActFormSchema.parse({ ...validForm, cpf: '12345678909' }).cpf, '12345678909')
  })

  it('rejeita CPF inválido, enum fora da lista, data inválida e obrigatório vazio', () => {
    assert.equal(ActFormSchema.safeParse({ ...validForm, cpf: '123' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, occupationArea: 'XXX' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, startOfContract: '15/01/2026' }).success, false)
    assert.equal(ActFormSchema.safeParse({ ...validForm, name: '' }).success, false)
  })
})
