/**
 * Testes de `parseErrorEnvelope` — parser do envelope de erro real do core-api.
 * Contrato: { error: { code: string; message: string; requestId: string } }.
 * Fonte: specs/001-v2-foundation/contracts/error-envelope.md (core-api errors.ts:19-35).
 * TDD: escrito ANTES da implementação (deve falhar por módulo ausente).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseErrorEnvelope } from '../../../src/shared/http/error-envelope.ts'

describe('parseErrorEnvelope — envelope válido', () => {
  it('extrai code/message/requestId de um envelope completo', () => {
    const body = { error: { code: 'invalid-credentials', message: 'invalid-credentials', requestId: 'req-123' } }

    const parsed = parseErrorEnvelope(body)

    assert.notEqual(parsed, null)
    assert.equal(parsed?.error.code, 'invalid-credentials')
    assert.equal(parsed?.error.message, 'invalid-credentials')
    assert.equal(parsed?.error.requestId, 'req-123')
  })
})

describe('parseErrorEnvelope — entradas inválidas retornam null (sem throw)', () => {
  it('null → null', () => {
    assert.equal(parseErrorEnvelope(null), null)
  })

  it('string → null', () => {
    assert.equal(parseErrorEnvelope('boom'), null)
  })

  it('objeto sem chave error → null', () => {
    assert.equal(parseErrorEnvelope({ foo: 'bar' }), null)
  })

  it('error sem code → null', () => {
    assert.equal(parseErrorEnvelope({ error: { message: 'x', requestId: 'r' } }), null)
  })

  it('error com campos de tipo errado → null', () => {
    assert.equal(parseErrorEnvelope({ error: { code: 1, message: 'x', requestId: 'r' } }), null)
  })

  it('error parcial (sem requestId) → null', () => {
    assert.equal(parseErrorEnvelope({ error: { code: 'c', message: 'm' } }), null)
  })
})
