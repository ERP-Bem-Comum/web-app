/**
 * mergeDraftsIntoGrid (#201-fix) — rascunho (Draft) não gera títulos → invisível no grid title-centric.
 * A função mescla os documentos Draft (deriveListState) no ListState de títulos conforme o chip:
 * 'rascunho' (só rascunhos), 'todos' (rascunhos no topo, 1ª página), 'none' (títulos intactos).
 * PURO (node:test, imports relativos).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mergeDraftsIntoGrid,
  type GridRow,
  type ListState,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'

const row = (id: string, status: GridRow['status']): GridRow => ({
  id,
  documentId: id,
  type: 'NFS-e',
  documentNumber: id,
  series: null,
  supplier: 'Fornecedor',
  supplierKind: null,
  supplierDoc: null,
  contract: '—',
  paymentMethod: 'Boleto',
  emissao: '—',
  pagamento: '—',
  gross: 'R$ 10,00',
  grossCents: '1000',
  due: '10/07/2026',
  net: 'R$ 10,00',
  netCents: '1000',
  version: 0,
  status,
})

const page = { page: 1, pageSize: 12, total: 1, rangeLabel: '1–1 de 1', hasPrev: false, hasNext: false }
const drafts: ListState = { tag: 'ready', rows: [row('draft-1', 'Rascunho')], page }
const titles: ListState = { tag: 'ready', rows: [row('title-1', 'Aberto')], page }

describe('mergeDraftsIntoGrid', () => {
  it("'none' → devolve os títulos intactos (ignora rascunhos)", () => {
    assert.deepEqual(mergeDraftsIntoGrid(drafts, titles, 'none'), titles)
  })

  it("'rascunho' → a fonte é SÓ os rascunhos", () => {
    assert.deepEqual(mergeDraftsIntoGrid(drafts, titles, 'rascunho'), drafts)
  })

  it("'todos' → prepende os rascunhos ao topo dos títulos", () => {
    const merged = mergeDraftsIntoGrid(drafts, titles, 'todos')
    assert.equal(merged.tag, 'ready')
    if (merged.tag !== 'ready') return
    assert.deepEqual(
      merged.rows.map((r) => r.id),
      ['draft-1', 'title-1'],
    )
  })

  it("'todos' sem rascunhos → títulos intactos", () => {
    const noDrafts: ListState = { tag: 'empty' }
    assert.deepEqual(mergeDraftsIntoGrid(noDrafts, titles, 'todos'), titles)
  })

  it("'todos' com rascunhos mas títulos vazios → mostra os rascunhos", () => {
    const emptyTitles: ListState = { tag: 'empty' }
    assert.deepEqual(mergeDraftsIntoGrid(drafts, emptyTitles, 'todos'), drafts)
  })
})
