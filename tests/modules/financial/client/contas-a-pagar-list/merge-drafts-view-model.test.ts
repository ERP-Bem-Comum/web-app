/**
 * mergeDraftsIntoGrid (#201-fix) — rascunho (Draft) não gera títulos → invisível no grid title-centric.
 * A função troca a fonte do grid conforme o chip: 'rascunho' (só rascunhos, chip Rascunho) ou 'none'
 * (títulos intactos, Todos/demais). Rascunho fica FORA do Todos (são muitos/parciais → soterrariam os
 * títulos). PURO (node:test, imports relativos).
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
  isRetentionChild: false,
})

const page = { page: 1, pageSize: 12, total: 1, rangeLabel: '1–1 de 1', hasPrev: false, hasNext: false }
const drafts: ListState = { tag: 'ready', rows: [row('draft-1', 'Rascunho')], page }
const titles: ListState = { tag: 'ready', rows: [row('title-1', 'Aberto')], page }

describe('mergeDraftsIntoGrid', () => {
  it("'none' (Todos/demais chips) → devolve os títulos intactos, SEM rascunhos", () => {
    assert.deepEqual(mergeDraftsIntoGrid(drafts, titles, 'none'), titles)
  })

  it("'rascunho' (chip Rascunho) → a fonte é os rascunhos", () => {
    assert.deepEqual(mergeDraftsIntoGrid(drafts, titles, 'rascunho'), drafts)
  })

  it("'none' com títulos vazios → segue vazio (rascunho NÃO vaza pro Todos)", () => {
    const emptyTitles: ListState = { tag: 'empty' }
    assert.deepEqual(mergeDraftsIntoGrid(drafts, emptyTitles, 'none'), emptyTitles)
  })
})
