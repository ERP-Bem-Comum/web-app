/**
 * resetPasswordViewModel — derivação PURA (node:test) do "Redefinir Senha" (#038). Cobre o mapeamento
 * de erro → tag i18n (incl. o 400 "link inválido") e o gate PURO do botão (policy + confirmação).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { resetPasswordViewModel } from '#modules/auth/client/reset-password/viewModel/reset-password.view-model.ts'

const limits = { minLength: 12, maxLength: 128 }
const valid = 'Aa1!aaaaaaaa' // 12 chars, upper+lower+number+special

describe('resetPasswordViewModel.toErrorTag', () => {
  it('reset-token-invalid (400) → tag única de link inválido (não vaza o subcaso)', () => {
    assert.equal(resetPasswordViewModel.toErrorTag('reset-token-invalid'), 'auth.reset.error.link-invalid')
  })
  it('connectivity → tag de conectividade (rede)', () => {
    assert.equal(resetPasswordViewModel.toErrorTag('connectivity'), 'auth.error.connectivity')
  })
  it('server → tag genérica (não vaza detalhe)', () => {
    assert.equal(resetPasswordViewModel.toErrorTag('server'), 'auth.error.unexpected')
  })
  it('unexpectedErrorTag é a tag genérica', () => {
    assert.equal(resetPasswordViewModel.unexpectedErrorTag, 'auth.error.unexpected')
  })
})

describe('resetPasswordViewModel.canSubmit (gate do botão)', () => {
  it('senha válida + confirmação igual → true', () => {
    assert.equal(resetPasswordViewModel.canSubmit(valid, valid, limits), true)
  })
  it('senha válida mas confirmação diferente → false', () => {
    assert.equal(resetPasswordViewModel.canSubmit(valid, `${valid}x`, limits), false)
  })
  it('senha que não atende à policy (curta) → false, mesmo com confirmação igual', () => {
    assert.equal(resetPasswordViewModel.canSubmit('Aa1!', 'Aa1!', limits), false)
  })
  it('senha sem símbolo especial → false', () => {
    assert.equal(resetPasswordViewModel.canSubmit('Aa1aaaaaaaaa', 'Aa1aaaaaaaaa', limits), false)
  })
  it('ambas vazias → false', () => {
    assert.equal(resetPasswordViewModel.canSubmit('', '', limits), false)
  })
})
