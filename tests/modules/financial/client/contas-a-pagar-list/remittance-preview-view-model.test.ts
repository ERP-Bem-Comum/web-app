/**
 * ViewModel do "Conferir Remessa" (VAN, core-api#728) — PURO (node:test, imports relativos).
 *
 * O que estes testes travam, em ordem de importância:
 *  1. só Aprovado vira candidato — premissa de negócio, e o core-api NÃO a cobra (core-api#736);
 *  2. dedup por documento (o grid é por título: pai + impostos filhos = 1 linha na remessa);
 *  3. `hasPendency` é o único bit da conferência: `ready` entra, todo o resto não;
 *  4. o TOTAL DA REMESSA vem do backend — o front não recalcula o que vai sair;
 *  5. vencimentos diferentes são sinalizados (o backend recusaria gerar).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveRemittanceSelection,
  toPreviewView,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/remittance-preview.view-model.ts'
import type { GridRow } from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import type { RemittancePreview } from '../../../../../src/modules/financial/client/data/model/remittance.model.ts'

const row = (id: string, status: GridRow['status'], over: Partial<GridRow> = {}): GridRow => ({
  id,
  documentId: id,
  type: 'NFS-e',
  documentNumber: `NF-${id}`,
  series: null,
  supplier: 'Fornecedor X',
  supplierKind: null,
  supplierDoc: null,
  contract: '—',
  paymentMethod: 'PIX',
  emissao: '—',
  pagamento: '—',
  gross: 'R$ 10,00',
  grossCents: '1000',
  due: '10/07/2026',
  net: 'R$ 10,00',
  netCents: '1000',
  version: 0,
  status,
  ...over,
})

/** `Intl` separa "R$" do número com espaço NÃO-QUEBRÁVEL (U+00A0). Normaliza p/ comparar com literal. */
const nbsp = (s: string): string => s.replace(/\u00A0/g, ' ')

describe('deriveRemittanceSelection', () => {
  it('só Aprovado é candidato — Rascunho/Aberto/Pago ficam de fora e são contados', () => {
    const rows = [row('a', 'Aprovado'), row('b', 'Rascunho'), row('c', 'Aberto'), row('d', 'Pago')]
    const out = deriveRemittanceSelection(rows)
    assert.deepEqual(out.documentIds, ['a'])
    assert.equal(out.notApprovedCount, 3)
  })

  it('dedup por documento: pai + filho do MESMO documento viram 1 id', () => {
    const rows = [
      row('pai', 'Aprovado', { documentId: 'doc-1' }),
      row('filho-iss', 'Aprovado', { documentId: 'doc-1' }),
    ]
    const out = deriveRemittanceSelection(rows)
    assert.deepEqual(out.documentIds, ['doc-1'])
    assert.equal(out.notApprovedCount, 0)
  })

  it('lista vazia → nada a conferir (a tela desabilita o item CNAB a partir daqui)', () => {
    const out = deriveRemittanceSelection([])
    assert.deepEqual(out.documentIds, [])
    assert.equal(out.notApprovedCount, 0)
  })
})

const preview = (
  lines: RemittancePreview['lines'],
  over: Partial<RemittancePreview> = {},
): RemittancePreview => ({
  lines,
  readyCount: 0,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  readyTotalCents: '0',
  blockedTotalCents: '0',
  ...over,
})

describe('toPreviewView — colunas espelhando o grid', () => {
  it('monta a linha com forma, documento, fornecedor e vencimento vindos do GRID', () => {
    const rows = [
      row('doc-1', 'Aprovado', { supplier: 'Padaria Real', paymentMethod: 'TED', due: '15/08/2026' }),
    ]
    const view = toPreviewView(
      preview(
        [{ documentId: 'doc-1', status: 'ready', route: 'transfer', gaps: [], netValueCents: '25000' }],
        { readyCount: 1, readyTotalCents: '25000' },
      ),
      rows,
    )
    const line = view.lines[0]
    assert.equal(line?.paymentMethodTag, 'financial.paymentMethod.TED')
    assert.equal(line?.documentNumber, 'NF-doc-1')
    assert.equal(line?.supplier, 'Padaria Real')
    assert.equal(line?.due, '15/08/2026')
    assert.equal(nbsp(line?.net ?? ''), 'R$ 250,00')
    assert.equal(line?.hasPendency, false)
  })

  it('documento que sumiu do grid não quebra a linha — cai em "—" e sem forma', () => {
    const view = toPreviewView(
      preview([{ documentId: 'fantasma', status: 'not-found', route: null, gaps: [], netValueCents: '0' }]),
      [],
    )
    assert.equal(view.lines[0]?.supplier, '—')
    assert.equal(view.lines[0]?.paymentMethodTag, null)
    assert.equal(view.lines[0]?.hasPendency, true)
  })
})

describe('toPreviewView — pendência', () => {
  it('`ready` é o único que entra: blocked, out-of-van e not-found são todos pendência', () => {
    const lines: RemittancePreview['lines'] = [
      { documentId: 'r', status: 'ready', route: 'pix', gaps: [], netValueCents: '100' },
      { documentId: 'b', status: 'blocked', route: 'transfer', gaps: [], netValueCents: '100' },
      { documentId: 'o', status: 'out-of-van', route: null, gaps: [], netValueCents: '100' },
      { documentId: 'n', status: 'not-found', route: null, gaps: [], netValueCents: '0' },
    ]
    const view = toPreviewView(preview(lines), [])
    const byId = new Map(view.lines.map((l) => [l.documentId, l.hasPendency]))
    assert.equal(byId.get('r'), false)
    assert.equal(byId.get('b'), true)
    assert.equal(byId.get('o'), true)
    assert.equal(byId.get('n'), true)
    assert.equal(view.summary.pendingCount, 3)
  })

  it('as linhas com pendência vêm primeiro', () => {
    const lines: RemittancePreview['lines'] = [
      { documentId: 'r1', status: 'ready', route: 'pix', gaps: [], netValueCents: '100' },
      { documentId: 'b1', status: 'blocked', route: null, gaps: [], netValueCents: '100' },
      { documentId: 'r2', status: 'ready', route: 'pix', gaps: [], netValueCents: '100' },
    ]
    const view = toPreviewView(preview(lines), [])
    assert.equal(view.lines[0]?.documentId, 'b1')
  })

  it('a lacuna guarda campo + motivo (vira tooltip; não há coluna de situação)', () => {
    const view = toPreviewView(
      preview([
        {
          documentId: 'doc-1',
          status: 'blocked',
          route: 'transfer',
          gaps: [{ field: 'payee-agency', reason: 'missing' }],
          netValueCents: '100',
        },
      ]),
      [],
    )
    assert.deepEqual(view.lines[0]?.gaps, [
      {
        fieldTag: 'financial.remittance.preview.field.agency',
        reasonTag: 'financial.remittance.preview.reason.missing',
      },
    ])
  })
})

describe('toPreviewView — resumo do lote', () => {
  const lines: RemittancePreview['lines'] = [
    { documentId: 'd1', status: 'ready', route: 'pix', gaps: [], netValueCents: '10000' },
    { documentId: 'd2', status: 'blocked', route: null, gaps: [], netValueCents: '5000' },
  ]
  const rows = [
    row('d1', 'Aprovado', { grossCents: '12000', due: '20/08/2026' }),
    row('d2', 'Aprovado', { grossCents: '6000', due: '20/08/2026' }),
  ]

  it('conta títulos e soma bruto (do grid) e líquido (do pré-voo)', () => {
    const view = toPreviewView(preview(lines, { readyTotalCents: '10000' }), rows)
    assert.equal(view.summary.titleCount, 2)
    assert.equal(nbsp(view.summary.grossTotal), 'R$ 180,00')
    assert.equal(nbsp(view.summary.netTotal), 'R$ 150,00')
  })

  it('o TOTAL DA REMESSA vem do backend e conta só o que sai — não é a soma da tela', () => {
    const view = toPreviewView(preview(lines, { readyTotalCents: '10000' }), rows)
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 100,00')
  })

  it('data de pagamento = o vencimento comum do lote', () => {
    const view = toPreviewView(preview(lines), rows)
    assert.equal(view.summary.paymentDate, '20/08/2026')
    assert.equal(view.summary.paymentDateMixed, false)
  })

  it('vencimentos diferentes são sinalizados (o backend recusaria gerar)', () => {
    const mixed = [row('d1', 'Aprovado', { due: '20/08/2026' }), row('d2', 'Aprovado', { due: '21/08/2026' })]
    const view = toPreviewView(preview(lines), mixed)
    assert.equal(view.summary.paymentDateMixed, true)
  })
})
