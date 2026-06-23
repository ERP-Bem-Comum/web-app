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
// órgão arrecadador (igual ao drawer): ISS → SEFIN; demais → Receita Federal.
const dest = (rt: 'ISS' | 'IRRF' | 'INSS' | 'CSRF'): string =>
  rt === 'ISS' ? 'SEFIN (municipal)' : 'Receita Federal'

describe('deriveTitleListState (#201)', () => {
  it('PAI: id=payableId, documentId p/ drawer, valor nas colunas de valor, lacunas honestas', () => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok(resp),
      resolveSupplier: (ref) => (ref === 's1' ? 'Fornecedor X' : '—'),
      resolveDestino: dest,
    })
    assert.equal(st.tag, 'ready')
    if (st.tag === 'ready') {
      const r = st.rows[0]
      assert.equal(r?.id, 'p1') // seleção/checkbox por título
      assert.equal(r?.documentId, 'd1') // drawer abre por documento
      assert.equal(r?.type, 'NFS-e') // pai = tipo do documento
      assert.equal(r?.supplier, 'Fornecedor X')
      assert.equal(r?.due, '10/07/2026')
      assert.equal(r?.grossCents, '15000')
      assert.equal(r?.emissao, '—') // gap: /payable-titles não traz emissão
      assert.equal(r?.version, 0) // gap: sem version → ações por título desabilitadas
    }
  })
  it('FILHO: type = tipo do imposto; fornecedor = órgão arrecadador (igual ao drawer)', () => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok({
        ...resp,
        items: [
          { ...item, payableId: 'c1', kind: 'Child', retentionType: 'IRRF' },
          { ...item, payableId: 'c2', kind: 'Child', retentionType: 'ISS' },
        ],
        total: 2,
      }),
      resolveSupplier: () => 'Fornecedor X',
      resolveDestino: dest,
    })
    if (st.tag === 'ready') {
      assert.equal(st.rows[0]?.type, 'IRRF')
      assert.equal(st.rows[0]?.supplier, 'Receita Federal')
      assert.equal(st.rows[0]?.supplierDoc, null) // filho não mostra CNPJ do documento
      assert.equal(st.rows[1]?.type, 'ISS')
      assert.equal(st.rows[1]?.supplier, 'SEFIN (municipal)')
    }
  })
  it('dueDate ISO datetime → DD/MM/YYYY (corta o horário)', () => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok({ ...resp, items: [{ ...item, dueDate: '2026-06-15T00:00:00.000Z' }] }),
      resolveSupplier: () => '—',
      resolveDestino: dest,
    })
    if (st.tag === 'ready') assert.equal(st.rows[0]?.due, '15/06/2026')
  })
  it('lista vazia → empty; loading → loading', () => {
    assert.equal(
      deriveTitleListState({
        isLoading: false,
        data: ok({ ...resp, items: [], total: 0 }),
        resolveSupplier: () => '—',
        resolveDestino: dest,
      }).tag,
      'empty',
    )
    assert.equal(
      deriveTitleListState({
        isLoading: true,
        data: undefined,
        resolveSupplier: () => '—',
        resolveDestino: dest,
      }).tag,
      'loading',
    )
  })
})
