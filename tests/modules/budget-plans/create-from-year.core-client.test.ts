/**
 * Spec 134 (core-api#1092) — "Criar a partir do ano de" no BFF. Caracteriza o cliente do core-api:
 *   1. `importFromYear` vai no corpo do `POST /budget-plans` SÓ quando informado (sem ele, o plano nasce vazio);
 *   2. os 409/422 novos saem pelo SLUG (`error.code`) — por status, o 409 de "origem sem plano aprovado" diria
 *      "já existe plano para esse ano e programa", que é a mensagem errada;
 *   3. os anos de origem vêm do `GET ?status=APROVADO&programRef=`, distintos e do mais recente ao mais antigo.
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { isErr, isOk } from '#shared/primitives/result.ts'
import { createBudgetPlansCoreClient } from '#modules/budget-plans/server/adapters/core-api/core-api-budget-plans.ts'
import { createListImportSourceYears } from '#modules/budget-plans/server/application/list-import-source-years.use-case.ts'

const BASE = 'http://core/api/v2/budget-plans'
const PROGRAM = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const urlOf = (url: string | URL | Request): string =>
  typeof url === 'string' ? url : url instanceof URL ? url.href : url.url

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const CREATED = {
  id: '0b6f1c1e-2f4a-4c5b-9d7e-8f9a0b1c2d3e',
  year: 2027,
  programRef: PROGRAM,
  status: 'RASCUNHO',
  version: '1.0',
  totalInCents: 235_000,
}

const captureCreateBody = async (command: {
  year: number
  programRef: string
  importFromYear?: number
}): Promise<Record<string, unknown>> => {
  let captured: string | null = null
  globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    captured = typeof init?.body === 'string' ? init.body : null
    return Promise.resolve(json(201, CREATED))
  }) as typeof globalThis.fetch
  await createBudgetPlansCoreClient(BASE).createBudgetPlan(command, 'tok')
  if (captured === null) throw new Error('corpo da requisição não capturado')
  return JSON.parse(captured) as Record<string, unknown>
}

const createFailingWith = async (status: number, body: unknown) => {
  globalThis.fetch = (() => Promise.resolve(json(status, body))) as typeof globalThis.fetch
  return createBudgetPlansCoreClient(BASE).createBudgetPlan({ year: 2027, programRef: PROGRAM }, 'tok')
}

const envelope = (code: string) => ({ error: { code, message: code, requestId: 'req-1' } })

describe('POST /budget-plans — corpo (spec 134)', () => {
  it('com importFromYear → vai no corpo', async () => {
    const body = await captureCreateBody({ year: 2027, programRef: PROGRAM, importFromYear: 2026 })
    assert.deepEqual(body, { year: 2027, programRef: PROGRAM, importFromYear: 2026 })
  })

  it('sem importFromYear → a chave NÃO vai (plano nasce vazio, como antes)', async () => {
    const body = await captureCreateBody({ year: 2027, programRef: PROGRAM })
    assert.deepEqual(body, { year: 2027, programRef: PROGRAM })
  })
})

describe('POST /budget-plans — erros pelo slug (spec 134)', () => {
  const cases: readonly (readonly [number, string, string])[] = [
    [409, 'budget-plan-import-source-not-approved', 'budget-plan-import-source-not-approved'],
    [409, 'budget-result-orphan-subcategory', 'budget-result-orphan-subcategory'],
    [422, 'budget-plan-import-same-year', 'budget-plan-import-same-year'],
    [409, 'budget-plan-already-exists', 'budget-plan-already-exists'],
  ]
  for (const [status, slug, expected] of cases) {
    it(`${String(status)} ${slug} → ${expected}`, async () => {
      const r = await createFailingWith(status, envelope(slug))
      assert.ok(isErr(r))
      assert.equal(r.error, expected)
    })
  }

  it('409 sem envelope (core antigo) → cai no mapa por status: já existe', async () => {
    const r = await createFailingWith(409, {})
    assert.ok(isErr(r))
    assert.equal(r.error, 'budget-plan-already-exists')
  })

  it('503 da cópia (plan-clone-write-unavailable) → inesperado ("tente novamente" é o conselho certo)', async () => {
    const r = await createFailingWith(503, envelope('plan-clone-write-unavailable'))
    assert.ok(isErr(r))
    assert.equal(r.error, 'unexpected')
  })

  it('403 continua sem permissão, mesmo com slug no corpo', async () => {
    const r = await createFailingWith(403, envelope('budget-plan-import-source-not-approved'))
    assert.ok(isErr(r))
    assert.equal(r.error, 'forbidden')
  })
})

const listItem = (year: number) => ({
  id: '0b6f1c1e-2f4a-4c5b-9d7e-8f9a0b1c2d3e',
  year,
  status: 'APROVADO',
  version: '1.0',
  programRef: PROGRAM,
  programName: 'Programa',
  totalInCents: 0,
  updatedAt: '2026-11-01T00:00:00.000Z',
  updatedByRef: null,
  partnersCount: 0,
  networkKind: null,
})

describe('anos de origem — GET ?status=APROVADO&programRef= (spec 134)', () => {
  it('filtra por APROVADO + programa e devolve anos distintos, mais recente primeiro', async () => {
    const urls: string[] = []
    globalThis.fetch = ((url: string | URL | Request): Promise<Response> => {
      urls.push(urlOf(url))
      // 2025 aparece duas vezes: o original e a calibração aprovada do mesmo ano.
      return Promise.resolve(json(200, { items: [2024, 2025, 2025, 2026].map(listItem), total: 4 }))
    }) as typeof globalThis.fetch

    const listYears = createListImportSourceYears({ client: createBudgetPlansCoreClient(BASE) })
    const r = await listYears(PROGRAM, 'tok')

    assert.ok(isOk(r))
    assert.deepEqual(r.value, [2026, 2025, 2024])
    assert.equal(urls.length, 1)
    const q = new URL(urls[0] ?? '').searchParams
    assert.equal(q.get('status'), 'APROVADO')
    assert.equal(q.get('programRef'), PROGRAM)
  })

  it('pagina até o total — não trunca em silêncio na 1ª página', async () => {
    const pages: string[] = []
    globalThis.fetch = ((url: string | URL | Request): Promise<Response> => {
      const page = new URL(urlOf(url)).searchParams.get('page') ?? '1'
      pages.push(page)
      const items = page === '1' ? Array.from({ length: 100 }, () => listItem(2025)) : [listItem(2019)]
      return Promise.resolve(json(200, { items, total: 101 }))
    }) as typeof globalThis.fetch

    const r = await createBudgetPlansCoreClient(BASE).listApprovedPlanYears(PROGRAM, 'tok')

    assert.ok(isOk(r))
    assert.deepEqual(pages, ['1', '2'])
    assert.ok(r.value.includes(2019))
  })

  it('403 → forbidden', async () => {
    globalThis.fetch = (() => Promise.resolve(json(403, envelope('forbidden')))) as typeof globalThis.fetch
    const r = await createBudgetPlansCoreClient(BASE).listApprovedPlanYears(PROGRAM, 'tok')
    assert.ok(isErr(r))
    assert.equal(r.error, 'forbidden')
  })
})
