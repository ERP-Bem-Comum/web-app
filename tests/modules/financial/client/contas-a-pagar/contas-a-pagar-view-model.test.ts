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
  maskCnpj,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { ok, err } from '../../../../../src/shared/primitives/result.ts'
import type {
  DocumentListResponse,
  DocumentSummary,
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
  it('cabeçalho + linhas com `;`, valores entre aspas (RFC 4180)', () => {
    const csv = buildDocumentsCsv(buildRows([summary()], supplierName))
    const [header, row] = csv.split('\n')
    assert.equal(header, 'Tipo;Documento;Fornecedor;Vencimento;Líquido;Status')
    assert.ok(row?.startsWith('"NFS-e";"0847";"Bambu Educação";"10/07/2026";'))
    assert.ok(row?.endsWith(';"Aberto"'))
  })

  it('escapa aspas internas duplicando-as', () => {
    const csv = buildDocumentsCsv(buildRows([summary({ documentNumber: 'A"B' })], supplierName))
    assert.ok(csv.includes('"A""B"'))
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
