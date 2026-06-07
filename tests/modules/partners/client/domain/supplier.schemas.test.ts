import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { SupplierListFiltersSchema } from '../../../../../src/modules/partners/client/domain/supplier.schemas.ts'
import { SupplierFormSchema } from '../../../../../src/modules/partners/client/data/model/supplier.model.ts'

describe('SupplierListFiltersSchema', () => {
  it('aplica defaults (order ASC, page 1, limit 5)', () => {
    const r = SupplierListFiltersSchema.parse({})
    assert.equal(r.order, 'ASC')
    assert.equal(r.page, 1)
    assert.equal(r.limit, 5)
  })

  it('coage page/limit vindos como string (URL)', () => {
    const r = SupplierListFiltersSchema.parse({ page: '3', limit: '20' })
    assert.equal(r.page, 3)
    assert.equal(r.limit, 20)
  })

  it('degrada limit fora da faixa para o default (não deixa 999 vazar)', () => {
    // `.catch(5)`: o valor abusivo não passa a valer 999 nem derruba a navegação — cai no default.
    assert.equal(SupplierListFiltersSchema.parse({ limit: 999 }).limit, 5)
  })

  it('degrada page inválida da URL (?page=abc / vazio) para 1 em vez de quebrar', () => {
    assert.equal(SupplierListFiltersSchema.parse({ page: 'abc' }).page, 1)
    assert.equal(SupplierListFiltersSchema.parse({ page: '' }).page, 1)
  })

  it("regressão: active='false' da URL vira false (z.coerce.boolean fazia Boolean('false')===true)", () => {
    assert.equal(SupplierListFiltersSchema.parse({ active: 'false' }).active, false)
    assert.equal(SupplierListFiltersSchema.parse({ active: 'true' }).active, true)
    // navegação SPA passa boolean nativo — deve continuar aceito
    assert.equal(SupplierListFiltersSchema.parse({ active: false }).active, false)
    assert.equal(SupplierListFiltersSchema.parse({ active: true }).active, true)
  })
})

const validForm = {
  name: 'Acme',
  corporateName: 'Acme LTDA',
  fantasyName: 'Acme',
  email: 'contato@acme.dev',
  cnpj: '12.345.678/0001-90',
  serviceCategory: 'Limpeza',
}

describe('SupplierFormSchema', () => {
  it('aceita dados básicos válidos e normaliza o CNPJ para 14 dígitos', () => {
    const r = SupplierFormSchema.parse(validForm)
    assert.equal(r.cnpj, '12345678000190')
    assert.equal(r.bankAccount, null)
    assert.equal(r.pixKey, null)
  })

  it('rejeita e-mail inválido', () => {
    assert.equal(SupplierFormSchema.safeParse({ ...validForm, email: 'nope' }).success, false)
  })

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    assert.equal(SupplierFormSchema.safeParse({ ...validForm, cnpj: '123' }).success, false)
  })

  it('rejeita campo obrigatório vazio (name)', () => {
    assert.equal(SupplierFormSchema.safeParse({ ...validForm, name: '' }).success, false)
  })

  it('grupo bancário "tudo ou nada": objeto parcial é rejeitado', () => {
    const r = SupplierFormSchema.safeParse({ ...validForm, bankAccount: { bank: 'Itaú' } })
    assert.equal(r.success, false)
  })

  it('aceita grupo bancário completo', () => {
    const r = SupplierFormSchema.safeParse({
      ...validForm,
      bankAccount: { bank: 'Itaú', agency: '0001', accountNumber: '12345', checkDigit: '6' },
    })
    assert.equal(r.success, true)
  })
})
