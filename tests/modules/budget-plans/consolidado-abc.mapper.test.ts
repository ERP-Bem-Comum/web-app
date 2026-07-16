/**
 * Consolidado ABC real (feature 062) — mapeamento da resposta do core-api + derivações puras do ViewModel.
 * Cobre:
 *   1. `parseConsolidatedResult` sobre a resposta REAL (`totalCents`→`totalInCents`, `plans[]`) e o rejeito;
 *   2. `deriveConsolidadoHeader` ("{ano} ABC" + total BRL);
 *   3. `deriveConsolidadoCurve` (ordena por contribuição desc + participação % + total 0 → 0%).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseConsolidatedResult } from '#modules/budget-plans/server/adapters/core-api/consolidado-result.schema.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import {
  deriveConsolidadoHeader,
  deriveConsolidadoCurve,
  hasConsolidadoResult,
} from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.view-model.ts'

const REAL_RESPONSE = {
  year: 2026,
  totalCents: 300_000,
  plans: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      programName: 'Parcerias',
      programAbbreviation: 'PARC',
      version: 1,
      totalCents: 100_000,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      programName: 'Ensino de Tempo Integral',
      programAbbreviation: 'ETI',
      version: 2,
      totalCents: 200_000,
    },
  ],
  costCenters: [],
}

describe('parseConsolidatedResult (borda do core-api)', () => {
  it('mapeia totalCents→totalInCents e os planos', () => {
    const parsed = parseConsolidatedResult(REAL_RESPONSE)
    assert.notEqual(parsed, null)
    if (parsed === null) return
    assert.equal(parsed.year, 2026)
    assert.equal(parsed.totalInCents, 300_000)
    assert.equal(parsed.plans.length, 2)
    assert.equal(parsed.plans[0]?.programAbbreviation, 'PARC')
    assert.equal(parsed.plans[0]?.totalInCents, 100_000)
  })

  it('devolve null quando o payload não bate o contrato', () => {
    assert.equal(parseConsolidatedResult({ year: 2026 }), null)
    assert.equal(parseConsolidatedResult(null), null)
  })
})

describe('deriveConsolidadoHeader', () => {
  it('monta "{ano} ABC" + total em BRL', () => {
    const parsed = parseConsolidatedResult(REAL_RESPONSE)
    assert.notEqual(parsed, null)
    if (parsed === null) return
    const header = deriveConsolidadoHeader(parsed)
    assert.equal(header.title, '2026 ABC')
    assert.equal(header.totalLabel.includes('3.000,00'), true)
  })
})

describe('deriveConsolidadoCurve', () => {
  const parsed = parseConsolidatedResult(REAL_RESPONSE) as ConsolidatedAbc

  it('ordena por contribuição desc e calcula a participação', () => {
    const rows = deriveConsolidadoCurve(parsed)
    assert.equal(rows[0]?.program, 'ETI') // 200k > 100k → primeiro
    assert.equal(rows[0]?.sharePct, (200_000 / 300_000) * 100)
    assert.equal(rows[0]?.shareLabel, '66,7%')
    assert.equal(rows[0]?.versionLabel, 'v2')
    assert.equal(rows[1]?.program, 'PARC')
    assert.equal(rows[1]?.shareLabel, '33,3%')
  })

  it('participação = 0% quando o total do ano é 0 (planos aprovados sem orçamento, core-api#394)', () => {
    const zero: ConsolidatedAbc = {
      year: 2026,
      totalInCents: 0,
      plans: [
        { id: 'a', programName: 'Parcerias', programAbbreviation: 'PARC', version: 1, totalInCents: 0 },
      ],
      costCenters: [],
    }
    assert.equal(hasConsolidadoResult(zero), true)
    const rows = deriveConsolidadoCurve(zero)
    assert.equal(rows[0]?.sharePct, 0)
    assert.equal(rows[0]?.shareLabel, '0,0%')
  })
})
