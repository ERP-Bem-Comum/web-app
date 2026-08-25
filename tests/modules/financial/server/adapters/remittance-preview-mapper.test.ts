/**
 * Borda do PRÉ-VOO da remessa (puro, node:test) — core-api#794/#804.
 *
 * O que se prova aqui é a política de INTOLERÂNCIA do schema, que é deliberada e contrária ao resto do
 * módulo (onde enums e campos derivados são drift-tolerantes):
 *
 *  - **contador ausente NÃO é tolerado.** Um `readyCount` aceito como zero diria "nada a enviar" a quem
 *    tem título para pagar — o silêncio aqui é pior que a falha, e por isso vira `err('server')`.
 *  - **`valueCents` (o valor DO TÍTULO, renomeado de `netValueCents`) não tem default.** Se o backend
 *    regredir o nome, a tela precisa falhar alto em vez de exibir R$ 0,00 num comprovante de pagamento.
 *
 * E que campo DESCONHECIDO do backend passa sem ruído: o core-api#804 devolve `batches[]` (a composição
 * dos lotes), que não lemos — a P.O. avaliou o painel em tela e concluiu que não acrescenta à
 * conferência. Ignorar não pode custar a conferência inteira.
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
  readyCount: 1,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  notApprovedCount: 0,
  readyTotalCents: '25000',
  blockedTotalCents: '0',
  ...over,
})

describe('previewToModel — o que se tolera', () => {
  it('campo que não lemos (`batches` do #804) passa sem derrubar a conferência', () => {
    const r = previewToModel(
      raw({
        batches: [
          {
            launchForm: '41',
            launchFormLabel: 'TED outra titularidade',
            payeeBankCode: '341',
            count: 1,
            totalCents: '25000',
          },
        ],
      }),
    )
    assert.ok(isOk(r))
    assert.equal(r.value.lines.length, 1)
    assert.equal(r.value.readyCount, 1)
  })
})

describe('previewToModel — status da linha', () => {
  // core-api#792/ADR-0065 §5. Este caso existe porque o defeito que ele prende era INVISÍVEL: o
  // fallback de drift manda status desconhecido para `blocked`, que é o default seguro para o
  // dinheiro — a linha não entra na remessa. Mas para quem opera, `blocked` significa "corrija o
  // cadastro", e não havia cadastro a corrigir: o título já tinha sido pago. O operador ficava
  // olhando um cadastro completo sem entender a linha vermelha.
  it('`transmitted` é status PRÓPRIO, não cai no fallback de `blocked`', () => {
    const r = previewToModel(raw({ lines: [{ ...line, status: 'transmitted' }] }))
    assert.ok(isOk(r))
    assert.equal(r.value.lines[0]?.status, 'transmitted')
  })

  it('status realmente desconhecido continua caindo em `blocked` — o default seguro é "não sai"', () => {
    const r = previewToModel(raw({ lines: [{ ...line, status: 'algo-que-nao-existe' }] }))
    assert.ok(isOk(r))
    assert.equal(r.value.lines[0]?.status, 'blocked')
  })

  // O contador novo do #792 é ignorado de propósito (o fato já vem por linha). Se um dia alguém
  // decidir lê-lo, que seja por escolha — não porque o schema o deixou entrar sem querer.
  it('`transmittedCount` do backend passa sem derrubar a conferência, e não é lido', () => {
    const r = previewToModel(raw({ transmittedCount: 3 }))
    assert.ok(isOk(r))
    assert.ok(!('transmittedCount' in r.value))
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
