/**
 * Validador de senha (#32) — parametrizável por { minLength, maxLength }, default seguro {12,128}.
 * Tamanho usa os limites; complexidade (upper/lower/number/special) preservada.
 * (Antes: min 8 / max 15 hardcoded — alinhado ao backend que exige 12.)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { evaluatePassword, passwordMeetsPolicy } from '../../../../../src/modules/users/client/domain/password-policy.ts'

const STRONG_12 = 'Abcdef1!ghij' // 12 chars: upper+lower+number+special

describe('evaluatePassword', () => {
  it('marca cada regra individualmente', () => {
    const c = evaluatePassword('abc')
    assert.equal(c.length, false)
    assert.equal(c.lower, true)
    assert.equal(c.upper, false)
    assert.equal(c.number, false)
    assert.equal(c.special, false)
  })

  it('default {12,128}: 11 chars fortes → length=false', () => {
    assert.equal(evaluatePassword('Abcdef1!ghi').length, false) // 11
  })

  it('default {12,128}: 12 chars fortes → todas as regras true', () => {
    assert.deepEqual(evaluatePassword(STRONG_12), { length: true, upper: true, lower: true, number: true, special: true })
  })

  it('default: 16 chars (≤128) → length=true (corrige o teto espúrio 15)', () => {
    assert.equal(evaluatePassword('Abcdefg12345678#').length, true) // 16
  })

  it('limite custom: minLength=8 aceita 8 chars', () => {
    assert.equal(evaluatePassword('Abcdef1!', { minLength: 8, maxLength: 128 }).length, true)
  })

  it('respeita maxLength (rejeita acima)', () => {
    assert.equal(evaluatePassword('A1!' + 'a'.repeat(130), { minLength: 12, maxLength: 128 }).length, false)
  })

  it('complexidade preservada: 12+ sem maiúscula → upper=false', () => {
    const c = evaluatePassword('abcdef1!ghij', { minLength: 12, maxLength: 128 })
    assert.equal(c.length, true)
    assert.equal(c.upper, false)
  })
})

describe('passwordMeetsPolicy', () => {
  it('true só quando todas as regras passam (default min 12)', () => {
    assert.equal(passwordMeetsPolicy(STRONG_12), true) // 12 forte
    assert.equal(passwordMeetsPolicy('Abcdef1!ghi'), false) // 11 — curta
    assert.equal(passwordMeetsPolicy('abcdef1!ghij'), false) // sem maiúscula
    assert.equal(passwordMeetsPolicy('Abcdefghijkl'), false) // sem número/símbolo
  })

  it('respeita limites custom', () => {
    assert.equal(passwordMeetsPolicy('Abc12#xy', { minLength: 8, maxLength: 128 }), true) // 8 forte
  })
})
