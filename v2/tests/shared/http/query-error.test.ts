/**
 * Testes de `QueryError` — a ÚNICA subclasse de Error permitida (constituição §II).
 * Ponte entre Result/AppError e a API de erro do TanStack Query.
 * TDD: escrito ANTES da implementação.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type { AppError } from '../../../src/shared/http/app-error.types.ts'
import { QueryError, isQueryError } from '../../../src/shared/http/query-error.ts'

describe('QueryError', () => {
  it('carrega o AppError e é uma instância de Error', () => {
    const appError: AppError = { kind: 'auth:expired' }

    const e = new QueryError(appError)

    assert.ok(e instanceof Error)
    assert.equal(e.name, 'QueryError')
    assert.deepEqual(e.appError, { kind: 'auth:expired' })
  })

  it('a message inclui o kind do AppError', () => {
    const e = new QueryError({ kind: 'not-found' })

    assert.match(e.message, /not-found/)
  })
})

describe('isQueryError', () => {
  it('true para QueryError', () => {
    assert.equal(isQueryError(new QueryError({ kind: 'server' })), true)
  })

  it('false para Error comum', () => {
    assert.equal(isQueryError(new Error('boom')), false)
  })

  it('false para valores não-Error', () => {
    assert.equal(isQueryError(null), false)
    assert.equal(isQueryError({ appError: { kind: 'server' } }), false)
    assert.equal(isQueryError('QueryError'), false)
  })
})
