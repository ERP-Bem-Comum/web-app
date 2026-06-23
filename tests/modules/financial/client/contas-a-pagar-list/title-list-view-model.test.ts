/**
 * deriveTitleListState (#201) — listagem por TÍTULO reusa o mesmo GridRow/ListState do grid de documentos.
 * PURO (node:test, imports relativos). Cobre o mapeamento título→linha + as lacunas honestas (emissão/forma
 * "—", valor nas colunas de valor, version 0).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { deriveTitleListState } from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { ok } from '../../../../../src/shared/primitives/result.ts'
import type {
  PayableTitleItem,
  PayableTitleListResponse,
} from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const item: PayableTitleItem = {
  payableId: 'p1',
  documentId: 'd1',
  documentNumber: 'NF-1',
  series: '1',
  type: 'NFS-e',
  kind: 'Parent',
  retentionType: null,
  valueCents: '15000',
  dueDate: '2026-07-10',
  status: 'Aberto',
  supplierRef: 's1',
  contractRef: null,
}
const resp: PayableTitleListResponse = { items: [item], page: 1, pageSize: 20, total: 1 }

describe('deriveTitleListState (#201)', () => {
  it('mapeia título → GridRow: id=payableId, valor nas colunas de valor, lacunas honestas', () => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok(resp),
      resolveSupplier: (ref) => (ref === 's1' ? 'Fornecedor X' : '—'),
    })
    assert.equal(st.tag, 'ready')
    if (st.tag === 'ready') {
      const r = st.rows[0]
      assert.equal(r?.id, 'p1') // seleção/checkbox por título
      assert.equal(r?.supplier, 'Fornecedor X')
      assert.equal(r?.due, '10/07/2026')
      assert.equal(r?.grossCents, '15000')
      assert.equal(r?.netCents, '15000')
      assert.equal(r?.emissao, '—') // gap: /payable-titles não traz emissão
      assert.equal(r?.paymentMethod, null) // gap: nem forma de pagamento
      assert.equal(r?.version, 0) // gap: sem version → ações por título desabilitadas
      assert.equal(st.page.total, 1)
    }
  })
  it('dueDate ISO datetime → DD/MM/YYYY (corta o horário)', () => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok({ ...resp, items: [{ ...item, dueDate: '2026-06-15T00:00:00.000Z' }] }),
      resolveSupplier: () => '—',
    })
    if (st.tag === 'ready') assert.equal(st.rows[0]?.due, '15/06/2026')
  })
  it('lista vazia → empty; loading → loading', () => {
    assert.equal(
      deriveTitleListState({
        isLoading: false,
        data: ok({ ...resp, items: [], total: 0 }),
        resolveSupplier: () => '—',
      }).tag,
      'empty',
    )
    assert.equal(
      deriveTitleListState({ isLoading: true, data: undefined, resolveSupplier: () => '—' }).tag,
      'loading',
    )
  })
})
