/**
 * US1 (não-regressão) — criar contrato SEM documento continua nascendo Pendente.
 * Caracteriza o corpo do POST /contracts do BFF: mode='Pending' e ausência de signedAt/documento.
 * Protege contra regressão acidental no fluxo do tech lead ao adicionar o anexo (feature 017).
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { createCoreApiContractsClient } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'
import type { CreateContractInput } from '#modules/contracts/server/domain/contracts.types.ts'

const BASE = 'http://core/api/v2'
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const input: CreateContractInput = {
  title: 'Contrato T',
  objective: 'Objetivo',
  originalValueCents: 100_000,
  originalPeriod: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
  classification: 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
  supplierId: '1fda7559-9988-4dad-8c5f-bc18ccb02fab',
}

describe('US1 — create nasce Pendente (sem documento/assinatura)', () => {
  it('POST /contracts envia mode=Pending e NÃO envia signedAt', async () => {
    let capturedBody: string | null = null
    globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const body = init?.body
      capturedBody = typeof body === 'string' ? body : null
      return Promise.resolve(
        new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }),
      )
    }) as typeof globalThis.fetch

    await createCoreApiContractsClient(BASE).create(input, 'tok')

    if (capturedBody === null) throw new Error('corpo da requisição não capturado')
    const parsed = JSON.parse(capturedBody) as Record<string, unknown>
    assert.equal(parsed.mode, 'Pending')
    assert.equal('signedAt' in parsed, false)
  })
})
