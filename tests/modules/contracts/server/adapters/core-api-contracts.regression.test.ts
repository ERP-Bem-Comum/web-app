/**
 * REGRESSÃO — code-review (TICKET-001): achados C3 e M7.
 *
 * ⚠️ FALHAM DE PROPÓSITO até a correção. Ticket:
 * handbook/reviews/TICKET-001-contracts-detail-and-partners-correcoes.md
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { apiContractDetailToDomain } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'
import { MoneySchema } from '#modules/contracts/client/data/model/contracts.model.ts'

// ─── C3 — mapper de response retorna Result, não lança (ADR-0002, errors-as-values) ─────
describe('C3 — apiContractDetailToDomain não lança em response inválido', () => {
  it('c3-mapper-retorna-result-err: input inválido → Result.err (sem throw)', () => {
    let threw = false
    let result: unknown
    try {
      // Shape que não bate nem detalhe nem list-item → hoje cai no `throw new Error(...)`.
      result = apiContractDetailToDomain({ shape: 'invalido' })
    } catch {
      threw = true
    }
    assert.equal(
      threw,
      false,
      'apiContractDetailToDomain deve CONVERTER falha de parse em Result.err, não lançar (C3 / ADR-0002).',
    )
    assert.equal(
      (result as { ok?: boolean } | undefined)?.ok,
      false,
      'Com response inválido, o mapper deve retornar Result.err ({ ok: false }).',
    )
  })
})

// ─── M7 — Money.cents não pode ser negativo ──────────────────────────────────
describe('M7 — Money rejeita centavos negativos', () => {
  it('m7-money-rejeita-negativo: MoneySchema.safeParse({ cents: -1 }) deve falhar', () => {
    assert.equal(
      MoneySchema.safeParse({ cents: -1 }).success,
      false,
      'O valor de contrato é ≥ 0: use z.int().nonnegative() em MoneySchema (M7).',
    )
  })

  it('m7-money-aceita-zero-e-positivo (sanidade)', () => {
    assert.equal(MoneySchema.safeParse({ cents: 0 }).success, true)
    assert.equal(MoneySchema.safeParse({ cents: 150_00 }).success, true)
  })
})
