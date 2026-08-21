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
  notApprovedCount: 0,
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
// core-api#794: o pré-voo responde POR TÍTULO. A retenção deixou de ser recusada por suposição do
// front e passa a ter veredito próprio — favorecido, valor e trilho são dela.
const fornLine = {
  payableId: 'p-forn',
  documentId: 'doc-1',
  status: 'ready' as const,
  route: 'transfer' as const,
  gaps: [],
  valueCents: '140775',
}
const impostoLine = {
  payableId: 'p-imposto',
  documentId: 'doc-1',
  status: 'blocked' as const,
  route: 'tax-guide' as const,
  gaps: [{ field: 'payment-detail' as const, reason: 'missing' as const }],
  valueCents: '6975',
}

describe('toPreviewView — documento com retenção', () => {
  it('exibe os DOIS títulos, cada um com o seu valor e o seu favorecido', () => {
    const view = toPreviewView(
      preview([fornLine, impostoLine], { readyCount: 1, readyTotalCents: '140775' }),
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

  it('⚠️ a retenção NÃO é mais recusada por ser retenção — vale o veredito do backend', () => {
    const view = toPreviewView(
      preview([fornLine, { ...impostoLine, status: 'ready' as const, gaps: [] }], { readyCount: 2 }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    // Antes qualquer filho de retenção nascia impedido com "guia não entra na remessa".
    assert.equal(byId.get('p-imposto')?.remittable, true)
    assert.equal(byId.get('p-imposto')?.pendencyTag, null)
  })

  it('retenção sem código de barras é recusada pelo MOTIVO dela, não por ser imposto', () => {
    const view = toPreviewView(
      preview([fornLine, impostoLine], { readyCount: 1 }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.remittable, false)
    assert.equal(byId.get('p-imposto')?.pendencyTag, 'financial.remittance.preview.pendency.missingBarcode')
    assert.equal(byId.get('p-forn')?.remittable, true)
  })

  it('o impedido nasce DESMARCADO — o operador não precisa desmarcar o que não pode ir', () => {
    const view = toPreviewView(
      preview([fornLine, impostoLine], { readyCount: 1 }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.checked, false)
    assert.equal(byId.get('p-forn')?.checked, true)
  })

  it('o total soma o valor DE CADA TÍTULO marcado — não mais um por documento', () => {
    const view = toPreviewView(
      preview([fornLine, impostoLine], { readyCount: 1 }),
      [fornecedor, imposto],
      NONE,
    )
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 1.407,75')
    assert.equal(view.summary.checkedCount, 1)
    assert.equal(view.summary.titleCount, 2)
    assert.deepEqual(view.checkedPayableIds, ['p-forn'])
  })

  it('os DOIS títulos da mesma nota podem ir juntos — o total soma os dois', () => {
    const view = toPreviewView(
      preview([fornLine, { ...impostoLine, status: 'ready' as const, gaps: [] }], { readyCount: 2 }),
      [fornecedor, imposto],
      NONE,
    )
    assert.deepEqual([...view.checkedPayableIds].sort(), ['p-forn', 'p-imposto'])
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 1.477,50') // 140775 + 6975
  })

  it('impedidos aparecem primeiro', () => {
    const view = toPreviewView(preview([fornLine, impostoLine]), [fornecedor, imposto], NONE)
    assert.equal(view.lines[0]?.payableId, 'p-imposto')
  })
})

describe('toPreviewView — desmarcar atualiza o totalizador', () => {
  const a = row('pa', 'Aprovado', { documentId: 'da', netCents: '10000', grossCents: '12000' })
  const b = row('pb', 'Aprovado', { documentId: 'db', netCents: '5000', grossCents: '6000' })
  const lines: RemittancePreview['lines'] = [
    { payableId: 'pa', documentId: 'da', status: 'ready', route: 'pix', gaps: [], valueCents: '10000' },
    { payableId: 'pb', documentId: 'db', status: 'ready', route: 'pix', gaps: [], valueCents: '5000' },
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
    assert.deepEqual(view.checkedPayableIds, ['pa'])
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

describe('toPreviewView — não-aprovado nem aparece', () => {
  it('título fora de Aprovado é OMITIDO da conferência (não vira linha impedida)', () => {
    const aprovado = row('p-ok', 'Aprovado', { documentId: 'd-ok' })
    const aberto = row('p-aberto', 'Aberto', { documentId: 'd-aberto' })
    const pago = row('p-pago', 'Pago', { documentId: 'd-pago' })
    const view = toPreviewView(
      preview([
        { payableId: 'p-ok', documentId: 'd-ok', status: 'ready', route: 'pix', gaps: [], valueCents: '100' },
      ]),
      [aprovado, aberto, pago],
      NONE,
    )
    assert.equal(view.lines.length, 1)
    assert.equal(view.lines[0]?.payableId, 'p-ok')
    assert.equal(view.summary.titleCount, 1)
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
          payableId: 'p1',
          documentId: 'd1',
          status: 'blocked',
          route: 'transfer',
          gaps: [{ field: 'payee-agency', reason: 'missing' }],
          valueCents: '100',
        },
        { payableId: 'p2', documentId: 'd2', status: 'out-of-van', route: null, gaps: [], valueCents: '100' },
        { payableId: 'p3', documentId: 'd3', status: 'not-found', route: null, gaps: [], valueCents: '0' },
      ]),
      rows,
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    // Rota `transfer`: o que falta é conta do favorecido, e o rótulo diz isso — não o genérico.
    assert.equal(byId.get('p1')?.pendencyTag, 'financial.remittance.preview.pendency.missingBankData')
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

describe('toPreviewView — a pendência nomeia o dado DAQUELA forma de pagamento', () => {
  // A regra da VAN: TED/Transferência paga por banco+agência+conta; Boleto/Guia pela linha digitável;
  // PIX pela chave do título. Um rótulo único ("sem dados bancários") mandava o operador ao lugar
  // errado em três dos quatro trilhos — um boleto sem código de barras virava problema de cadastro.
  const blocked = (route: 'transfer' | 'pix' | 'billet' | 'tax-guide', field: string, reason = 'missing') =>
    toPreviewView(
      preview([
        {
          payableId: 'p1',
          documentId: 'd1',
          status: 'blocked',
          route,
          gaps: [{ field, reason }],
          valueCents: '100',
        },
      ] as never),
      [row('p1', 'Aprovado', { documentId: 'd1' })],
      NONE,
    ).lines[0]

  it('TED/Transferência aponta os dados bancários', () => {
    assert.equal(
      blocked('transfer', 'payee-account-number')?.pendencyTag,
      'financial.remittance.preview.pendency.missingBankData',
    )
  })

  it('PIX aponta a chave, não a conta', () => {
    assert.equal(
      blocked('pix', 'pix-key')?.pendencyTag,
      'financial.remittance.preview.pendency.missingPixKey',
    )
  })

  it('Boleto aponta o código de barras — fornecedor sem conta paga boleto normalmente', () => {
    assert.equal(
      blocked('billet', 'payment-detail')?.pendencyTag,
      'financial.remittance.preview.pendency.missingBarcode',
    )
  })

  it('Guia de recolhimento segue o boleto: o dinheiro vai pelo código de barras', () => {
    assert.equal(
      blocked('tax-guide', 'payment-detail')?.pendencyTag,
      'financial.remittance.preview.pendency.missingBarcode',
    )
  })

  // ⚠️ O core-api recusa a LINHA DIGITÁVEL (47 dígitos) como `unmappable` — só o código de barras (44)
  // entra no arquivo. Verificado contra a rota real: 47 → blocked/unmappable, 44 → ready.
  it('boleto COM linha digitável não diz "sem linha digitável" — o operador preencheu', () => {
    const tag = blocked('billet', 'payment-detail', 'unmappable')?.pendencyTag
    assert.equal(tag, 'financial.remittance.preview.pendency.barcodeIsDigitableLine')
    assert.notEqual(tag, 'financial.remittance.preview.pendency.missingBarcode')
  })

  it('código de barras em formato inválido é distinto de ausente', () => {
    assert.equal(
      blocked('billet', 'payment-detail', 'malformed')?.pendencyTag,
      'financial.remittance.preview.pendency.barcodeMalformed',
    )
  })

  it('⚠️ dígito divergente NÃO é cadastro incompleto — o rótulo não pede "completar"', () => {
    const tag = blocked('transfer', 'payee-account-digit', 'check-digit-mismatch')?.pendencyTag
    assert.equal(tag, 'financial.remittance.preview.pendency.checkDigit')
    assert.notEqual(tag, 'financial.remittance.preview.pendency.missingBankData')
  })

  it('rota desconhecida cai no genérico — sem chutar onde o operador deve mexer', () => {
    const view = toPreviewView(
      preview([
        { payableId: 'p1', documentId: 'd1', status: 'blocked', route: null, gaps: [], valueCents: '100' },
      ]),
      [row('p1', 'Aprovado', { documentId: 'd1' })],
      NONE,
    )
    assert.equal(view.lines[0]?.pendencyTag, 'financial.remittance.preview.pendency.missingData')
  })

  it('⚠️ dígito divergente CHEGA à tela — o cadastro está completo, o dígito é que não fecha', () => {
    const line = blocked('transfer', 'payee-account-digit', 'check-digit-mismatch')
    assert.deepEqual(line?.gaps, [
      {
        fieldTag: 'financial.remittance.preview.field.accountDigit',
        reasonTag: 'financial.remittance.preview.reason.checkDigitMismatch',
      },
    ])
  })
})

describe('deriveRemittanceSelection', () => {
  it('só Aprovado é candidato — o resto fica de fora e é contado', () => {
    const rows = [row('a', 'Aprovado'), row('b', 'Rascunho'), row('c', 'Aberto'), row('d', 'Pago')]
    const out = deriveRemittanceSelection(rows)
    assert.deepEqual(out.payableIds, ['a'])
    assert.equal(out.notApprovedCount, 3)
  })

  // core-api#794: NÃO há mais dedup. Cada título pede o seu veredito — inclusive a retenção, que é
  // título a pagar como qualquer outro.
  it('pai + filho da MESMA nota viajam como DOIS títulos', () => {
    const out = deriveRemittanceSelection([fornecedor, imposto])
    assert.deepEqual(out.payableIds, ['p-forn', 'p-imposto'])
  })

  it('lista vazia → nada a conferir (a tela desabilita o item CNAB a partir daqui)', () => {
    const out = deriveRemittanceSelection([])
    assert.deepEqual(out.payableIds, [])
    assert.equal(out.notApprovedCount, 0)
  })
})

// A retenção NÃO é bloqueada (decisão da P.O.: a modelagem muda com a reforma tributária), mas precisa
// ser IDENTIFICÁVEL — hoje ela herda forma e favorecido da nota, passa pela régua como apta, e sairia
// por TED ao fornecedor sem nenhuma pendência a acusar.
describe('toPreviewView — retenção é sinalizada, não bloqueada', () => {
  const readyImposto = { ...impostoLine, status: 'ready' as const, gaps: [] }

  it('a linha do imposto vem marcada como retenção; a do fornecedor não', () => {
    const view = toPreviewView(
      preview([fornLine, readyImposto], { readyCount: 2 }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.isRetention, true)
    assert.equal(byId.get('p-forn')?.isRetention, false)
  })

  it('sinalizar NÃO impede: a retenção apta segue remessável e marcada', () => {
    const view = toPreviewView(
      preview([fornLine, readyImposto], { readyCount: 2 }),
      [fornecedor, imposto],
      NONE,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))
    assert.equal(byId.get('p-imposto')?.remittable, true)
    assert.equal(byId.get('p-imposto')?.checked, true)
  })

  it('o aviso do topo conta só as retenções MARCADAS', () => {
    const todas = toPreviewView(
      preview([fornLine, readyImposto], { readyCount: 2 }),
      [fornecedor, imposto],
      NONE,
    )
    assert.equal(todas.summary.retentionCheckedCount, 1)

    // Desmarcada, some do aviso — é o caminho que a P.O. descreveu: o operador remove da remessa.
    const semImposto = toPreviewView(
      preview([fornLine, readyImposto], { readyCount: 2 }),
      [fornecedor, imposto],
      new Set(['p-imposto']),
    )
    assert.equal(semImposto.summary.retentionCheckedCount, 0)
    assert.deepEqual(semImposto.checkedPayableIds, ['p-forn'])
  })

  it('lote sem retenção não dispara aviso', () => {
    const view = toPreviewView(preview([fornLine], { readyCount: 1 }), [fornecedor], NONE)
    assert.equal(view.summary.retentionCheckedCount, 0)
  })
})
