/**
 * Spec 119 / core-api#61 — PURO (node:test, imports relativos).
 *  - alvos de "Desfazer baixa" (só Pago), POR TÍTULO;
 *  - `hadUndoInHistory`: a guarda do "Voltar para edição" reconhece a baixa desfeita na trilha;
 *  - Histórico: rótulo dos eventos novos.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveTitleActionTargets,
  hadUndoInHistory,
  type GridRow,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { timelineEventPresentation } from '../../../../../src/modules/financial/client/contas-a-pagar-list/document-timeline.view-model.ts'
import type { DocumentStatus } from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const row = (id: string, documentId: string, status: DocumentStatus, pagamento = '—'): GridRow => ({
  id,
  documentId,
  type: 'NFS-e',
  documentNumber: `NF-${documentId}`,
  series: null,
  supplier: 'Fornecedor X',
  supplierKind: 'supplier',
  supplierDoc: null,
  contract: '—',
  paymentMethod: null,
  emissao: '—',
  pagamento,
  gross: '—',
  grossCents: null,
  due: '—',
  dueIso: null,
  net: '—',
  netCents: null,
  version: 3,
  status,
  isRetentionChild: false,
})

const rows: readonly GridRow[] = [
  row('p1', 'd1', 'Pago', '10/09/2026'),
  row('c1', 'd1', 'Pago', '12/09/2026'), // irmão do MESMO documento — alvo próprio, sem dedup
  row('p2', 'd2', 'Transmitido'),
  row('p3', 'd3', 'Conciliado'),
  row('p4', 'd4', 'Aprovado'),
]
const all = new Set(rows.map((r) => r.id))

describe('spec 119 — alvos dos desfazimentos', () => {
  it('Desfazer baixa: só títulos Pago, um alvo por título (irmãos do mesmo documento inclusive)', () => {
    const tg = deriveTitleActionTargets(rows, all)
    assert.deepEqual(
      tg.undoPayment.map((t) => t.payableId),
      ['p1', 'c1'],
    )
    assert.deepEqual(tg.undoPayment[0], {
      documentId: 'd1',
      payableId: 'p1',
      version: 3,
      documentNumber: 'NF-d1',
      supplier: 'Fornecedor X',
      pagamento: '10/09/2026',
    })
  })

  it('Conciliado fica fora do desfazer baixa (desfaz-se a conciliação antes)', () => {
    const tg = deriveTitleActionTargets(rows, new Set(['p3']))
    assert.equal(tg.undoPayment.length, 0)
  })

  it('seleção sem nenhum Pago → vazio (item desativado)', () => {
    const tg = deriveTitleActionTargets(rows, new Set(['p4']))
    assert.equal(tg.undoPayment.length, 0)
  })
})

describe('spec 119 — guarda do "Voltar para edição"', () => {
  it('baixa desfeita na trilha → alerta', () => {
    assert.equal(hadUndoInHistory(['DocumentSaved', 'ManualPaymentUndone']), true)
  })

  it('sem desfazimento (inclusive conciliação desfeita) → segue direto', () => {
    assert.equal(hadUndoInHistory(['DocumentSaved', 'PayableApproved', 'ReconciliationUndone']), false)
    assert.equal(hadUndoInHistory([]), false)
  })
})

describe('spec 119 — Histórico', () => {
  it('rótulos dos eventos novos', () => {
    assert.equal(
      timelineEventPresentation('ManualPaymentUndone').labelTag,
      'financial.timeline.event.paymentUndone',
    )
  })
})
