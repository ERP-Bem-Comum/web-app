import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { evaluatePassword, passwordMeetsPolicy } from '../../../../../src/modules/users/client/domain/password-policy.ts'

describe('evaluatePassword', () => {
  it('marca cada regra individualmente', () => {
    const c = evaluatePassword('abc')
    assert.equal(c.length, false)
    assert.equal(c.lower, true)
    assert.equal(c.upper, false)
    assert.equal(c.number, false)
    assert.equal(c.special, false)
  })

  it('reconhece todos os critérios numa senha válida', () => {
    const c = evaluatePassword('Abc12#xy')
    assert.deepEqual(c, { length: true, upper: true, lower: true, number: true, special: true })
  })

  it('reprova comprimento acima de 15', () => {
    assert.equal(evaluatePassword('Abcdefg12345678#').length, false) // 16 chars
  })
})

describe('passwordMeetsPolicy', () => {
  it('true só quando todas as regras passam', () => {
    assert.equal(passwordMeetsPolicy('Abc12#xy'), true)
    assert.equal(passwordMeetsPolicy('abc12#xy'), false) // sem maiúscula
    assert.equal(passwordMeetsPolicy('Abcdefxy'), false) // sem número/símbolo
    assert.equal(passwordMeetsPolicy('Ab1#'), false) // curta
  })
})
