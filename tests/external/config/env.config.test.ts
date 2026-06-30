/**
 * Testes de `parseEnv` — validação Zod fail-fast da config de ambiente (server-only).
 * Testa a função PURA (sem throw no import); o boot usa loadEnvOrThrow.
 * TDD: escrito ANTES da implementação.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseEnv } from '#external/config/env.config.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

describe('parseEnv — sucesso', () => {
  it('aceita CORE_API_URL como URL válida (com /api/v2)', () => {
    const r = parseEnv({ CORE_API_URL: 'http://localhost:3001/api/v2' })

    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.CORE_API_URL, 'http://localhost:3001/api/v2')
  })

  it('aceita CORE_API_URL com /api sem versão (coreApiBase deriva /api/v2)', () => {
    const r = parseEnv({ CORE_API_URL: 'https://erp-bem-comum-api.codebit.biz/api' })

    assert.equal(isOk(r), true)
  })
})

describe('parseEnv — falha (fail-fast)', () => {
  it('CORE_API_URL ausente → err', () => {
    const r = parseEnv({})

    assert.equal(isErr(r), true)
    if (isErr(r)) assert.ok(r.error.length > 0)
  })

  it('CORE_API_URL não-URL → err', () => {
    const r = parseEnv({ CORE_API_URL: 'not-a-url' })

    assert.equal(isErr(r), true)
  })

  it('CORE_API_URL sem /api (só host) → err — o incidente de 2026-06-25', () => {
    // Era URL válida, então passava no boot; mas coreApiBase derivava `{host}/v2` → /auth/* dava 404 → "server".
    const r = parseEnv({ CORE_API_URL: 'https://erp-bem-comum-api.codebit.biz' })

    assert.equal(isErr(r), true)
    if (isErr(r)) assert.ok(r.error.some((e) => e.includes('/api')))
  })
})
