/**
 * contas-a-pagar.view-model (node:test) — derivação PURA do grid: estado (loading/empty/error/ready),
 * mapeamento de linhas (resolve fornecedor, formata vencimento/líquido, dashes p/ null) e paginação.
 * Imports RELATIVOS (node:test). Lista REAL da Fatia 2.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveListState,
  buildRows,
  pageInfo,
  buildDocumentsCsv,
  sumSelectedNetBRL,
  sumSelectedGrossBRL,
  maskCnpj,
  bulkStatusTargets,
  bulkDeleteTargets,
  bulkDueDateTargets,
  filterByLabel,
  filterRowsBySearch,
  STATUS_CHIPS,
  FILTER_DIMS,
  deriveDetailStatus,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { ok, err } from '../../../../../src/shared/primitives/result.ts'
import type {
  DocumentListResponse,
  DocumentSummary,
  DocumentStatus,
} from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const supplierName = (ref: string | null): string => (ref === 's1' ? 'Bambu Educação' : (ref ?? '—'))

const summary = (over: Partial<DocumentSummary> = {}): DocumentSummary => ({
  id: 'd1',
  status: 'Aberto',
  documentNumber: '0847',
  type: 'NFS-e',
  supplierRef: 's1',
  netValueCents: '150000',
  series: null,
  grossValueCents: '160000',
  paymentMethod: 'PIX',
  contractRef: null,
  version: 0,
  dueDate: '2026-07-10',
  issueDate: '2026-07-01',
  ...over,
})

const response = (
  items: readonly DocumentSummary[],
  over: Partial<DocumentListResponse> = {},
): DocumentListResponse => ({
  items,
  page: 1,
  pageSize: 12,
  total: items.length,
  ...over,
})

describe('deriveListState', () => {
  const resolveSupplier = supplierName

  it('loading quando isLoading=true ou data=undefined', () => {
    assert.equal(deriveListState({ isLoading: true, data: undefined, resolveSupplier }).tag, 'loading')
    assert.equal(deriveListState({ isLoading: false, data: undefined, resolveSupplier }).tag, 'loading')
  })

  it('error quando o Result é err → tag i18n', () => {
    const s = deriveListState({ isLoading: false, data: err('server'), resolveSupplier })
    assert.equal(s.tag, 'error')
    if (s.tag === 'error') assert.equal(s.errorTag, 'financial.error.server')
  })

  it('empty quando a lista vem vazia (NÃO é erro)', () => {
    const s = deriveListState({ isLoading: false, data: ok(response([])), resolveSupplier })
    assert.equal(s.tag, 'empty')
  })

  it('ready com linhas + paginação quando há itens', () => {
    const s = deriveListState({
      isLoading: false,
      data: ok(response([summary()], { total: 47 })),
      resolveSupplier,
    })
    assert.equal(s.tag, 'ready')
    if (s.tag === 'ready') {
      assert.equal(s.rows.length, 1)
      assert.equal(s.rows[0]?.supplier, 'Bambu Educação')
      assert.equal(s.page.total, 47)
    }
  })

  it('#163: emissão populada (DD/MM/YYYY) e "—" quando ausente', () => {
    const withDate = deriveListState({
      isLoading: false,
      data: ok(response([summary({ issueDate: '2026-07-01' })])),
      resolveSupplier,
    })
    if (withDate.tag === 'ready') assert.equal(withDate.rows[0]?.emissao, '01/07/2026')
    const without = deriveListState({
      isLoading: false,
      data: ok(response([summary({ issueDate: null })])),
      resolveSupplier,
    })
    if (without.tag === 'ready') assert.equal(without.rows[0]?.emissao, '—')
  })
})

describe('buildRows', () => {
  it('mapeia campos, formata vencimento (DD/MM/YYYY) e líquido (R$), resolve fornecedor', () => {
    const [row] = buildRows([summary()], supplierName)
    assert.equal(row?.type, 'NFS-e')
    assert.equal(row?.documentNumber, '0847')
    assert.equal(row?.supplier, 'Bambu Educação')
    assert.equal(row?.due, '10/07/2026')
    // `Intl` BRL usa espaço não-quebrável entre "R$" e o número → asserção pelo conteúdo numérico.
    assert.ok((row?.net ?? '').startsWith('R$'))
    assert.ok((row?.net ?? '').includes('1.500,00'))
    assert.equal(row?.status, 'Aberto')
  })

  it('usa "—" para campos nulos', () => {
    const [row] = buildRows(
      [summary({ documentNumber: null, type: null, netValueCents: null, dueDate: null, supplierRef: null })],
      supplierName,
    )
    assert.equal(row?.documentNumber, '—')
    assert.equal(row?.type, '—')
    assert.equal(row?.net, '—')
    assert.equal(row?.due, '—')
    assert.equal(row?.supplier, '—')
  })
})

describe('pageInfo', () => {
  it('primeira página de 47 (12/pág): range "1–12 de 47", sem prev, com next', () => {
    const p = pageInfo(1, 12, 47)
    assert.equal(p.rangeLabel, '1–12 de 47')
    assert.equal(p.hasPrev, false)
    assert.equal(p.hasNext, true)
  })

  it('última página parcial: range "37–47 de 47", com prev, sem next', () => {
    const p = pageInfo(4, 12, 47)
    assert.equal(p.rangeLabel, '37–47 de 47')
    assert.equal(p.hasPrev, true)
    assert.equal(p.hasNext, false)
  })

  it('lista vazia: range "0–0 de 0"', () => {
    const p = pageInfo(1, 12, 0)
    assert.equal(p.rangeLabel, '0–0 de 0')
    assert.equal(p.hasNext, false)
  })
})

describe('buildDocumentsCsv', () => {
  it('cabeçalho (com Pagamento) + linhas com `;`, valores entre aspas (RFC 4180)', () => {
    const csv = buildDocumentsCsv(buildRows([summary()], supplierName))
    const [header, row] = csv.split('\n')
    assert.equal(header, 'Tipo;Documento;Fornecedor;Vencimento;Pagamento;Líquido;Status')
    // Vencimento → Pagamento ("—" sem paidAt em modo documento) → Líquido → Status
    assert.ok(row?.startsWith('"NFS-e";"0847";"Bambu Educação";"10/07/2026";"—";'))
    assert.ok(row?.endsWith(';"Aberto"'))
  })

  it('escapa aspas internas duplicando-as', () => {
    const csv = buildDocumentsCsv(buildRows([summary({ documentNumber: 'A"B' })], supplierName))
    assert.ok(csv.includes('"A""B"'))
  })

  it('última linha = TOTAL do Líquido (soma client-side dos centavos)', () => {
    // 150000 + 249999 = 399999 centavos → R$ 3.999,99
    const rows = buildRows(
      [summary({ id: 'a', netValueCents: '150000' }), summary({ id: 'b', netValueCents: '249999' })],
      supplierName,
    )
    const lines = buildDocumentsCsv(rows).split('\n')
    const total = lines[lines.length - 1] ?? ''
    assert.ok(total.includes('Total (2 títulos)'))
    assert.ok(total.replace(/\s/g, ' ').includes('R$ 3.999,99'))
  })
})

describe('sumSelectedNetBRL', () => {
  const rows = buildRows(
    [
      summary({ id: 'a', netValueCents: '150000' }),
      summary({ id: 'b', netValueCents: '249999' }),
      summary({ id: 'c', netValueCents: null }),
    ],
    supplierName,
  )

  // Intl (pt-BR) usa NBSP entre "R$" e o número — normaliza p/ comparar.
  const norm = (s: string): string => s.replace(/\s/g, ' ')

  it('soma só o líquido das linhas selecionadas (BRL)', () => {
    assert.equal(norm(sumSelectedNetBRL(rows, new Set(['a', 'b']))), 'R$ 3.999,99')
  })

  it('ignora linhas sem valor e zera quando nada selecionado', () => {
    assert.equal(norm(sumSelectedNetBRL(rows, new Set(['c']))), 'R$ 0,00')
    assert.equal(norm(sumSelectedNetBRL(rows, new Set())), 'R$ 0,00')
  })

  it('soma o BRUTO das selecionadas (default 160000 por linha)', () => {
    assert.equal(norm(sumSelectedGrossBRL(rows, new Set(['a', 'b']))), 'R$ 3.200,00')
  })
})

describe('bulkStatusTargets', () => {
  const rows = buildRows(
    [
      summary({ id: 'a', status: 'Aberto', version: 2 }),
      summary({ id: 'b', status: 'Aprovado', version: 5 }),
      summary({ id: 'c', status: 'Aberto', version: 1 }),
      summary({ id: 'd', status: 'Pago', version: 9 }),
    ],
    supplierName,
  )

  it('aprovar = só "Aberto" selecionados; reabrir = só "Aprovado"; com o version de cada', () => {
    const tg = bulkStatusTargets(rows, new Set(['a', 'b', 'd']))
    assert.deepEqual(tg.approve, [{ id: 'a', version: 2 }])
    assert.deepEqual(tg.reopen, [{ id: 'b', version: 5 }])
    // 'd' (Pago) não entra em nenhum
  })

  it('vazio quando nada elegível', () => {
    const tg = bulkStatusTargets(rows, new Set(['d']))
    assert.deepEqual(tg.approve, [])
    assert.deepEqual(tg.reopen, [])
  })
})

describe('bulkDeleteTargets', () => {
  const rows = buildRows(
    [
      summary({ id: 'a', status: 'Aberto', version: 2 }),
      summary({ id: 'b', status: 'Rascunho', version: 0 }),
      summary({ id: 'c', status: 'Aberto', version: 1 }),
      summary({ id: 'd', status: 'Aprovado', version: 9 }),
    ],
    supplierName,
  )

  it('deletable = só "Aberto" da seleção (id + version); conta rascunhos à parte; Aprovado fica de fora', () => {
    const tg = bulkDeleteTargets(rows, new Set(['a', 'b', 'd']))
    assert.deepEqual(tg.deletable, [{ id: 'a', version: 2 }])
    assert.equal(tg.draftCount, 1)
  })

  it('seleção só de rascunho: nada deletável, draftCount conta', () => {
    const tg = bulkDeleteTargets(rows, new Set(['b']))
    assert.deepEqual(tg.deletable, [])
    assert.equal(tg.draftCount, 1)
  })
})

describe('bulkDueDateTargets', () => {
  const rows = buildRows(
    [
      summary({ id: 'a', status: 'Aberto', version: 2 }),
      summary({ id: 'b', status: 'Aprovado', version: 5 }),
      summary({ id: 'c', status: 'Aberto', version: 1 }),
    ],
    supplierName,
  )

  it('editable = só "Aberto" (id+version); blockedCount conta os demais selecionados', () => {
    const tg = bulkDueDateTargets(rows, new Set(['a', 'b', 'c']))
    assert.deepEqual(tg.editable, [
      { id: 'a', version: 2 },
      { id: 'c', version: 1 },
    ])
    assert.equal(tg.blockedCount, 1)
  })
})

describe('STATUS_CHIPS (filtro por status)', () => {
  it('"Todos" sem status; Rascunho/Aberto/Aprovado filtram; demais são chrome (não filtram)', () => {
    const byKey = Object.fromEntries(STATUS_CHIPS.map((c) => [c.key, c]))
    assert.equal(byKey.todos?.status, null)
    assert.equal(byKey.todos?.filterable, true)
    assert.equal(byKey.rascunho?.status, 'Rascunho')
    assert.equal(byKey.aberto?.status, 'Aberto')
    assert.equal(byKey.aprovado?.status, 'Aprovado')
    // Pago/Conciliado também filtram (backend aceita Paid/Reconciled em /payable-titles).
    for (const k of ['rascunho', 'aberto', 'aprovado', 'pago', 'conciliado'])
      assert.equal(byKey[k]?.filterable, true)
    // Transmitido/Recusado seguem fora do enum de filtro do backend → desabilitados.
    for (const k of ['transmitido', 'recusado']) assert.equal(byKey[k]?.filterable, false)
  })
})

describe('FILTER_DIMS (filtros avançados)', () => {
  it('expõe as 4 dimensões com backend (Vencimento/Emissão/Tipo/Fornecedor), todas habilitadas', () => {
    assert.deepEqual(
      FILTER_DIMS.map((d) => d.id),
      ['vencimento', 'emissao', 'tipo', 'fornecedor'],
    )
    assert.ok(FILTER_DIMS.every((d) => d.enabled))
  })
})

describe('filterRowsBySearch (busca rápida da página)', () => {
  const resolveName = (ref: string | null): string =>
    ref === 's1' ? 'Bambu Educação' : ref === 's2' ? 'Padaria Bartolomeu' : (ref ?? '—')
  const resolveDoc = (ref: string | null): string | null =>
    ref === 's1' ? '37364305000192' : ref === 's2' ? '68996168000132' : null
  const rows = buildRows(
    [
      summary({ id: 'a', supplierRef: 's1', documentNumber: '0847' }),
      summary({ id: 'b', supplierRef: 's2', documentNumber: '0345' }),
    ],
    resolveName,
    undefined,
    resolveDoc,
  )

  it('por nome do fornecedor (case-insensitive)', () => {
    assert.deepEqual(
      filterRowsBySearch(rows, 'bambu').map((r) => r.id),
      ['a'],
    )
  })
  it('por número do documento', () => {
    assert.deepEqual(
      filterRowsBySearch(rows, '0345').map((r) => r.id),
      ['b'],
    )
  })
  it('por CNPJ (dígitos, ignorando máscara)', () => {
    assert.deepEqual(
      filterRowsBySearch(rows, '37364305').map((r) => r.id),
      ['a'],
    )
  })
  it('query vazia devolve tudo', () => {
    assert.equal(filterRowsBySearch(rows, '').length, 2)
  })
})

describe('filterByLabel (autocomplete do Fornecedor)', () => {
  const opts = [
    { value: '1', label: 'Bambu Educação' },
    { value: '2', label: 'Banco do Brasil' },
    { value: '3', label: 'Padaria Bartolomeu' },
  ]
  it('substring case-insensitive', () => {
    assert.deepEqual(
      filterByLabel(opts, 'ban').map((o) => o.value),
      ['2'],
    )
    assert.deepEqual(
      filterByLabel(opts, 'BA').map((o) => o.value),
      ['1', '2', '3'],
    )
  })
  it('query vazia → primeiros (respeita o teto)', () => {
    assert.equal(filterByLabel(opts, '', 2).length, 2)
  })
})

describe('maskCnpj', () => {
  it('mascara CNPJ (14) e CPF (11); null/vazio → null; tamanho ≠ → original', () => {
    assert.equal(maskCnpj('37364305000192'), '37.364.305/0001-92')
    assert.equal(maskCnpj('12345678901'), '123.456.789-01')
    assert.equal(maskCnpj(null), null)
    assert.equal(maskCnpj(''), null)
    assert.equal(maskCnpj('123'), '123')
  })
})

describe('deriveDetailStatus (status do drawer reflete o título PAI; filhos não contam)', () => {
  const parent = (status: DocumentStatus) => ({ status, kind: 'Parent' as const })
  const child = (status: DocumentStatus) => ({ status, kind: 'Child' as const })

  it('reflete o PAI mesmo com filho (retenção) menos avançado — caso do print da P.O.', () => {
    // doc Aprovado, pai Conciliado, filhos mistos (1 ainda Pago) → Conciliado (segue o pai)
    assert.equal(
      deriveDetailStatus('Aprovado', [
        parent('Conciliado'),
        child('Conciliado'),
        child('Conciliado'),
        child('Pago'),
      ]),
      'Conciliado',
    )
  })
  it('o status cru do documento é ignorado quando há pai (o pai é a verdade)', () => {
    assert.equal(deriveDetailStatus('Aprovado', [parent('Pago'), child('Conciliado')]), 'Pago')
    assert.equal(deriveDetailStatus('Pago', [parent('Conciliado')]), 'Conciliado')
  })
  it('sem título-pai → mantém o status cru do documento', () => {
    assert.equal(deriveDetailStatus('Pago', []), 'Pago')
    assert.equal(deriveDetailStatus('Aprovado', [child('Conciliado')]), 'Aprovado')
  })
})
