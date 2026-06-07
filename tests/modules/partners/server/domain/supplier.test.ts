/**
 * Supplier — transições de domínio (node:test, puro). PJ com CNPJ/Email branded; status único
 * (ativo/inativo), desativação SIMPLES (sem motivo). bankAccount/pixKey coesos.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import { isOk } from '#shared/primitives/result.ts'
import { buildSupplier, deactivate, reactivate } from '#modules/partners/server/domain/supplier/supplier.ts'
import type { SupplierInput } from '#modules/partners/server/domain/supplier/supplier.types.ts'

const makeInput = (): SupplierInput => {
  const cnpj = CNPJ('11.222.333/0001-81') // CNPJ válido (DV correto)
  const email = Email('contato@fornecedor.com')
  assert.ok(isOk(cnpj), 'CNPJ de fixture deve ser válido')
  assert.ok(isOk(email), 'Email de fixture deve ser válido')
  return {
    name: 'Fornecedor X',
    email: email.value,
    cnpj: cnpj.value,
    corporateName: 'Fornecedor X LTDA',
    fantasyName: 'Fornecedor X',
    serviceCategory: 'LIMPEZA',
    bankAccount: { bank: '001', agency: '1234', accountNumber: '56789', checkDigit: '0' },
    pixKey: null,
  }
}

describe('Supplier — transições de domínio', () => {
  it('nasce active', () => {
    assert.strictEqual(buildSupplier(makeInput()).activation, 'active')
  })

  it('deactivate: active → inactive (idempotente, sem motivo)', () => {
    const d = deactivate(buildSupplier(makeInput()))
    assert.strictEqual(d.activation, 'inactive')
    assert.strictEqual(deactivate(d).activation, 'inactive')
  })

  it('reactivate: inactive → active (idempotente)', () => {
    const r = reactivate(deactivate(buildSupplier(makeInput())))
    assert.strictEqual(r.activation, 'active')
    assert.strictEqual(reactivate(r).activation, 'active')
  })
})
