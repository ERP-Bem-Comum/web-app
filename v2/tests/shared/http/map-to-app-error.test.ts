/**
 * Testes de `mapToAppError` — HttpError (transporte) → AppError (semântico p/ UI).
 * Discrimina por STATUS (slug do core-api é menos estável). issues vem [] do backend
 * (core-api não detalha validação; o BFF preenche). Guarda `never` no default.
 * Fonte: specs/001-v2-foundation/contracts/error-envelope.md.
 * TDD: escrito ANTES da implementação.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type { HttpError } from '#shared/http/http-error.types.ts'
import { mapToAppError } from '#shared/http/map-to-app-error.ts'

const http = (status: number, body: unknown = null): HttpError => ({ kind: 'http', status, body })

describe('mapToAppError — mapeamento por status HTTP', () => {
  it('401 → auth:expired', () => {
    assert.deepEqual(mapToAppError(http(401)), { kind: 'auth:expired' })
  })

  it('403 → auth:forbidden', () => {
    assert.deepEqual(mapToAppError(http(403)), { kind: 'auth:forbidden' })
  })

  it('404 → not-found', () => {
    assert.deepEqual(mapToAppError(http(404)), { kind: 'not-found' })
  })

  it('409 → conflict', () => {
    assert.deepEqual(mapToAppError(http(409)), { kind: 'conflict' })
  })

  it('400 → validation com issues [] (core-api não detalha)', () => {
    assert.deepEqual(mapToAppError(http(400)), { kind: 'validation', issues: [] })
  })

  it('500 → server', () => {
    assert.deepEqual(mapToAppError(http(500)), { kind: 'server' })
  })

  it('503 → server', () => {
    assert.deepEqual(mapToAppError(http(503)), { kind: 'server' })
  })

  it('418 (outro 4xx) → unknown com status', () => {
    assert.deepEqual(mapToAppError(http(418)), { kind: 'unknown', status: 418 })
  })
})

describe('mapToAppError — variantes de transporte', () => {
  it('network → connectivity', () => {
    assert.deepEqual(mapToAppError({ kind: 'network' }), { kind: 'connectivity' })
  })

  it('timeout → connectivity', () => {
    assert.deepEqual(mapToAppError({ kind: 'timeout' }), { kind: 'connectivity' })
  })

  it('parse → bad-gateway', () => {
    assert.deepEqual(mapToAppError({ kind: 'parse' }), { kind: 'bad-gateway' })
  })

  it('aborted → unknown', () => {
    assert.deepEqual(mapToAppError({ kind: 'aborted' }), { kind: 'unknown' })
  })
})
