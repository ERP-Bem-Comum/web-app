/**
 * decode-access-exp — lê `exp` do JWT por DECODE (sem verificar assinatura — R1). Retorna epoch ms ou null.
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { decodeAccessExp } from '../../../../../src/modules/auth/server/adapters/decode-access-exp.ts'

const makeJwt = (payload: object): string => {
  const b64 = (o: object): string => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b64({ alg: 'ES256' })}.${b64(payload)}.sig-ignored`
}

describe('decodeAccessExp', () => {
  it('retorna exp em ms (exp do JWT é em segundos)', () => {
    assert.equal(decodeAccessExp(makeJwt({ sub: 'u', exp: 1_700 })), 1_700_000)
  })
  it('token malformado → null', () => {
    assert.equal(decodeAccessExp('not-a-jwt'), null)
  })
  it('payload sem exp → null', () => {
    assert.equal(decodeAccessExp(makeJwt({ sub: 'u' })), null)
  })
})
