/**
 * Borda do PRÉ-VOO da remessa (puro, node:test) — core-api#794/#804.
 *
 * O que se prova aqui são as DUAS POLÍTICAS de tolerância do schema, que são deliberadamente opostas:
 *
 *  - **`batches` ausente é tolerado** (`.catch([])`). O backend passou a repartir a seleção em lotes na
 *    #804; um ambiente ainda sem isso não pode derrubar a conferência inteira, e um painel omitido não
 *    afirma nada de errado sobre o arquivo.
 *  - **contador ausente NÃO é tolerado.** Um `readyCount` aceito como zero diria "nada a enviar" a quem
 *    tem título para pagar — o silêncio aqui é pior que a falha, e por isso vira `err('server')`.
 *
 * E também que `valueCents` (o valor DO TÍTULO, renomeado de `netValueCents`) não tem default: se o
 * backend regredir o nome, a tela precisa falhar alto em vez de exibir R$ 0,00.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { previewToModel } from '../../../../../src/modules/financial/server/adapters/core-api/remittance.mappers.ts'
import { isOk, isErr } from '../../../../../src/shared/primitives/result.ts'

const line = {
  payableId: 'p-1',
  documentId: 'd-1',
  status: 'ready',
  route: 'pix',
  gaps: [],
  valueCents: '25000',
}

const raw = (over: Record<string, unknown> = {}): unknown => ({
  lines: [line],
  batches: [
    {
      launchForm: '41',
      launchFormLabel: 'TED outra titularidade',
      payeeBankCode: '341',
      count: 1,
      totalCents: '25000',
    },
  ],
  readyCount: 1,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  notApprovedCount: 0,
  readyTotalCents: '25000',
  blockedTotalCents: '0',
  ...over,
})

describe('previewToModel — composição dos lotes (#804)', () => {
  it('passa os lotes RETO: o rótulo já vem em PT-BR do emissor, e o front não reagrupa', () => {
    const r = previewToModel(raw())
    assert.ok(isOk(r))
    assert.deepEqual(r.value.batches, [
      {
        launchForm: '41',
        launchFormLabel: 'TED outra titularidade',
        payeeBankCode: '341',
        count: 1,
        totalCents: '25000',
      },
    ])
  })

  it('boleto sem banco de destino (Segmento J) chega como null, não como erro', () => {
    const r = previewToModel(
      raw({
        batches: [
          {
            launchForm: '30',
            launchFormLabel: 'Boleto do próprio banco',
            payeeBankCode: null,
            count: 2,
            totalCents: '50000',
          },
        ],
      }),
    )
    assert.ok(isOk(r))
    assert.equal(r.value.batches[0]?.payeeBankCode, null)
  })

  it('backend SEM lotes não derruba a conferência — só não há painel a desenhar', () => {
    const { batches: _omit, ...semLotes } = raw() as Record<string, unknown>
    const r = previewToModel(semLotes)
    assert.ok(isOk(r))
    assert.deepEqual(r.value.batches, [])
    // O resto da conferência continua inteiro: é isso que a tolerância protege.
    assert.equal(r.value.lines.length, 1)
    assert.equal(r.value.readyCount, 1)
  })
})

describe('previewToModel — o que NÃO se tolera', () => {
  it('⚠️ contador ausente falha alto: um zero aceito diria "nada a enviar" a quem tem o que pagar', () => {
    const { readyCount: _omit, ...semContador } = raw() as Record<string, unknown>
    const r = previewToModel(semContador)
    assert.ok(isErr(r))
    assert.equal(r.error, 'server')
  })

  it('⚠️ `valueCents` ausente falha alto — sem default, a renomeação não passa em silêncio', () => {
    const r = previewToModel(raw({ lines: [{ ...line, valueCents: undefined }] }))
    assert.ok(isErr(r))
    assert.equal(r.error, 'server')
  })
})
