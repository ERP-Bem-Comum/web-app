import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { FinancierListFiltersSchema } from '../../../../../src/modules/partners/client/domain/financier.schemas.ts'
import { FinancierFormSchema } from '../../../../../src/modules/partners/client/data/model/financier.model.ts'

describe('FinancierListFiltersSchema', () => {
  it('aplica defaults (order ASC, page 1, limit 5)', () => {
    const r = FinancierListFiltersSchema.parse({})
    assert.equal(r.order, 'ASC')
    assert.equal(r.page, 1)
    assert.equal(r.limit, 5)
  })

  it('coage page/limit vindos como string (URL)', () => {
    const r = FinancierListFiltersSchema.parse({ page: '3', limit: '20' })
    assert.equal(r.page, 3)
    assert.equal(r.limit, 20)
  })

  it('degrada limit fora da faixa para o default (não deixa 999 vazar)', () => {
    assert.equal(FinancierListFiltersSchema.parse({ limit: 999 }).limit, 5)
  })

  it('degrada page inválida da URL (?page=abc / vazio) para 1 em vez de quebrar', () => {
    assert.equal(FinancierListFiltersSchema.parse({ page: 'abc' }).page, 1)
    assert.equal(FinancierListFiltersSchema.parse({ page: '' }).page, 1)
  })

  it("regressão: active='false' da URL vira false (z.coerce.boolean fazia Boolean('false')===true)", () => {
    assert.equal(FinancierListFiltersSchema.parse({ active: 'false' }).active, false)
    assert.equal(FinancierListFiltersSchema.parse({ active: 'true' }).active, true)
    assert.equal(FinancierListFiltersSchema.parse({ active: false }).active, false)
    assert.equal(FinancierListFiltersSchema.parse({ active: true }).active, true)
  })
})

const validForm = {
  name: 'Fundo XPTO',
  corporateName: 'Fundo XPTO LTDA',
  legalRepresentative: 'Maria Silva',
  cnpj: '12.345.678/0001-90',
  telephone: '(11) 4000-0000',
  address: 'Av. Paulista, 1000 - São Paulo/SP',
}

describe('FinancierFormSchema', () => {
  it('aceita os 6 campos válidos e normaliza o CNPJ para 14 dígitos', () => {
    const r = FinancierFormSchema.parse(validForm)
    assert.equal(r.cnpj, '12345678000190')
    assert.equal(r.name, 'Fundo XPTO')
    assert.equal(r.legalRepresentative, 'Maria Silva')
  })

  it('aceita CNPJ sem máscara (14 dígitos crus)', () => {
    const r = FinancierFormSchema.parse({ ...validForm, cnpj: '12345678000190' })
    assert.equal(r.cnpj, '12345678000190')
  })

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    assert.equal(FinancierFormSchema.safeParse({ ...validForm, cnpj: '123' }).success, false)
  })

  it('rejeita campo obrigatório vazio', () => {
    assert.equal(FinancierFormSchema.safeParse({ ...validForm, name: '' }).success, false)
    assert.equal(FinancierFormSchema.safeParse({ ...validForm, address: '   ' }).success, false)
  })
})
