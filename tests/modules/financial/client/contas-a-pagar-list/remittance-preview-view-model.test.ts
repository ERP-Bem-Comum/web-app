/**
 * ViewModel do "Conferir Remessa" (VAN, core-api#728) — PURO (node:test, imports relativos).
 *
 * O caso que originou o desenho: documento com retenção. A P.O. selecionou 2 títulos — o do fornecedor
 * (R$ 1.407,75) e o imposto a recolher (R$ 69,75) — e via UMA linha, com o nome da Receita Federal e o
 * valor do fornecedor. Causa: as linhas eram por DOCUMENTO e os dois títulos compartilham o documento.
 *
 * O que estes testes travam:
 *  1. uma linha POR TÍTULO, cada uma com o SEU valor e o SEU favorecido;
 *  2. o filho de retenção não é remissível (o pré-voo do core-api é por documento e paga o fornecedor);
 *  3. checkbox: impedido nasce desmarcado e não marcável; o operador desmarca o que quiser;
 *  4. o totalizador acompanha os marcados;
 *  5. só Aprovado é candidato (premissa de negócio; core-api#736 não a cobra).
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
  isRetentionChild: false,
  ...over,
})

/** `Intl` separa "R$" do número com espaço NÃO-QUEBRÁVEL (U+00A0). Normaliza p/ comparar com literal. */
const nbsp = (s: string): string => s.replace(/\u00A0/g, ' ')

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

const NONE: ReadonlySet<string> = new Set()

// ── O caso da retenção (o bug reportado) ────────────────────────────────────────

const fornecedor = row('p-forn', 'Aprovado', {
  documentId: 'doc-1',
  supplier: 'Bambu Educação',
  paymentMethod: 'TED',
  netCents: '140775',
  grossCents: '147750',
})
const imposto = row('p-imposto', 'Aprovado', {
  documentId: 'doc-1', // MESMO documento — é um título-filho de retenção
  supplier: 'Receita Federal',
  paymentMethod: 'GuiaRecolhimento',
  netCents: '6975',
  grossCents: '6975',
  isRetentionChild: true,
})
const docLine = {
  documentId: 'doc-1',
  status: 'ready' as const,
  route: 'transfer' as const,
  gaps: [],
  netValueCents: '140775',
}

describe('toPreviewView — documento com retenção', () => {
  it('exibe os DOIS títulos, cada um com o seu valor e o seu favorecido', () => {
    const view = toPreviewView(
      preview([docLine], { readyCount: 1, readyTotalCents: '140775' }),
      [fornecedor, imposto],
      NONE,
    )
    assert.equal(view.lines.length, 2)
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-forn')?.supplier, 'Bambu Educação')
    assert.equal(nbsp(byId.get('p-forn')?.net ?? ''), 'R$ 1.407,75')
    assert.equal(byId.get('p-imposto')?.supplier, 'Receita Federal')
    assert.equal(nbsp(byId.get('p-imposto')?.net ?? ''), 'R$ 69,75')
  })

  it('o imposto não é remissível e diz por quê; o do fornecedor entra', () => {
    const view = toPreviewView(
      preview([docLine], { readyCount: 1, readyTotalCents: '140775' }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.remittable, false)
    assert.equal(byId.get('p-imposto')?.pendencyTag, 'financial.remittance.preview.pendency.taxGuide')
    assert.equal(byId.get('p-forn')?.remittable, true)
    assert.equal(byId.get('p-forn')?.pendencyTag, null)
  })

  it('o impedido nasce DESMARCADO — o operador não precisa desmarcar o que não pode ir', () => {
    const view = toPreviewView(preview([docLine], { readyCount: 1 }), [fornecedor, imposto], NONE)
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.checked, false)
    assert.equal(byId.get('p-forn')?.checked, true)
  })

  it('o total da remessa conta só o documento marcado — não soma o imposto', () => {
    const view = toPreviewView(preview([docLine], { readyCount: 1 }), [fornecedor, imposto], NONE)
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 1.407,75')
    assert.equal(view.summary.checkedCount, 1)
    assert.equal(view.summary.titleCount, 2)
    assert.deepEqual(view.checkedDocumentIds, ['doc-1'])
  })

  it('impedidos aparecem primeiro', () => {
    const view = toPreviewView(preview([docLine]), [fornecedor, imposto], NONE)
    assert.equal(view.lines[0]?.payableId, 'p-imposto')
  })
})

describe('toPreviewView — desmarcar atualiza o totalizador', () => {
  const a = row('pa', 'Aprovado', { documentId: 'da', netCents: '10000', grossCents: '12000' })
  const b = row('pb', 'Aprovado', { documentId: 'db', netCents: '5000', grossCents: '6000' })
  const lines: RemittancePreview['lines'] = [
    { documentId: 'da', status: 'ready', route: 'pix', gaps: [], netValueCents: '10000' },
    { documentId: 'db', status: 'ready', route: 'pix', gaps: [], netValueCents: '5000' },
  ]

  it('tudo marcado → soma os dois', () => {
    const view = toPreviewView(preview(lines, { readyCount: 2 }), [a, b], NONE)
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 150,00')
    assert.equal(nbsp(view.summary.grossTotal), 'R$ 180,00')
    assert.equal(view.summary.checkedCount, 2)
  })

  it('desmarcando um, o total cai e ele sai dos documentos da remessa', () => {
    const view = toPreviewView(preview(lines, { readyCount: 2 }), [a, b], new Set(['pb']))
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 100,00')
    assert.equal(nbsp(view.summary.grossTotal), 'R$ 120,00')
    assert.equal(view.summary.checkedCount, 1)
    assert.deepEqual(view.checkedDocumentIds, ['da'])
  })

  it('data de pagamento considera só os marcados', () => {
    const outro = row('pb', 'Aprovado', { documentId: 'db', due: '21/08/2026' })
    const misto = toPreviewView(preview(lines), [a, outro], NONE)
    assert.equal(misto.summary.paymentDateMixed, true)
    // desmarcado o divergente, o lote volta a ter um dia só
    const alinhado = toPreviewView(preview(lines), [a, outro], new Set(['pb']))
    assert.equal(alinhado.summary.paymentDateMixed, false)
    assert.equal(alinhado.summary.paymentDate, '10/07/2026')
  })
})

describe('toPreviewView — impedimentos do backend', () => {
  it('cada status vira um motivo distinto na linha', () => {
    const rows = [
      row('p1', 'Aprovado', { documentId: 'd1' }),
      row('p2', 'Aprovado', { documentId: 'd2' }),
      row('p3', 'Aprovado', { documentId: 'd3' }),
    ]
    const view = toPreviewView(
      preview([
        {
          documentId: 'd1',
          status: 'blocked',
          route: 'transfer',
          gaps: [{ field: 'payee-agency', reason: 'missing' }],
          netValueCents: '100',
        },
        { documentId: 'd2', status: 'out-of-van', route: null, gaps: [], netValueCents: '100' },
        { documentId: 'd3', status: 'not-found', route: null, gaps: [], netValueCents: '0' },
      ]),
      rows,
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p1')?.pendencyTag, 'financial.remittance.preview.pendency.missingData')
    assert.deepEqual(byId.get('p1')?.gaps, [
      {
        fieldTag: 'financial.remittance.preview.field.agency',
        reasonTag: 'financial.remittance.preview.reason.missing',
      },
    ])
    assert.equal(byId.get('p2')?.pendencyTag, 'financial.remittance.preview.pendency.outOfVan')
    assert.equal(byId.get('p3')?.pendencyTag, 'financial.remittance.preview.pendency.notFound')
    assert.equal(view.summary.pendingCount, 3)
    assert.equal(view.summary.checkedCount, 0)
  })

  it('título sem veredito do backend não é dado como apto', () => {
    const view = toPreviewView(preview([]), [row('p1', 'Aprovado', { documentId: 'd1' })], NONE)
    assert.equal(view.lines[0]?.remittable, false)
    assert.equal(view.lines[0]?.pendencyTag, 'financial.remittance.preview.pendency.notChecked')
  })
})

describe('deriveRemittanceSelection', () => {
  it('só Aprovado é candidato — o resto fica de fora e é contado', () => {
    const rows = [row('a', 'Aprovado'), row('b', 'Rascunho'), row('c', 'Aberto'), row('d', 'Pago')]
    const out = deriveRemittanceSelection(rows)
    assert.deepEqual(out.documentIds, ['a'])
    assert.equal(out.notApprovedCount, 3)
  })

  it('dedup por documento: pai + filho do MESMO documento pedem UM veredito só', () => {
    const out = deriveRemittanceSelection([fornecedor, imposto])
    assert.deepEqual(out.documentIds, ['doc-1'])
  })

  it('lista vazia → nada a conferir (a tela desabilita o item CNAB a partir daqui)', () => {
    const out = deriveRemittanceSelection([])
    assert.deepEqual(out.documentIds, [])
    assert.equal(out.notApprovedCount, 0)
  })
})
