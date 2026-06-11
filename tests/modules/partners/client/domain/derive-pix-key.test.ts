import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { derivePixKey } from '../../../../../src/modules/partners/client/domain/derive-pix-key.ts'

const src = { document: '12345678000190', email: 'a@b.com', telephone: '11988887777' }

describe('derivePixKey (deriva a chave PIX do campo correspondente)', () => {
  it('cpf|cnpj → document', () => {
    assert.equal(derivePixKey('cpf', src), '12345678000190')
    assert.equal(derivePixKey('cnpj', src), '12345678000190')
  })

  it('email → email', () => {
    assert.equal(derivePixKey('email', src), 'a@b.com')
  })

  it('phone → telephone', () => {
    assert.equal(derivePixKey('phone', src), '11988887777')
  })

  it('random-key → vazio', () => {
    assert.equal(derivePixKey('random-key', src), '')
  })

  it('campo correspondente ausente/vazio → vazio', () => {
    assert.equal(derivePixKey('cnpj', { email: 'a@b.com' }), '')
    assert.equal(derivePixKey('email', { document: 'x' }), '')
    assert.equal(derivePixKey('phone', { document: 'x', email: 'a@b.com' }), '')
  })
})
