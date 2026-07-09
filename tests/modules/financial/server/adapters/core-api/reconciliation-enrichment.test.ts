/**
 * INTERINO BFF composite p/ core-api#172/#265 — enriquecimento da Conciliação (puro, node:test).
 * Cobre: montagem dos 2 mapas a partir de páginas, fallback null (payableId/supplierRef não resolvidos),
 * degradação best-effort (título/fornecedor falha → base com null), e a prova de NO-N+1 (nº de leituras
 * CONSTANTE independentemente da quantidade de linhas — contador nos fetchers injetados).
 * Imports relativos (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEnrichmentMaps,
  enrichPaidPayables,
  enrichReconciliationItems,
  enrichSuggestions,
  enrichTransactionReconciliation,
  type EnrichmentSource,
  type PartnerNameItem,
} from '../../../../../../src/modules/financial/server/adapters/core-api/reconciliation-enrichment.ts'
import { ok, err } from '../../../../../../src/shared/primitives/result.ts'
import type { PayableTitleListResponse } from '../../../../../../src/modules/financial/server/domain/document.io.ts'
import type {
  MatchSuggestion,
  PaidPayable,
  TransactionReconciliation,
  TransactionReconciliationItem,
} from '../../../../../../src/modules/financial/server/domain/reconciliation.io.ts'

// ── fixtures ──────────────────────────────────────────────────────────────────
const titlePage = (
  items: readonly {
    payableId: string
    documentNumber: string | null
    supplierRef: string | null
    paidAt: string | null
  }[],
  total: number,
  page = 1,
): PayableTitleListResponse => ({
  items: items.map((i) => ({
    payableId: i.payableId,
    documentId: `doc-${i.payableId}`,
    documentNumber: i.documentNumber,
    series: null,
    type: null,
    kind: 'Parent',
    retentionType: null,
    valueCents: '1000',
    dueDate: '2026-01-10',
    status: 'Pago',
    supplierRef: i.supplierRef,
    contractRef: null,
    paidAt: i.paidAt,
    issueDate: null,
    paymentMethod: null,
    version: 0,
    grossValueCents: null,
    netValueCents: null,
  })),
  page,
  pageSize: 100,
  total,
})

const paidPayable = (id: string): PaidPayable => ({
  id,
  documentId: `doc-${id}`,
  valueCents: '1000',
  dueDate: '2026-01-10',
  issueDate: null,
  paidAt: null,
  paymentMethod: 'boleto',
  supplierName: null,
  documentNumber: null,
  category: null,
  documentType: null,
})

const suggestion = (payableId: string): MatchSuggestion => ({
  payableId,
  score: 80,
  band: 'alta',
  criteria: { payeeMatch: true, exactValue: true, dateD0: true, memoRef: false, supplierOpenCount: 1 },
  criteriaBreakdown: [],
  supplierName: null,
  documentNumber: null,
})

// Item do lookup da conciliação (cru: só payableId + valor; os 3 campos saem null até o enrichment).
const reconItem = (payableId: string): TransactionReconciliationItem => ({
  payableId,
  reconciledValueCents: '1000',
  documentNumber: null,
  supplierName: null,
  dueDate: null,
  retentionType: null,
})

// Detalhe completo da conciliação (wrapper) — usa os itens crus.
const txRecon = (items: readonly TransactionReconciliationItem[]): TransactionReconciliation => ({
  reconciliationId: 'rec-1',
  transactionId: 'tx-1',
  type: 'Individual',
  status: 'Active',
  reconciledBy: 'user-1',
  reconciledByName: null,
  reconciledAt: '2026-01-10T12:00:00Z',
  differenceCents: null,
  items,
})

// Fonte com CONTADOR de leituras (prova no-N+1). Aceita várias páginas de títulos e de parceiros.
const countingSource = (
  titlePages: readonly PayableTitleListResponse[],
  partners: readonly PartnerNameItem[],
): { source: EnrichmentSource; counts: { titles: number; partners: number } } => {
  const counts = { titles: 0, partners: 0 }
  const source: EnrichmentSource = {
    fetchTitles: () => {
      counts.titles += 1
      return Promise.resolve(ok(titlePages))
    },
    fetchPartners: () => {
      counts.partners += 1
      return Promise.resolve(ok(partners))
    },
  }
  return { source, counts }
}

describe('buildEnrichmentMaps (#172/#265)', () => {
  it('monta os 2 mapas a partir de MÚLTIPLAS páginas de títulos', async () => {
    const pages = [
      titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 's1', paidAt: '2026-01-05' }], 2, 1),
      titlePage([{ payableId: 'p2', documentNumber: 'NF-2', supplierRef: 's2', paidAt: '2026-01-06' }], 2, 2),
    ]
    const { source } = countingSource(pages, [
      { id: 's1', name: 'ACME' },
      { id: 's2', name: 'Globex' },
    ])
    const maps = await buildEnrichmentMaps(source)
    assert.equal(maps.titles.get('p1')?.documentNumber, 'NF-1')
    assert.equal(maps.titles.get('p2')?.supplierRef, 's2')
    assert.equal(maps.partners.get('s1'), 'ACME')
    assert.equal(maps.partners.get('s2'), 'Globex')
  })

  it('best-effort: falha ao buscar títulos → mapa de títulos VAZIO (não lança, não erra)', async () => {
    const source: EnrichmentSource = {
      fetchTitles: () => Promise.resolve(err('server')),
      fetchPartners: () => Promise.resolve(ok([{ id: 's1', name: 'ACME' }])),
    }
    const maps = await buildEnrichmentMaps(source)
    assert.equal(maps.titles.size, 0)
    assert.equal(maps.partners.get('s1'), 'ACME')
  })

  it('best-effort: falha ao buscar parceiros → mapa de parceiros VAZIO', async () => {
    const source: EnrichmentSource = {
      fetchTitles: () =>
        Promise.resolve(
          ok([titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 's1', paidAt: null }], 1)]),
        ),
      fetchPartners: () => Promise.resolve(err('connectivity')),
    }
    const maps = await buildEnrichmentMaps(source)
    assert.equal(maps.titles.get('p1')?.documentNumber, 'NF-1')
    assert.equal(maps.partners.size, 0)
  })
})

describe('enrichPaidPayables (#172/#265) — JOIN paid-payable.id ↔ payable-title.payableId', () => {
  it('preenche paidAt + documentNumber do título e supplierName via supplierRef', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 's1', paidAt: '2026-01-05' }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [row] = enrichPaidPayables(maps, [paidPayable('p1')])
    assert.equal(row?.paidAt, '2026-01-05')
    assert.equal(row?.documentNumber, 'NF-1')
    assert.equal(row?.supplierName, 'ACME')
  })

  it('null fallback: payableId sem título → paidAt/documentNumber/supplierName ficam null', async () => {
    const { source } = countingSource(
      [
        titlePage(
          [{ payableId: 'other', documentNumber: 'NF-9', supplierRef: 's1', paidAt: '2026-01-05' }],
          1,
        ),
      ],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [row] = enrichPaidPayables(maps, [paidPayable('p1')])
    assert.equal(row?.paidAt, null)
    assert.equal(row?.documentNumber, null)
    assert.equal(row?.supplierName, null)
  })

  it('null fallback: supplierRef sem fornecedor no mapa → supplierName null (mas documentNumber resolve)', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 'sX', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [row] = enrichPaidPayables(maps, [paidPayable('p1')])
    assert.equal(row?.documentNumber, 'NF-1')
    assert.equal(row?.supplierName, null)
  })

  it('degradação: ambas as fontes falham → base com nulls (não quebra a lista)', async () => {
    const source: EnrichmentSource = {
      fetchTitles: () => Promise.resolve(err('server')),
      fetchPartners: () => Promise.resolve(err('server')),
    }
    const maps = await buildEnrichmentMaps(source)
    const rows = enrichPaidPayables(maps, [paidPayable('p1'), paidPayable('p2')])
    assert.equal(rows.length, 2)
    for (const r of rows) {
      assert.equal(r.paidAt, null)
      assert.equal(r.documentNumber, null)
      assert.equal(r.supplierName, null)
    }
  })

  it('NO-N+1: o nº de leituras é CONSTANTE (1 títulos + 1 fornecedores) p/ 1 ou 1000 linhas', async () => {
    const titles = Array.from({ length: 1000 }, (_, i) => ({
      payableId: `p${String(i)}`,
      documentNumber: `NF-${String(i)}`,
      supplierRef: 's1',
      paidAt: '2026-01-05',
    }))
    const { source, counts } = countingSource([titlePage(titles, 1000)], [{ id: 's1', name: 'ACME' }])
    const maps = await buildEnrichmentMaps(source)
    const rows = enrichPaidPayables(
      maps,
      Array.from({ length: 1000 }, (_, i) => paidPayable(`p${String(i)}`)),
    )
    assert.equal(rows.length, 1000)
    assert.equal(rows[0]?.supplierName, 'ACME')
    // A costura leu CADA fonte exatamente UMA vez — sem fetch por linha.
    assert.equal(counts.titles, 1)
    assert.equal(counts.partners, 1)
  })
})

describe('enrichSuggestions (#172) — resolve por payableId com os MESMOS mapas', () => {
  it('resolve supplierName + documentNumber do palpite via payableId', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 's1', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [s] = enrichSuggestions(maps, [suggestion('p1')])
    assert.equal(s?.supplierName, 'ACME')
    assert.equal(s?.documentNumber, 'NF-1')
  })

  it('null fallback: palpite sem título correspondente → campos null', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'other', documentNumber: 'NF-9', supplierRef: 's1', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [s] = enrichSuggestions(maps, [suggestion('p1')])
    assert.equal(s?.supplierName, null)
    assert.equal(s?.documentNumber, null)
  })

  it('NO-N+1: leituras constantes p/ N palpites', async () => {
    const titles = Array.from({ length: 500 }, (_, i) => ({
      payableId: `p${String(i)}`,
      documentNumber: `NF-${String(i)}`,
      supplierRef: 's1',
      paidAt: null,
    }))
    const { source, counts } = countingSource([titlePage(titles, 500)], [{ id: 's1', name: 'ACME' }])
    const maps = await buildEnrichmentMaps(source)
    const out = enrichSuggestions(
      maps,
      Array.from({ length: 500 }, (_, i) => suggestion(`p${String(i)}`)),
    )
    assert.equal(out.length, 500)
    assert.equal(counts.titles, 1)
    assert.equal(counts.partners, 1)
  })
})

describe('enrichTransactionReconciliation / enrichReconciliationItems (#172)', () => {
  it('JOIN por payableId: item herda documentNumber + supplierName + dueDate dos mapas', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 's1', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const detail = enrichTransactionReconciliation(maps, txRecon([reconItem('p1')]))
    const [item] = detail.items
    assert.equal(item?.documentNumber, 'NF-1')
    assert.equal(item?.supplierName, 'ACME')
    assert.equal(item?.dueDate, '2026-01-10') // dueDate fixo no titlePage
  })

  it('null fallback: payableId sem título → documentNumber/dueDate/supplierName todos null', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'other', documentNumber: 'NF-9', supplierRef: 's1', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [item] = enrichReconciliationItems(maps, [reconItem('p1')])
    assert.equal(item?.documentNumber, null)
    assert.equal(item?.dueDate, null)
    assert.equal(item?.supplierName, null)
  })

  it('supplierRef presente mas parceiro ausente → supplierName null (documentNumber + dueDate resolvem)', async () => {
    const { source } = countingSource(
      [titlePage([{ payableId: 'p1', documentNumber: 'NF-1', supplierRef: 'sX', paidAt: null }], 1)],
      [{ id: 's1', name: 'ACME' }],
    )
    const maps = await buildEnrichmentMaps(source)
    const [item] = enrichReconciliationItems(maps, [reconItem('p1')])
    assert.equal(item?.documentNumber, 'NF-1')
    assert.equal(item?.dueDate, '2026-01-10')
    assert.equal(item?.supplierName, null)
  })

  it('NO-N+1: leituras constantes (1 títulos + 1 parceiros) p/ N itens', async () => {
    const titles = Array.from({ length: 500 }, (_, i) => ({
      payableId: `p${String(i)}`,
      documentNumber: `NF-${String(i)}`,
      supplierRef: 's1',
      paidAt: null,
    }))
    const { source, counts } = countingSource([titlePage(titles, 500)], [{ id: 's1', name: 'ACME' }])
    const maps = await buildEnrichmentMaps(source)
    const out = enrichReconciliationItems(
      maps,
      Array.from({ length: 500 }, (_, i) => reconItem(`p${String(i)}`)),
    )
    assert.equal(out.length, 500)
    assert.equal(out[0]?.supplierName, 'ACME')
    assert.equal(counts.titles, 1)
    assert.equal(counts.partners, 1)
  })
})
