/**
 * Testes da ViewModel PURA aplicada ao relatório "Posição de Recebimentos" (node:test — sem DOM). O engine é
 * o MESMO da Posição de Pagamentos (agregação NEUTRA); aqui cobrimos a FONTE 'r' e o CSV de recebimentos:
 *   (1) `loadPosicao('r')` agrega o placeholder de RECEBIMENTOS (financiadores → CC → categoria);
 *   (2) o Total Geral bate com a soma direta das linhas cruas do placeholder;
 *   (3) caso VAZIO (fonte `[]` — quando o placeholder for removido) → 0 nós e totais 0 (empty-state-ready);
 *   (4) o CSV de recebimentos usa o header pt-BR "Financiador;…;Recebido;A receber" (corpo idêntico).
 *
 * As 3 medidas são NEUTRAS no shape (mesmas chaves de Pagamentos): emAtraso (não recebido + vencido),
 * pago (=Recebido), aPagar (=A receber).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  aggregatePosicao,
  loadPosicao,
  measureTotal,
  buildCsv,
  formatBRL,
  CSV_HEADER_RECEBIMENTOS,
} from '#modules/reports/client/posicao.view-model.ts'
import { POSICAO_RECEBIMENTOS_RAW } from '#modules/reports/client/data/posicao-recebimentos.placeholder.ts'

describe("loadPosicao('r') — fonte de RECEBIMENTOS (front-first)", () => {
  it('agrega o placeholder de recebimentos (vários financiadores, total > 0)', () => {
    const r = loadPosicao('r')
    assert.ok(r.suppliers.length >= 4, 'placeholder tem vários financiadores')
    assert.ok(measureTotal(r.totals) > 0)
  })

  it('o Total Geral bate com a soma direta das linhas cruas do placeholder de recebimentos', () => {
    const r = loadPosicao('r')
    const sum = POSICAO_RECEBIMENTOS_RAW.reduce(
      (acc, row) => ({
        emAtrasoCents: acc.emAtrasoCents + row.emAtrasoCents,
        pagoCents: acc.pagoCents + row.pagoCents,
        aPagarCents: acc.aPagarCents + row.aPagarCents,
      }),
      { emAtrasoCents: 0, pagoCents: 0, aPagarCents: 0 },
    )
    assert.equal(r.totals.emAtrasoCents, sum.emAtrasoCents)
    assert.equal(r.totals.pagoCents, sum.pagoCents)
    assert.equal(r.totals.aPagarCents, sum.aPagarCents)
  })
})

describe('Posição de Recebimentos — caso VAZIO (empty-state-ready)', () => {
  it('fonte vazia (`[]`) → 0 nós e totais 0 (a tela cai no empty state honesto)', () => {
    // Simula a REMOÇÃO do placeholder (quando o Contas a Receber subir, `loadPosicao('r')` agregará `[]`).
    const r = aggregatePosicao([])
    assert.equal(r.suppliers.length, 0)
    assert.equal(measureTotal(r.totals), 0)
    assert.equal(r.totals.emAtrasoCents, 0)
    assert.equal(r.totals.pagoCents, 0)
    assert.equal(r.totals.aPagarCents, 0)
  })
})

describe('buildCsv — CSV de recebimentos (header pt-BR do lado de receber)', () => {
  it('a 1ª linha é o header de recebimentos (Financiador · Recebido · A receber)', () => {
    const lines = buildCsv(loadPosicao('r'), CSV_HEADER_RECEBIMENTOS).split('\r\n')
    assert.equal(lines[0], CSV_HEADER_RECEBIMENTOS)
    assert.equal(lines[0], 'Financiador;Centro de custo;Categoria;Em atraso;Recebido;A receber')
  })

  it('emite uma linha por FOLHA (categoria) + o header', () => {
    const lines = buildCsv(loadPosicao('r'), CSV_HEADER_RECEBIMENTOS).split('\r\n')
    assert.equal(lines.length, 1 + POSICAO_RECEBIMENTOS_RAW.length)
  })

  it('a 1ª folha traz financiador/CC/categoria + as 3 medidas em BRL', () => {
    const first = POSICAO_RECEBIMENTOS_RAW[0]
    assert.ok(first, 'placeholder não vazio')
    const lines = buildCsv(loadPosicao('r'), CSV_HEADER_RECEBIMENTOS).split('\r\n')
    assert.equal(
      lines[1],
      `"${first.supplier}";"${first.costCenter}";"${first.category}";"${formatBRL(first.emAtrasoCents)}";"${formatBRL(first.pagoCents)}";"${formatBRL(first.aPagarCents)}"`,
    )
  })
})
