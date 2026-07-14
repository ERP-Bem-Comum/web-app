/**
 * ViewModel puro da contrapartida esperada (US2 do #269) — node:test. Cobre a formatação de apresentação
 * (centavos-string → BRL, ISO → DD/MM/AAAA, score → "%"+banda) e a ordenação determinística (score desc;
 * empate → mais antiga por expectedDate asc), espelhando o tie-break do backend.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  counterpartBand,
  sortCounterparts,
  toCounterpartRow,
  toCounterpartRows,
} from '#modules/financial/client/reconciliation-workspace/counterpart.view-model.ts'
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type { CounterpartSuggestion } from '#modules/financial/client/data/model/reconciliation.model.ts'

const make = (o: Partial<CounterpartSuggestion>): CounterpartSuggestion => ({
  counterpartId: o.counterpartId ?? 'c1',
  originAccountRef: o.originAccountRef ?? 'acc-1',
  valueCents: o.valueCents ?? '150050',
  expectedDate: o.expectedDate ?? '2026-06-18T00:00:00.000Z',
  score: o.score ?? 90,
})

describe('counterpartBand', () => {
  it('score >= 80 → alta; abaixo → media', () => {
    assert.equal(counterpartBand(80), 'alta')
    assert.equal(counterpartBand(100), 'alta')
    assert.equal(counterpartBand(79), 'media')
    assert.equal(counterpartBand(0), 'media')
  })
})

describe('toCounterpartRow', () => {
  it('formata valor (centavos-string → BRL), data (ISO → DD/MM/AAAA), score e banda', () => {
    const row = toCounterpartRow(
      make({ valueCents: '150050', expectedDate: '2026-06-18T00:00:00.000Z', score: 92 }),
    )
    assert.equal(row.valueBRL, centsToBRL('150050')) // sem hard-code (evita NBSP do Intl)
    assert.equal(row.expectedDateBR, '18/06/2026')
    assert.equal(row.scorePct, '92%')
    assert.equal(row.band, 'alta')
    assert.equal(row.counterpartId, 'c1')
    assert.equal(row.originAccountRef, 'acc-1')
  })

  it('aceita data date-only (sem componente de hora)', () => {
    const row = toCounterpartRow(make({ expectedDate: '2026-01-05' }))
    assert.equal(row.expectedDateBR, '05/01/2026')
  })
})

describe('sortCounterparts', () => {
  it('ordena por score desc; empate → expectedDate asc (mais antiga primeiro)', () => {
    const items = [
      make({ counterpartId: 'a', score: 70, expectedDate: '2026-06-10' }),
      make({ counterpartId: 'b', score: 90, expectedDate: '2026-06-20' }),
      make({ counterpartId: 'c', score: 90, expectedDate: '2026-06-05' }), // empate com b → vem antes
    ]
    const ordered = sortCounterparts(items).map((s) => s.counterpartId)
    assert.deepEqual(ordered, ['c', 'b', 'a'])
  })

  it('não muta a lista de entrada', () => {
    const items = [make({ counterpartId: 'a', score: 10 }), make({ counterpartId: 'b', score: 99 })]
    const before = items.map((s) => s.counterpartId)
    sortCounterparts(items)
    assert.deepEqual(
      items.map((s) => s.counterpartId),
      before,
    )
  })
})

describe('toCounterpartRows', () => {
  it('ordena e formata em uma passada', () => {
    const rows = toCounterpartRows([
      make({ counterpartId: 'a', score: 60, valueCents: '100' }),
      make({ counterpartId: 'b', score: 95, valueCents: '200' }),
    ])
    assert.equal(rows[0]?.counterpartId, 'b')
    assert.equal(rows[0]?.band, 'alta')
    assert.equal(rows[1]?.band, 'media')
  })
})
