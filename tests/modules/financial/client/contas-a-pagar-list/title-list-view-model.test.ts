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
  rt === 'ISS' ? 'SEFIN - Secretaria Municipal das Finanças de Fortaleza' : 'Receita Federal'

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
      assert.equal(st.rows[1]?.supplier, 'SEFIN - Secretaria Municipal das Finanças de Fortaleza')
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

  it('Aprovar/Excluir: dedup por documento (id=documentId); Vencimento (#270): por TÍTULO isolado', () => {
    const tg = deriveTitleActionTargets(titleRows, new Set(['p2']))
    assert.deepEqual(tg.approve, [{ id: 'd2', version: 1 }])
    assert.deepEqual(tg.deletable, [{ id: 'd2', version: 1 }])
    // #270: vencimento é por payable (documentId + payableId + version), NÃO deduplicado por documento.
    // `expectedDueDate` = o vencimento CRU da linha, pré-condição do CAS do core-api (ADR-0063 de lá).
    assert.deepEqual(tg.dueEditable, [
      { documentId: 'd2', payableId: 'p2', version: 1, expectedDueDate: '2026-07-10' },
    ])
  })

  // VAN/specs/101: Aprovado passou a ser editável. Uma remessa é de UM dia só, então alinhar os
  // vencimentos é pré-requisito para gerar — e é em Aprovado que o título está pronto para o lote.
  // O backend sempre permitiu Open E Approved; era o front que barrava.
  it('vencimento em lote: Aberto E Aprovado são editáveis', () => {
    const tg = deriveTitleActionTargets(titleRows, new Set(['p1', 'p2'])) // p1 Aprovado + p2 Aberto
    assert.equal(tg.dueEditable.length, 2)
    assert.equal(tg.dueBlockedCount, 0)
  })

  it('dueBlockedCount: selecionado FORA de Aberto/Aprovado (ex.: Pago) segue bloqueado', () => {
    const base = titleRows[0]
    if (base === undefined) throw new Error('sem linha base')
    const rows = [...titleRows, { ...base, id: 'p-pago', documentId: 'd-pago', status: 'Pago' as const }]
    const tg = deriveTitleActionTargets(rows, new Set(['p2', 'p-pago']))
    assert.equal(tg.dueEditable.length, 1) // só p2
    assert.equal(tg.dueBlockedCount, 1) // o Pago
  })

  // ── CAS por valor no reagendamento (core-api ADR-0063) ────────────────────────
  //
  // `expectedDueDate` é pré-condição, não enfeite: sem ele o core-api responde 400, e com o valor errado
  // responde 409. Sai do `dueIso` CRU da linha — nunca do `due` de tela (DD/MM/YYYY), porque re-parsear
  // string formatada é onde se troca dia por mês.

  it('cada título declara o SEU vencimento, não o do vizinho', () => {
    const base = titleRows[0]
    if (base === undefined) throw new Error('sem linha base')
    const outro = { ...base, id: 'p-outro', documentId: 'd-outro', dueIso: '2026-09-01', due: '01/09/2026' }
    const tg = deriveTitleActionTargets([...titleRows, outro], new Set(['p2', 'p-outro']))
    const byId = new Map(tg.dueEditable.map((t) => [t.payableId, t.expectedDueDate]))
    assert.equal(byId.get('p2'), '2026-07-10')
    assert.equal(byId.get('p-outro'), '2026-09-01')
  })

  it('⚠️ título SEM vencimento fica de fora — sem valor atual não há pré-condição a declarar', () => {
    const base = titleRows[0]
    if (base === undefined) throw new Error('sem linha base')
    const semData = { ...base, id: 'p-sem', documentId: 'd-sem', dueIso: null, due: '—' }
    const tg = deriveTitleActionTargets([...titleRows, semData], new Set(['p2', 'p-sem']))
    // Vai para o bloqueado (o modal avisa) em vez de virar chamada que o backend recusaria.
    assert.equal(tg.dueEditable.length, 1)
    assert.equal(tg.dueEditable[0]?.payableId, 'p2')
    assert.equal(tg.dueBlockedCount, 1)
  })

  it('#166: rascunho (Draft) é excluível (descarte) — entra em deletable, sem "ignorado"', () => {
    const first = titleRows[0]
    if (first === undefined) throw new Error('sem linha base')
    const draftRow = { ...first, id: 'pd', documentId: 'dd', status: 'Rascunho' as const, version: 2 }
    const tg = deriveTitleActionTargets([draftRow], new Set(['pd']))
    assert.deepEqual(tg.deletable, [{ id: 'dd', version: 2 }]) // id = documentId, version da linha
    assert.equal(tg.draftCount, 0) // rascunho NÃO é mais "ignorado"
  })
})
