import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  SupplierListFiltersSchema,
  SupplierFormSchema,
} from '../../../../../src/modules/partners/client/domain/supplier.schemas.ts'

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

  it('rejeita limit acima de 100', () => {
    assert.equal(SupplierListFiltersSchema.safeParse({ limit: 999 }).success, false)
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
