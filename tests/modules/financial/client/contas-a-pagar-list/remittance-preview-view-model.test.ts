/**
 * ViewModel do pré-voo da remessa (VAN, core-api#728) — PURO (node:test, imports relativos).
 *
 * O que estes testes travam, em ordem de importância:
 *  1. só Aprovado vira candidato (o core-api NÃO filtra por status — um Rascunho voltaria como `ready`);
 *  2. dedup por documento (o grid é por título: pai + impostos filhos = 1 linha na remessa);
 *  3. os impedidos aparecem ANTES dos prontos (quem confere quer ver o que precisa de ação);
 *  4. `blockedTotal` NÃO absorve o fora-da-VAN (decisão do core-api, e o front não pode "corrigir").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveRemittanceSelection,
  toPreviewView,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/remittance-preview.view-model.ts'
import type { GridRow } from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import type { RemittancePreview } from '../../../../../src/modules/financial/client/data/model/remittance.model.ts'

const row = (id: string, status: GridRow['status'], documentId = id, supplier = 'Fornecedor X'): GridRow => ({
  id,
  documentId,
  type: 'NFS-e',
  documentNumber: `NF-${documentId}`,
  series: null,
  supplier,
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
})

const selectionOf = (...ids: readonly string[]): ReadonlySet<string> => new Set(ids)

/** `Intl` separa "R$" do número com espaço NÃO-QUEBRÁVEL (U+00A0). Normaliza p/ comparar com literal. */
const nbsp = (s: string): string => s.replace(/\u00A0/g, ' ')

describe('deriveRemittanceSelection', () => {
  it('só Aprovado é candidato — Rascunho/Aberto/Pago ficam de fora e são contados', () => {
    const rows = [row('a', 'Aprovado'), row('b', 'Rascunho'), row('c', 'Aberto'), row('d', 'Pago')]
    const out = deriveRemittanceSelection(rows, selectionOf('a', 'b', 'c', 'd'))
    assert.deepEqual(out.documentIds, ['a'])
    assert.equal(out.notApprovedCount, 3)
  })

  it('dedup por documento: pai + filho do MESMO documento viram 1 id', () => {
    const rows = [row('pai', 'Aprovado', 'doc-1'), row('filho-iss', 'Aprovado', 'doc-1')]
    const out = deriveRemittanceSelection(rows, selectionOf('pai', 'filho-iss'))
    assert.deepEqual(out.documentIds, ['doc-1'])
    assert.equal(out.notApprovedCount, 0)
  })

  it('ignora linha não selecionada', () => {
    const rows = [row('a', 'Aprovado'), row('b', 'Aprovado')]
    assert.deepEqual(deriveRemittanceSelection(rows, selectionOf('b')).documentIds, ['b'])
  })

  it('seleção vazia → nada a conferir (a tela desabilita o botão a partir daqui)', () => {
    const out = deriveRemittanceSelection([row('a', 'Aprovado')], selectionOf())
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

describe('toPreviewView', () => {
  it('enriquece a linha com fornecedor/número vindos do GRID (o pré-voo devolve só o id)', () => {
    const rows = [row('t1', 'Aprovado', 'doc-1', 'Padaria Real')]
    const view = toPreviewView(
      preview([{ documentId: 'doc-1', status: 'ready', route: 'pix', gaps: [], netValueCents: '25000' }], {
        readyCount: 1,
        readyTotalCents: '25000',
      }),
      rows,
    )
    const line = view.lines[0]
    assert.equal(line?.supplier, 'Padaria Real')
    assert.equal(line?.documentNumber, 'NF-doc-1')
    assert.equal(nbsp(line?.net ?? ''), 'R$ 250,00')
    assert.equal(line?.routeTag, 'financial.remittance.preview.route.pix')
  })

  it('documento que sumiu do grid não quebra a linha — cai em "—"', () => {
    const view = toPreviewView(
      preview([{ documentId: 'fantasma', status: 'not-found', route: null, gaps: [], netValueCents: '0' }], {
        notFoundCount: 1,
      }),
      [],
    )
    assert.equal(view.lines[0]?.supplier, '—')
    assert.equal(view.lines[0]?.routeTag, null)
  })

  it('ordena impedidos primeiro, prontos por último', () => {
    const lines: RemittancePreview['lines'] = [
      { documentId: 'r', status: 'ready', route: 'pix', gaps: [], netValueCents: '100' },
      { documentId: 'n', status: 'not-found', route: null, gaps: [], netValueCents: '0' },
      { documentId: 'o', status: 'out-of-van', route: null, gaps: [], netValueCents: '100' },
      { documentId: 'b', status: 'blocked', route: 'transfer', gaps: [], netValueCents: '100' },
    ]
    const view = toPreviewView(preview(lines), [])
    assert.deepEqual(
      view.lines.map((l) => l.documentId),
      ['b', 'o', 'n', 'r'],
    )
  })

  it('cada lacuna vira campo + motivo (tags distintas) — a tela aponta o input, não uma frase', () => {
    const view = toPreviewView(
      preview([
        {
          documentId: 'doc-1',
          status: 'blocked',
          route: 'transfer',
          gaps: [
            { field: 'payee-agency', reason: 'missing' },
            { field: 'payee-account-digit', reason: 'malformed' },
          ],
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
      {
        fieldTag: 'financial.remittance.preview.field.accountDigit',
        reasonTag: 'financial.remittance.preview.reason.malformed',
      },
    ])
  })

  it('os totais vêm do BACKEND — o front não recalcula, e o impedido não absorve o fora-da-VAN', () => {
    const view = toPreviewView(
      preview(
        [
          { documentId: 'b', status: 'blocked', route: null, gaps: [], netValueCents: '640000' },
          { documentId: 'o', status: 'out-of-van', route: null, gaps: [], netValueCents: '999999' },
        ],
        { blockedCount: 1, outOfVanCount: 1, blockedTotalCents: '640000' },
      ),
      [],
    )
    assert.equal(nbsp(view.blockedTotal), 'R$ 6.400,00') // sem o out-of-van somado
    assert.equal(view.outOfVanCount, 1)
  })

  it('canGenerate exige ao menos um pronto (sem apto, não há remessa a gerar)', () => {
    const nada = toPreviewView(preview([], { blockedCount: 2 }), [])
    assert.equal(nada.canGenerate, false)
    const algum = toPreviewView(preview([], { readyCount: 1 }), [])
    assert.equal(algum.canGenerate, true)
  })
})
