/**
 * CAS-40 (CAS-43/CAS-44) — os filtros do grid de Contas a Pagar chegam ao core-api e o export enxerga o
 * conjunto COMPLETO. Puro (node:test), com o `fetch` global trocado por um gravador de URLs.
 *
 * Por que existe: o filtro de Emissão aparecia habilitado na tela, mas o schema da server fn descartava
 * `issuedFrom/To` em silêncio (Zod tira chave desconhecida) e o adapter nem montava o param. Grid, chips e
 * CSV traziam títulos fora do período escolhido. E o chip Rascunho exportava só a página visível.
 *
 * Import relativo (os #alias da fonte resolvem via package.json "imports").
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { createCoreApiFinancialClient } from '../../../../../../src/modules/financial/server/adapters/core-api/core-api-financial.ts'
import {
  ListDocumentsInputSchema,
  ListPayableTitlesInputSchema,
  PayableCountsInputSchema,
} from '../../../../../../src/modules/financial/server/adapters/financial.io-schemas.ts'

const BASE = 'http://core-api.test/api/v2/financial'
const ISSUED = { issuedFrom: '2026-01-01', issuedTo: '2026-01-31' } as const

type Responder = (url: URL) => unknown

let calls: URL[] = []
let respond: Responder = () => ({ items: [], page: 1, pageSize: 100, total: 0 })
const realFetch = globalThis.fetch

beforeEach(() => {
  calls = []
  globalThis.fetch = (input: string | URL | Request): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    calls.push(url)
    return Promise.resolve(new Response(JSON.stringify(respond(url)), { status: 200 }))
  }
})

afterEach(() => {
  globalThis.fetch = realFetch
  respond = () => ({ items: [], page: 1, pageSize: 100, total: 0 })
})

const draftDoc = (id: string): unknown => ({
  id,
  status: 'Draft',
  documentNumber: id,
  type: 'NFS-e',
  supplierRef: null,
  netValueCents: '100',
  dueDate: '2026-01-10',
  issueDate: '2026-01-05',
  series: null,
  grossValueCents: '100',
  paymentMethod: 'PIX',
  contractRef: null,
  version: 0,
})

describe('CAS-43 — Emissão chega ao /payable-titles e ao /counts', () => {
  const client = createCoreApiFinancialClient(BASE)

  it('listAllPayableTitles envia issuedFrom/issuedTo', async () => {
    await client.listAllPayableTitles({ ...ISSUED, page: 1, pageSize: 100 }, 'tk')
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.pathname, '/api/v2/financial/payable-titles')
    assert.equal(calls[0]?.searchParams.get('issuedFrom'), '2026-01-01')
    assert.equal(calls[0]?.searchParams.get('issuedTo'), '2026-01-31')
  })

  it('listPayableTitles (paginada) envia issuedFrom/issuedTo', async () => {
    await client.listPayableTitles({ ...ISSUED, page: 1, pageSize: 20 }, 'tk')
    assert.equal(calls[0]?.searchParams.get('issuedFrom'), '2026-01-01')
    assert.equal(calls[0]?.searchParams.get('issuedTo'), '2026-01-31')
  })

  it('getPayableCounts envia o mesmo recorte — os chips batem com a lista', async () => {
    respond = () => ({ total: 0, draft: 0, byStatus: {} })
    await client.getPayableCounts(ISSUED, 'tk')
    assert.equal(calls[0]?.pathname, '/api/v2/financial/payable-titles/counts')
    assert.equal(calls[0]?.searchParams.get('issuedFrom'), '2026-01-01')
    assert.equal(calls[0]?.searchParams.get('issuedTo'), '2026-01-31')
  })

  it('cada extremo vai sozinho; sem filtro, nenhum dos dois aparece', async () => {
    await client.listAllPayableTitles({ issuedFrom: '2026-01-01', page: 1, pageSize: 100 }, 'tk')
    await client.listAllPayableTitles({ page: 1, pageSize: 100 }, 'tk')
    assert.equal(calls[0]?.searchParams.get('issuedFrom'), '2026-01-01')
    assert.equal(calls[0]?.searchParams.has('issuedTo'), false)
    assert.equal(calls[1]?.searchParams.has('issuedFrom'), false)
    assert.equal(calls[1]?.searchParams.has('issuedTo'), false)
  })
})

describe('CAS-43 — o schema da server fn NÃO descarta a Emissão', () => {
  it('ListPayableTitlesInputSchema preserva issuedFrom/issuedTo', () => {
    const r = ListPayableTitlesInputSchema.safeParse(ISSUED)
    assert.equal(r.success, true)
    assert.equal(r.data?.issuedFrom, '2026-01-01')
    assert.equal(r.data?.issuedTo, '2026-01-31')
  })

  it('PayableCountsInputSchema preserva issuedFrom/issuedTo', () => {
    const r = PayableCountsInputSchema.safeParse(ISSUED)
    assert.equal(r.success, true)
    assert.equal(r.data?.issuedFrom, '2026-01-01')
    assert.equal(r.data?.issuedTo, '2026-01-31')
  })

  it('data fora de YYYY-MM-DD é recusada na borda', () => {
    assert.equal(ListPayableTitlesInputSchema.safeParse({ issuedFrom: '01/01/2026' }).success, false)
    assert.equal(PayableCountsInputSchema.safeParse({ issuedTo: '2026-1-31' }).success, false)
  })
})

describe('CAS-43/44 — listAllDocuments: TODOS os rascunhos do filtro, não a página', () => {
  const client = createCoreApiFinancialClient(BASE)

  it('varre todas as páginas de /documents com o filtro inteiro e devolve o conjunto', async () => {
    // 250 rascunhos → 3 páginas de 100 no core-api.
    respond = (url) => {
      const page = Number(url.searchParams.get('page'))
      const size = page < 3 ? 100 : 50
      return {
        items: Array.from({ length: size }, (_, i) => draftDoc(`p${String(page)}-${String(i)}`)),
        page,
        pageSize: 100,
        total: 250,
      }
    }
    const input = ListDocumentsInputSchema.parse({
      status: 'Rascunho',
      supplierRef: '7f1c1f5e-8a64-4c63-9a4b-0d5f1c2a3b4c',
      dueFrom: '2026-01-01',
      dueTo: '2026-02-28',
      ...ISSUED,
    })
    const r = await client.listAllDocuments(input, 'tk')

    assert.equal(r.ok, true)
    if (!r.ok) return
    assert.equal(r.value.items.length, 250)
    assert.equal(r.value.total, 250)
    assert.deepEqual(
      calls.map((u) => u.searchParams.get('page')),
      ['1', '2', '3'],
    )
    for (const u of calls) {
      assert.equal(u.pathname, '/api/v2/financial/documents')
      assert.equal(u.searchParams.get('status'), 'Draft')
      assert.equal(u.searchParams.get('pageSize'), '100')
      assert.equal(u.searchParams.get('supplierRef'), '7f1c1f5e-8a64-4c63-9a4b-0d5f1c2a3b4c')
      assert.equal(u.searchParams.get('dueFrom'), '2026-01-01')
      assert.equal(u.searchParams.get('issuedTo'), '2026-01-31')
    }
  })

  it('erro numa página do meio vira erro-valor (nunca um conjunto parcial silencioso)', async () => {
    let n = 0
    globalThis.fetch = (): Promise<Response> => {
      n++
      if (n === 2) return Promise.resolve(new Response('{}', { status: 500 }))
      return Promise.resolve(
        new Response(JSON.stringify({ items: [draftDoc('a')], page: 1, pageSize: 100, total: 250 }), {
          status: 200,
        }),
      )
    }
    const r = await client.listAllDocuments({ status: 'Rascunho', page: 1, pageSize: 100 }, 'tk')
    assert.equal(r.ok, false)
  })
})
