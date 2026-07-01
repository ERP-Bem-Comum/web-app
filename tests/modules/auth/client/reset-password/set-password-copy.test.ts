/**
 * setPasswordCopy / setPasswordErrorKey — derivação PURA (node:test) do seletor de copy que serve as
 * DUAS variantes da tela de definir senha: 'reset' (#038) e 'activate' (#039). Cobre as chaves i18n por
 * variant, o destino do CTA de link inválido e o override do texto de erro 400 por variant.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  setPasswordCopy,
  setPasswordErrorKey,
} from '#modules/auth/client/reset-password/page/set-password.copy.ts'

describe('setPasswordCopy (variant → copy)', () => {
  it("variant 'reset' → chaves auth.reset.* e CTA para /recuperar-senha", () => {
    const c = setPasswordCopy('reset')
    assert.equal(c.titleKey, 'auth.reset.title')
    assert.equal(c.submitKey, 'auth.reset.submit')
    assert.equal(c.successTitleKey, 'auth.reset.success-title')
    assert.equal(c.invalidTitleKey, 'auth.reset.invalid-link-title')
    assert.equal(c.invalidTarget, '/recuperar-senha')
  })

  it("variant 'activate' → chaves auth.activate.* e CTA para /login", () => {
    const c = setPasswordCopy('activate')
    assert.equal(c.titleKey, 'auth.activate.title')
    assert.equal(c.submitKey, 'auth.activate.submit')
    assert.equal(c.successTitleKey, 'auth.activate.success-title')
    assert.equal(c.invalidTitleKey, 'auth.activate.invalid-link-title')
    assert.equal(c.invalidTarget, '/login')
  })
})

describe('setPasswordErrorKey (override do texto de erro 400 por variant)', () => {
  it('reset: link inválido → mantém a chave auth.reset.error.link-invalid', () => {
    assert.equal(
      setPasswordErrorKey('reset', 'auth.reset.error.link-invalid'),
      'auth.reset.error.link-invalid',
    )
  })

  it('activate: link inválido → troca para auth.activate.error.link-invalid (texto de convite)', () => {
    assert.equal(
      setPasswordErrorKey('activate', 'auth.reset.error.link-invalid'),
      'auth.activate.error.link-invalid',
    )
  })

  it('erros compartilhados (rede/genérico) passam sem tradução por variant', () => {
    assert.equal(setPasswordErrorKey('activate', 'auth.error.connectivity'), 'auth.error.connectivity')
    assert.equal(setPasswordErrorKey('reset', 'auth.error.unexpected'), 'auth.error.unexpected')
  })
})
