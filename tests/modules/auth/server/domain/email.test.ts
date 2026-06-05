/**
 * Email VO (smart constructor) — estado inválido irrepresentável (§IV).
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { Email } from '#modules/auth/server/domain/value-objects/email.value-object.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

describe('Email', () => {
  it('vazio → err(empty)', () => {
    const r = Email('   ')
    assert.equal(isErr(r) && r.error === 'empty', true)
  })

  it('formato inválido → err(invalid-format)', () => {
    const r = Email('notanemail')
    assert.equal(isErr(r) && r.error === 'invalid-format', true)
  })

  it('válido → ok(normalizado)', () => {
    const r = Email('  Admin@BemComum.dev ')
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value, 'admin@bemcomum.dev')
  })
})
