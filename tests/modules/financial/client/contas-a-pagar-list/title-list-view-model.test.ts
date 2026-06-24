/**
 * deriveTitleListState (#201) — listagem por TÍTULO reusa o mesmo GridRow/ListState do grid de documentos.
 * PURO (node:test, imports relativos). Cobre o mapeamento título→linha, incl. os campos derivados do
 * documento pai (#229: emissão, forma, bruto/líquido, version) e o filho = tipo do imposto + órgão.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveTitleListState,
  deriveTitleActionTargets,
  filterRowsByTipo,
  isRetentionTipo,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
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
  paidAt: null,
  // #229: derivados do documento pai.
  issueDate: '2026-07-01',
  paymentMethod: 'Boleto',
  version: 3,
  grossValueCents: '20000',
  netValueCents: '15000',
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
      // #229: pai exibe bruto/líquido do documento (não o valueCents).
      assert.equal(r?.grossCents, '20000')
      assert.equal(r?.netCents, '15000')
      assert.equal(r?.emissao, '01/07/2026') // #229: emissão do documento pai
      assert.equal(r?.paymentMethod, 'Boleto') // #229: forma real do documento (pai)
      assert.equal(r?.version, 3) // #229: version do documento → ações por título habilitadas
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

describe('filtro de Tipo no grid por título (#201)', () => {
  const st = deriveTitleListState({
    isLoading: false,
    data: ok({
      ...resp,
      items: [
        item, // NFS-e (pai)
        { ...item, payableId: 'c1', kind: 'Child', retentionType: 'IRRF' },
        { ...item, payableId: 'c2', kind: 'Child', retentionType: 'ISS' },
      ],
      total: 3,
    }),
    resolveSupplier: () => 'X',
    resolveDestino: dest,
  })
  const rows = st.tag === 'ready' ? st.rows : []

  it('isRetentionTipo: só impostos', () => {
    assert.equal(isRetentionTipo('IRRF'), true)
    assert.equal(isRetentionTipo('ISS'), true)
    assert.equal(isRetentionTipo('NFS-e'), false)
    assert.equal(isRetentionTipo(undefined), false)
  })
  it('filtra client-side por imposto (filho); tipo de documento passa direto (server-side)', () => {
    assert.equal(filterRowsByTipo(rows, 'IRRF').length, 1)
    assert.equal(filterRowsByTipo(rows, 'IRRF')[0]?.type, 'IRRF')
    // tipo de documento → não filtra aqui (é server-side): devolve tudo
    assert.equal(filterRowsByTipo(rows, 'NFS-e').length, 3)
    assert.equal(filterRowsByTipo(rows, undefined).length, 3)
  })
})

describe('deriveTitleActionTargets (#229 — ações por linha, dedup por documento)', () => {
  // doc d1 Aprovado: pai + 2 filhos (1 Aprovado, 1 já Pago). doc d2 Aberto: 1 pai.
  const titleRows = (() => {
    const st = deriveTitleListState({
      isLoading: false,
      data: ok({
        ...resp,
        items: [
          { ...item, payableId: 'p1', documentId: 'd1', kind: 'Parent', status: 'Aprovado', version: 5 },
          {
            ...item,
            payableId: 'c1',
            documentId: 'd1',
            kind: 'Child',
            retentionType: 'IRRF',
            status: 'Aprovado',
            version: 5,
          },
          {
            ...item,
            payableId: 'c2',
            documentId: 'd1',
            kind: 'Child',
            retentionType: 'ISS',
            status: 'Pago',
            version: 5,
          },
          { ...item, payableId: 'p2', documentId: 'd2', kind: 'Parent', status: 'Aberto', version: 1 },
        ],
        total: 4,
      }),
      resolveSupplier: () => 'X',
      resolveDestino: dest,
    })
    return st.tag === 'ready' ? st.rows : []
  })()

  it('Reabrir: dedup por documento (vários títulos Aprovados do mesmo doc → 1 alvo com version do doc)', () => {
    const tg = deriveTitleActionTargets(titleRows, new Set(['p1', 'c1', 'c2']))
    assert.deepEqual(tg.reopen, [{ id: 'd1', version: 5 }]) // 1 alvo, id=documentId
    assert.equal(tg.approve.length, 0) // nenhum Aberto selecionado
  })

  it('Aprovar/Excluir/Vencimento: usam os títulos Aberto (id=documentId)', () => {
    const tg = deriveTitleActionTargets(titleRows, new Set(['p2']))
    assert.deepEqual(tg.approve, [{ id: 'd2', version: 1 }])
    assert.deepEqual(tg.deletable, [{ id: 'd2', version: 1 }])
    assert.deepEqual(tg.dueEditable, [{ id: 'd2', version: 1 }])
  })

  it('dueBlockedCount: documentos selecionados não-Aberto entram como bloqueados', () => {
    const tg = deriveTitleActionTargets(titleRows, new Set(['p1', 'p2'])) // d1 Aprovado (bloqueado) + d2 Aberto
    assert.equal(tg.dueEditable.length, 1) // só d2
    assert.equal(tg.dueBlockedCount, 1) // d1
  })
})
