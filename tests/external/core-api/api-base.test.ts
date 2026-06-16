/**
 * Testes de `coreApiBase` — derivação de versão da base do core-api (ADR-0033). Lógica PURA (node:test).
 * Cobre a convenção nova (env version-less) E a antiga (env com `/api/v2`) — tolerância é o ponto.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { coreApiBase } from '#external/core-api/api-base.ts'

describe('coreApiBase — convenção nova (env version-less)', () => {
  it('anexa /v1 e /v2 a uma base sem versão', () => {
    assert.equal(coreApiBase('http://core-api:3000/api', 'v1'), 'http://core-api:3000/api/v1')
    assert.equal(coreApiBase('http://core-api:3000/api', 'v2'), 'http://core-api:3000/api/v2')
  })

  it('tolera barra final', () => {
    assert.equal(coreApiBase('http://core-api:3000/api/', 'v2'), 'http://core-api:3000/api/v2')
  })
})

describe('coreApiBase — compat com env legado (já contém /api/vN)', () => {
  it('normaliza /api/v2 e re-anexa a versão pedida (idêntico ao antigo derive*Base)', () => {
    assert.equal(coreApiBase('http://localhost:3001/api/v2', 'v1'), 'http://localhost:3001/api/v1')
    assert.equal(coreApiBase('http://localhost:3001/api/v2', 'v2'), 'http://localhost:3001/api/v2')
  })

  it('normaliza /api/v1 para a outra versão também', () => {
    assert.equal(coreApiBase('http://localhost:3001/api/v1', 'v2'), 'http://localhost:3001/api/v2')
  })
})
