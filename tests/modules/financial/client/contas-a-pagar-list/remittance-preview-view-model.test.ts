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
  accountLabel,
  toAccountOptions,
  toReceiptView,
  selectionAllowsPix,
  applyPixExclusivity,
  deriveRemittanceSelection,
  toPreviewView,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/remittance-preview.view-model.ts'
import type { RoutedPreviewLine } from '../../../../../src/modules/financial/client/contas-a-pagar-list/remittance-preview.view-model.ts'
import type { GridRow } from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import type { RemittancePreview } from '../../../../../src/modules/financial/client/data/model/remittance.model.ts'
import type { ReconciliationAccount } from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

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
  dueIso: '2026-07-10',
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

/**
 * "Hoje" FIXO, anterior ao vencimento das fixtures (10/07/2026). Fixo porque data de teste que anda
 * com o relógio quebra sozinha um dia — e este arquivo é `node:test` puro, sem acesso a `Date` de
 * propósito. Os casos de data no passado usam um `today` POSTERIOR, explicitamente.
 */
const TODAY = '2026-07-01'

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
      TODAY,
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
      TODAY,
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
      TODAY,
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
      TODAY,
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
      TODAY,
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
      TODAY,
    )
    assert.deepEqual([...view.checkedPayableIds].sort(), ['p-forn', 'p-imposto'])
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 1.477,50') // 140775 + 6975
  })

  it('impedidos aparecem primeiro', () => {
    const view = toPreviewView(preview([fornLine, impostoLine]), [fornecedor, imposto], NONE, TODAY)
    assert.equal(view.lines[0]?.payableId, 'p-imposto')
  })
})

describe('toPreviewView — desmarcar atualiza o totalizador', () => {
  const a = row('pa', 'Aprovado', { documentId: 'da', netCents: '10000', grossCents: '12000' })
  const b = row('pb', 'Aprovado', { documentId: 'db', netCents: '5000', grossCents: '6000' })
  const lines: RemittancePreview['lines'] = [
    { payableId: 'pa', documentId: 'da', status: 'ready', route: 'transfer', gaps: [], valueCents: '10000' },
    { payableId: 'pb', documentId: 'db', status: 'ready', route: 'transfer', gaps: [], valueCents: '5000' },
  ]

  it('tudo marcado → soma os dois', () => {
    const view = toPreviewView(preview(lines, { readyCount: 2 }), [a, b], NONE, TODAY)
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 150,00')
    assert.equal(nbsp(view.summary.grossTotal), 'R$ 180,00')
    assert.equal(view.summary.checkedCount, 2)
  })

  it('desmarcando um, o total cai e ele sai dos documentos da remessa', () => {
    const view = toPreviewView(preview(lines, { readyCount: 2 }), [a, b], new Set(['pb']), TODAY)
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 100,00')
    assert.equal(nbsp(view.summary.grossTotal), 'R$ 120,00')
    assert.equal(view.summary.checkedCount, 1)
    assert.deepEqual(view.checkedPayableIds, ['pa'])
  })

  it('data de pagamento considera só os marcados', () => {
    const outro = row('pb', 'Aprovado', { documentId: 'db', due: '21/08/2026' })
    const misto = toPreviewView(preview(lines), [a, outro], NONE, TODAY)
    assert.equal(misto.summary.paymentDateMixed, true)
    // desmarcado o divergente, o lote volta a ter um dia só
    const alinhado = toPreviewView(preview(lines), [a, outro], new Set(['pb']), TODAY)
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
        {
          payableId: 'p-ok',
          documentId: 'd-ok',
          status: 'ready',
          route: 'transfer',
          gaps: [],
          valueCents: '100',
        },
      ]),
      [aprovado, aberto, pago],
      NONE,
      TODAY,
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
      TODAY,
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
    const view = toPreviewView(preview([]), [row('p1', 'Aprovado', { documentId: 'd1' })], NONE, TODAY)
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
      TODAY,
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
      TODAY,
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
      TODAY,
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
      TODAY,
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
      TODAY,
    )
    assert.equal(todas.summary.retentionCheckedCount, 1)

    // Desmarcada, some do aviso — é o caminho que a P.O. descreveu: o operador remove da remessa.
    const semImposto = toPreviewView(
      preview([fornLine, readyImposto], { readyCount: 2 }),
      [fornecedor, imposto],
      new Set(['p-imposto']),
      TODAY,
    )
    assert.equal(semImposto.summary.retentionCheckedCount, 0)
    assert.deepEqual(semImposto.checkedPayableIds, ['p-forn'])
  })

  it('lote sem retenção não dispara aviso', () => {
    const view = toPreviewView(preview([fornLine], { readyCount: 1 }), [fornecedor], NONE, TODAY)
    assert.equal(view.summary.retentionCheckedCount, 0)
  })
})

// ── Data de pagamento no PASSADO (bloqueia gerar) ───────────────────────────────
//
// A data do Segmento A é o dia em que o banco EXECUTA. Um dia que já passou não é instrução que ele
// possa cumprir — e o pré-voo é o último ponto em que dá para corrigir sem queimar NSA.
//
// A comparação é sobre o `dueIso` CRU. O `due` de tela é DD/MM/YYYY, e re-parsear string formatada é
// onde se troca dia por mês; `YYYY-MM-DD` ordena lexicograficamente igual a cronologicamente.

describe('toPreviewView — data de pagamento no passado', () => {
  const linha = (id: string) => ({
    payableId: id,
    documentId: `d-${id}`,
    status: 'ready' as const,
    route: 'transfer' as const,
    gaps: [],
    valueCents: '10000',
  })

  it('⚠️ vencimento ANTERIOR a hoje marca paymentDateInPast', () => {
    const ontem = row('p1', 'Aprovado', { documentId: 'd-p1', due: '20/08/2026', dueIso: '2026-08-20' })
    const view = toPreviewView(preview([linha('p1')], { readyCount: 1 }), [ontem], NONE, '2026-08-21')
    assert.equal(view.summary.paymentDateInPast, true)
  })

  it('vencimento HOJE é válido — a regra é "de hoje em diante", não "depois de hoje"', () => {
    const hoje = row('p1', 'Aprovado', { documentId: 'd-p1', due: '21/08/2026', dueIso: '2026-08-21' })
    const view = toPreviewView(preview([linha('p1')], { readyCount: 1 }), [hoje], NONE, '2026-08-21')
    assert.equal(view.summary.paymentDateInPast, false)
  })

  it('vencimento futuro é válido', () => {
    const amanha = row('p1', 'Aprovado', { documentId: 'd-p1', due: '22/08/2026', dueIso: '2026-08-22' })
    const view = toPreviewView(preview([linha('p1')], { readyCount: 1 }), [amanha], NONE, '2026-08-21')
    assert.equal(view.summary.paymentDateInPast, false)
  })

  it('só os títulos MARCADOS contam — desmarcar o vencido libera a remessa', () => {
    const ok = row('p1', 'Aprovado', { documentId: 'd-p1', due: '22/08/2026', dueIso: '2026-08-22' })
    const vencido = row('p2', 'Aprovado', { documentId: 'd-p2', due: '20/08/2026', dueIso: '2026-08-20' })
    const linhas = [linha('p1'), linha('p2')]

    const comVencido = toPreviewView(preview(linhas, { readyCount: 2 }), [ok, vencido], NONE, '2026-08-21')
    assert.equal(comVencido.summary.paymentDateInPast, true)

    const semVencido = toPreviewView(
      preview(linhas, { readyCount: 2 }),
      [ok, vencido],
      new Set(['p2']),
      '2026-08-21',
    )
    assert.equal(semVencido.summary.paymentDateInPast, false)
  })

  it('título sem vencimento não é tratado como passado — ausência não é data vencida', () => {
    const semData = row('p1', 'Aprovado', { documentId: 'd-p1', due: '—', dueIso: null })
    const view = toPreviewView(preview([linha('p1')], { readyCount: 1 }), [semData], NONE, '2026-08-21')
    assert.equal(view.summary.paymentDateInPast, false)
  })

  it('⚠️ vira do ANO: 31/12 é passado para 01/01 do ano seguinte', () => {
    const reveillon = row('p1', 'Aprovado', { documentId: 'd-p1', due: '31/12/2026', dueIso: '2026-12-31' })
    const view = toPreviewView(preview([linha('p1')], { readyCount: 1 }), [reveillon], NONE, '2027-01-01')
    assert.equal(view.summary.paymentDateInPast, true)
  })

  it('passado e misturado são independentes — um não mascara o outro', () => {
    const a1 = row('p1', 'Aprovado', { documentId: 'd-p1', due: '19/08/2026', dueIso: '2026-08-19' })
    const a2 = row('p2', 'Aprovado', { documentId: 'd-p2', due: '20/08/2026', dueIso: '2026-08-20' })
    const view = toPreviewView(
      preview([linha('p1'), linha('p2')], { readyCount: 2 }),
      [a1, a2],
      NONE,
      '2026-08-21',
    )
    assert.equal(view.summary.paymentDateMixed, true)
    assert.equal(view.summary.paymentDateInPast, true)
  })
})

// ── Rota sem emissor: quem julga é o BACKEND ───────────────────────────────────
//
// ⚠️ [03/09] Este bloco mudou de sinal. Havia aqui uma MITIGAÇÃO DE TELA que barrava todo PIX
// (`ROUTES_WITHOUT_EMITTER`), porque o pré-voo dizia `ready`, o emissor recusava e o montador abortava
// o arquivo inteiro. Ela saiu: o core-api#837 fez o backend NOMEAR o caso (`no-issuer`) e o
// core-api#936 deu emissor ao PIX. Barrar PIX na tela agora esconderia uma remessa que o backend sabe
// gerar. A régua ficou onde deve estar — no backend —, e a tela só exibe o que ele responde.
describe('rota sem emissor: a tela não infere pela rota, obedece ao status do backend', () => {
  const pixRow = row('p-pix', 'Aprovado', {
    documentId: 'doc-pix',
    supplier: 'Fornecedor PIX',
    paymentMethod: 'PIX',
    netCents: '3700',
    grossCents: '3700',
  })
  const pixLine = {
    payableId: 'p-pix',
    documentId: 'doc-pix',
    status: 'ready' as const,
    route: 'pix' as const,
    gaps: [],
    valueCents: '3700',
  }

  it('PIX `ready` ENTRA na remessa — o emissor existe (core-api#936)', () => {
    // O assert oposto (`remittable: false`) foi o comportamento até 02/09. Está invertido de PROPÓSITO:
    // reintroduzir o bloqueio de tela por engano tem de quebrar o gate.
    const view = toPreviewView(preview([pixLine], { readyCount: 1 }), [pixRow], NONE, TODAY)
    const line = view.lines.find((l) => l.payableId === 'p-pix')
    assert.equal(line?.remittable, true)
    assert.equal(line?.checked, true)
    assert.equal(line?.pendencyTag, null)
  })

  it('a rota que o BACKEND marca `no-issuer` não entra, e a frase não pede correção de cadastro', () => {
    const guia = row('p-guia', 'Aprovado', { documentId: 'doc-guia', paymentMethod: 'GuiaRecolhimento' })
    const guiaLine = {
      payableId: 'p-guia',
      documentId: 'doc-guia',
      status: 'no-issuer' as const,
      route: 'tax-guide' as const,
      gaps: [],
      valueCents: '1000',
    }
    const view = toPreviewView(preview([guiaLine]), [guia], NONE, TODAY)
    const line = view.lines.find((l) => l.payableId === 'p-guia')
    assert.equal(line?.remittable, false)
    assert.equal(line?.pendencyTag, 'financial.remittance.preview.pendency.noIssuer')
  })

  it('as rotas com emissor seguem passando (transferência e boleto nunca foram barradas)', () => {
    const view = toPreviewView(preview([fornLine], { readyCount: 1 }), [fornecedor], NONE, TODAY)
    const line = view.lines.find((l) => l.payableId === 'p-forn')
    assert.equal(line?.remittable, true)
    assert.equal(line?.pendencyTag, null)
  })
})

// ── PIX é EXCLUSIVO (core-api#948 CA4) ─────────────────────────────────────────
//
// Decisão da P.O. em 03/09/2026: "habilita só em remessa com todas as transações com o pagamento do
// tipo Pix. Se acontecer de selecionar Pix e TED junto, o Pix deve ficar desmarcado."
//
// ⚠️ Estes testes exercitam as unidades (`selectionAllowsPix`/`applyPixExclusivity`) com linhas PIX
// REMISSÍVEIS — que `ROUTES_WITHOUT_EMITTER` ainda não deixa existir em tela. É de propósito: o dia em
// que o `'pix'` sair daquele conjunto, a régua entra em serviço JÁ PROVADA. Testar só por
// `toPreviewView` hoje provaria a inércia, e a inércia some justamente quando a régua passa a valer.

const PIX_NOT_EXCLUSIVE = 'financial.remittance.preview.pendency.pixNotExclusive'

/** Linha do pré-voo já julgada, com a rota ao lado — o insumo da segunda passada. */
const routed = (
  payableId: string,
  route: RoutedPreviewLine['route'],
  over: Partial<RoutedPreviewLine['view']> = {},
): RoutedPreviewLine => ({
  route,
  view: {
    payableId,
    documentId: `doc-${payableId}`,
    paymentMethodTag: null,
    documentNumber: `NF-${payableId}`,
    supplier: 'Fornecedor X',
    due: '10/07/2026',
    net: 'R$ 10,00',
    remittable: true,
    checked: true,
    pendencyTag: null,
    gaps: [],
    isRetention: false,
    ...over,
  },
})

describe('selectionAllowsPix', () => {
  it('seleção só de PIX permite; seleção mista não', () => {
    assert.equal(selectionAllowsPix(['pix', 'pix']), true)
    assert.equal(selectionAllowsPix(['pix', 'transfer']), false)
    assert.equal(selectionAllowsPix(['pix', 'billet']), false)
    assert.equal(selectionAllowsPix(['pix', 'tax-guide']), false)
  })

  it('seleção VAZIA permite — nada marcado não impede nada', () => {
    assert.equal(selectionAllowsPix([]), true)
  })

  it('rota DESCONHECIDA (`null`) barra o PIX — a régua exige que TODAS sejam PIX', () => {
    // Lado seguro da dúvida: uma rota que não sabemos qual é não prova que a remessa é exclusiva.
    assert.equal(selectionAllowsPix(['pix', null]), false)
  })
})

describe('applyPixExclusivity — o PIX cai, o resto segue', () => {
  it('seleção exclusiva de PIX: nada cai', () => {
    const { lines, droppedCount } = applyPixExclusivity([routed('a', 'pix'), routed('b', 'pix')])
    assert.equal(droppedCount, 0)
    assert.equal(
      lines.every((l) => l.remittable && l.checked && l.pendencyTag === null),
      true,
    )
  })

  it('PIX + TED: o PIX é desmarcado e diz por quê; o TED não é tocado', () => {
    const { lines, droppedCount } = applyPixExclusivity([routed('p-pix', 'pix'), routed('p-ted', 'transfer')])
    const byId = new Map(lines.map((l) => [l.payableId, l]))

    assert.equal(droppedCount, 1)
    assert.equal(byId.get('p-pix')?.remittable, false)
    assert.equal(byId.get('p-pix')?.checked, false)
    assert.equal(byId.get('p-pix')?.pendencyTag, PIX_NOT_EXCLUSIVE)

    // A assimetria é a decisão: quem cai é o PIX, nunca o TED. A remessa das outras formas segue.
    assert.equal(byId.get('p-ted')?.remittable, true)
    assert.equal(byId.get('p-ted')?.checked, true)
    assert.equal(byId.get('p-ted')?.pendencyTag, null)
  })

  it('desmarcar o não-PIX LIBERA o PIX — a régua lê o que está marcado AGORA', () => {
    // Sem isto o operador não teria como chegar a uma remessa PIX a partir de uma seleção mista sem
    // voltar ao grid e recomeçar.
    const { lines, droppedCount } = applyPixExclusivity([
      routed('p-pix', 'pix'),
      routed('p-ted', 'transfer', { checked: false }),
    ])
    assert.equal(droppedCount, 0)
    assert.equal(lines.find((l) => l.payableId === 'p-pix')?.remittable, true)
  })

  it('PIX já impedido por OUTRO motivo mantém a SUA pendência e não entra na contagem', () => {
    // Trocar a pendência verdadeira por "não é remessa exclusiva" esconderia o motivo que o operador
    // precisa ler atrás de um efeito colateral.
    const { lines, droppedCount } = applyPixExclusivity([
      routed('p-pix', 'pix', {
        remittable: false,
        checked: false,
        pendencyTag: 'financial.remittance.preview.pendency.missingData',
      }),
      routed('p-ted', 'transfer'),
    ])
    const pix = lines.find((l) => l.payableId === 'p-pix')

    assert.equal(droppedCount, 0)
    assert.equal(pix?.pendencyTag, 'financial.remittance.preview.pendency.missingData')
  })

  it('boleto e guia na seleção também derrubam o PIX (não é uma régua só sobre TED)', () => {
    assert.equal(applyPixExclusivity([routed('a', 'pix'), routed('b', 'billet')]).droppedCount, 1)
    assert.equal(applyPixExclusivity([routed('a', 'pix'), routed('b', 'tax-guide')]).droppedCount, 1)
  })
})

// A régua fim-a-fim, pelo caminho que a tela percorre de verdade: seleção do grid + pré-voo do BFF.
describe('toPreviewView — o PIX exclusivo, na composição inteira', () => {
  const pixRow = row('p-pix', 'Aprovado', {
    documentId: 'doc-pix',
    supplier: 'Fornecedor PIX',
    paymentMethod: 'PIX',
    netCents: '3700',
    grossCents: '3700',
  })
  const pixLine = {
    payableId: 'p-pix',
    documentId: 'doc-pix',
    status: 'ready' as const,
    route: 'pix' as const,
    gaps: [],
    valueCents: '3700',
  }

  it('PIX + TED: o PIX é desmarcado, diz por quê, e o aviso do topo conta 1', () => {
    const view = toPreviewView(
      preview([fornLine, pixLine], { readyCount: 2 }),
      [fornecedor, pixRow],
      NONE,
      TODAY,
    )
    const byId = new Map(view.lines.map((l) => [l.payableId, l]))

    assert.equal(byId.get('p-pix')?.remittable, false)
    assert.equal(byId.get('p-pix')?.checked, false)
    assert.equal(byId.get('p-pix')?.pendencyTag, PIX_NOT_EXCLUSIVE)
    assert.equal(view.summary.pixNotExclusiveCount, 1)

    // O TED segue: é a assimetria da decisão, e é o que garante que a remessa das outras formas não
    // pare por causa do PIX.
    assert.equal(byId.get('p-forn')?.checked, true)
    assert.equal(byId.get('p-forn')?.pendencyTag, null)
  })

  it('o PIX desmarcado SAI do totalizador da remessa (o total é dos marcados)', () => {
    const view = toPreviewView(
      preview([fornLine, pixLine], { readyCount: 2 }),
      [fornecedor, pixRow],
      NONE,
      TODAY,
    )
    // Só o título do fornecedor (R$ 1.407,75) — os R$ 37,00 do PIX não entram no que vai no arquivo.
    assert.equal(nbsp(view.summary.remittanceTotal), 'R$ 1.407,75')
    assert.equal(view.summary.checkedCount, 1)
  })

  it('seleção só de PIX: passa inteira, sem aviso', () => {
    const view = toPreviewView(preview([pixLine], { readyCount: 1 }), [pixRow], NONE, TODAY)
    assert.equal(view.lines.find((l) => l.payableId === 'p-pix')?.checked, true)
    assert.equal(view.summary.pixNotExclusiveCount, 0)
  })

  it('desmarcando o TED no grid, a seleção vira exclusiva e o PIX volta a ser operável', () => {
    // O 4º argumento é o conjunto de DESMARCADOS pelo operador. É o caminho de volta que a decisão
    // exige: sair de uma seleção mista para uma remessa PIX sem voltar ao grid e recomeçar.
    const view = toPreviewView(
      preview([fornLine, pixLine], { readyCount: 2 }),
      [fornecedor, pixRow],
      new Set(['p-forn']),
      TODAY,
    )
    const pix = view.lines.find((l) => l.payableId === 'p-pix')

    assert.equal(pix?.remittable, true)
    assert.equal(pix?.checked, true)
    assert.equal(view.summary.pixNotExclusiveCount, 0)
  })
})

// ── O COMPROVANTE: de qual conta e sob qual convênio a remessa saiu ────────────
//
// O comprovante dizia quanto, quando e em que arquivo — nunca POR QUAL CONTA. Numa organização com
// várias contas-cedente, "qual conta pagou?" é a primeira pergunta de quem vai conferir o extrato.
// E o convênio é o CONTRATO a que o NSA pertence: a sequência é dele, não da conta (core-api#943), e
// o mesmo convênio pode estar vinculado a várias contas — o que torna o NSA sozinho ambíguo na tela.

const conta = (over: Partial<ReconciliationAccount> = {}): ReconciliationAccount => ({
  id: 'acc-1',
  bankCode: '237',
  bankName: 'Bradesco',
  branch: '3456',
  accountNumber: '1234',
  accountDv: '3',
  alias: 'Espelho do golden',
  type: 'Corrente',
  typeLabel: null,
  status: 'Active',
  currentBalanceCents: '0',
  lastUpdatedAt: '',
  pendingCount: 0,
  openingBalanceCents: null,
  openingBalanceDate: null,
  convenio: '435366',
  document: '48123456000175',
  ...over,
})

const gerada = {
  files: [
    {
      remittanceId: 'r1',
      nsa: 7,
      fileName: 'PAG_435366..._000007.REM',
      totalCents: '300',
      objectKey: 'van/PAG_435366..._000007.REM',
      lineCount: 6,
    },
  ],
}

describe('accountLabel — uma fonte só para o seletor e para o comprovante', () => {
  it('apelido primeiro, banco/agência/conta em seguida', () => {
    assert.equal(accountLabel(conta()), 'Espelho do golden · 237 · Ag. 3456 · C/C 1234-3')
  })

  it('sem apelido, cai no nome do banco', () => {
    assert.equal(accountLabel(conta({ alias: '' })), 'Bradesco · 237 · Ag. 3456 · C/C 1234-3')
  })

  it('⚠️ o seletor usa a MESMA função — comprovante e escolha não podem divergir na grafia', () => {
    // Se cada um formatasse por conta própria, conferir "paguei por esta conta?" viraria comparar duas
    // grafias do mesmo dado. Este assert quebra se alguém duplicar a formatação.
    const [opcao] = toAccountOptions([conta()])
    assert.equal(opcao?.label, accountLabel(conta()))
  })
})

describe('toReceiptView — o comprovante descreve o ENVIO, não a tela', () => {
  it('carrega a conta e o convênio congelados no clique', () => {
    const view = toReceiptView(gerada, {
      paymentDate: '01/09/2026',
      account: accountLabel(conta()),
      convenio: '435366',
    })
    assert.equal(view.account, 'Espelho do golden · 237 · Ag. 3456 · C/C 1234-3')
    assert.equal(view.convenio, '435366')
    assert.equal(view.paymentDate, '01/09/2026')
  })

  it('⚠️ usa o que foi ENVIADO, e não relê a conta escolhida agora', () => {
    // O seletor segue editável com o comprovante aberto. Se o operador trocar a conta depois de gerar,
    // o comprovante tem de continuar nomeando a que PAGOU — um comprovante que aponta a conta errada é
    // pior que um sem conta nenhuma.
    const view = toReceiptView(gerada, {
      paymentDate: '01/09/2026',
      account: 'Conta que PAGOU · 237 · Ag. 3456 · C/C 1234-3',
      convenio: '435366',
    })
    assert.equal(view.account, 'Conta que PAGOU · 237 · Ag. 3456 · C/C 1234-3')
  })

  it('convênio vazio vira traço, nunca string vazia', () => {
    // Na prática não acontece — o binding só oferece contas com convênio, porque sem ele não há
    // remessa. O traço existe para o dia em que essa garantia mudar de lugar.
    const view = toReceiptView(gerada, { paymentDate: '01/09/2026', account: 'X', convenio: '' })
    assert.equal(view.convenio, '—')
  })
})
