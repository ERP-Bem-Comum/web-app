import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { UserFormSchema } from '../../../../../src/modules/users/client/data/model/user.model.ts'

const validForm = {
  name: 'Maria Souza',
  cpf: '123.456.789-09',
  email: 'maria@org.dev',
  telephone: '(11) 98888-7777',
}

describe('UserFormSchema', () => {
  it('aceita um form válido e normaliza CPF/telefone para dígitos', () => {
    const r = UserFormSchema.safeParse(validForm)
    assert.equal(r.success, true)
    if (r.success) {
      assert.equal(r.data.name, 'Maria Souza')
      assert.equal(r.data.cpf, '12345678909') // só dígitos
      assert.equal(r.data.email, 'maria@org.dev')
      assert.equal(r.data.telephone, '11988887777') // só dígitos
    }
  })

  it('rejeita nome vazio', () => {
    const r = UserFormSchema.safeParse({ ...validForm, name: '' })
    assert.equal(r.success, false)
  })

  it('rejeita e-mail inválido', () => {
    const r = UserFormSchema.safeParse({ ...validForm, email: 'nao-eh-email' })
    assert.equal(r.success, false)
  })

  it('rejeita CPF com menos de 11 dígitos', () => {
    const r = UserFormSchema.safeParse({ ...validForm, cpf: '123.456' })
    assert.equal(r.success, false)
  })

  it('aceita telefone fixo (10 dígitos) e celular (11 dígitos)', () => {
    assert.equal(UserFormSchema.safeParse({ ...validForm, telephone: '1133334444' }).success, true)
    assert.equal(UserFormSchema.safeParse({ ...validForm, telephone: '11933334444' }).success, true)
  })

  it('rejeita telefone com menos de 10 dígitos', () => {
    const r = UserFormSchema.safeParse({ ...validForm, telephone: '12345' })
    assert.equal(r.success, false)
  })
})
