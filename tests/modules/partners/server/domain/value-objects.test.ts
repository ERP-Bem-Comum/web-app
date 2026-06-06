/**
 * VOs branded do módulo partners (smart constructors) — estado inválido irrepresentável (§IV).
 * TDD: escrito ANTES da impl. Cobre CPF, CNPJ, Email, UF, Phone, PixKey (MF-001).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { CPF } from '#modules/partners/server/domain/value-objects/cpf.value-object.ts'
import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import { UF } from '#modules/partners/server/domain/value-objects/uf.value-object.ts'
import { Phone } from '#modules/partners/server/domain/value-objects/phone.value-object.ts'
import { PixKey } from '#modules/partners/server/domain/value-objects/pix-key.value-object.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

describe('CPF', () => {
  it('vazio → err(empty)', () => {
    assert.equal(isErr(CPF('   ')) , true)
  })
  it('tamanho errado → err(invalid-length)', () => {
    const r = CPF('123')
    assert.equal(isErr(r) && r.error === 'invalid-length', true)
  })
  it('dígito verificador inválido → err(invalid-check-digit)', () => {
    const r = CPF('111.444.777-00')
    assert.equal(isErr(r) && r.error === 'invalid-check-digit', true)
  })
  it('todos iguais → err(invalid-check-digit)', () => {
    assert.equal(isErr(CPF('111.111.111-11')), true)
  })
  it('válido formatado → ok(somente dígitos)', () => {
    const r = CPF('111.444.777-35')
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value, '11144477735')
  })
})

describe('CNPJ', () => {
  it('tamanho errado → err(invalid-length)', () => {
    const r = CNPJ('11.222.333')
    assert.equal(isErr(r) && r.error === 'invalid-length', true)
  })
  it('dígito verificador inválido → err(invalid-check-digit)', () => {
    assert.equal(isErr(CNPJ('11.222.333/0001-00')), true)
  })
  it('válido formatado → ok(somente dígitos)', () => {
    const r = CNPJ('11.222.333/0001-81')
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value, '11222333000181')
  })
})

describe('Email', () => {
  it('vazio → err(empty)', () => {
    assert.equal(isErr(Email('  ')), true)
  })
  it('inválido → err(invalid-format)', () => {
    assert.equal(isErr(Email('nope')), true)
  })
  it('válido → ok(normalizado)', () => {
    const r = Email('  Foo@Bar.dev ')
    assert.equal(isOk(r) && r.value === 'foo@bar.dev', true)
  })
})

describe('UF', () => {
  it('inválida → err(invalid-uf)', () => {
    assert.equal(isErr(UF('XX')), true)
  })
  it('válida minúscula → ok(maiúscula)', () => {
    const r = UF('sp')
    assert.equal(isOk(r) && r.value === 'SP', true)
  })
})

describe('Phone', () => {
  it('curto → err(invalid-length)', () => {
    assert.equal(isErr(Phone('123')), true)
  })
  it('válido formatado → ok(dígitos)', () => {
    const r = Phone('(15) 99721-3285')
    assert.equal(isOk(r) && r.value === '15997213285', true)
  })
})

describe('PixKey', () => {
  it('vazia → err(empty-key)', () => {
    assert.equal(isErr(PixKey('email', '  ')), true)
  })
  it('email inválido p/ tipo email → err(invalid-for-type)', () => {
    assert.equal(isErr(PixKey('email', 'nope')), true)
  })
  it('cpf válido p/ tipo cpf → ok', () => {
    assert.equal(isOk(PixKey('cpf', '111.444.777-35')), true)
  })
  it('random uuid → ok', () => {
    assert.equal(isOk(PixKey('random', '550e8400-e29b-41d4-a716-446655440000')), true)
  })
})
