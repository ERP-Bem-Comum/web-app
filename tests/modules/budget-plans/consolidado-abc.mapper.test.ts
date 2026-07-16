/**
 * Consolidado ABC real (feature 062) — mapeamento da resposta do core-api + derivações puras do ViewModel.
 * Cobre:
 *   1. `parseConsolidatedResult` sobre a resposta REAL (`totalCents`→`totalInCents`, `plans[]`) e o rejeito;
 *   2. `deriveConsolidadoHeader` ("{ano} ABC" + total BRL);
 *   3. o subtotal do programa filtrado no cabeçalho (handbook §2 + print do legado).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseConsolidatedResult } from '#modules/budget-plans/server/adapters/core-api/consolidado-result.schema.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import { deriveConsolidadoHeader } from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.view-model.ts'

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

// Handbook §2 + print do legado: "2026 ABC / Total: R$ 25.824.688,03 / **Programa PARC: R$ 25.824.688,03**"
// — o subtotal só aparece quando há UM programa (filtro aplicado).
describe('deriveConsolidadoHeader — subtotal do programa filtrado', () => {
  const abc = (plans: ConsolidatedAbc['plans'], totalInCents: number): ConsolidatedAbc => ({
    year: 2026,
    totalInCents,
    plans,
    costCenters: [],
  })
  const plano = (abbr: string, cents: number): ConsolidatedAbc['plans'][number] => ({
    id: `p-${abbr}`,
    programName: abbr,
    programAbbreviation: abbr,
    version: 1,
    totalInCents: cents,
  })

  it('UM programa (filtrado) → "Programa {SIGLA}: R$ …"', () => {
    const h = deriveConsolidadoHeader(abc([plano('PARC', 2_582_468_803)], 2_582_468_803))
    // `includes` e não igualdade: o formatador pt-BR usa espaço NÃO-QUEBRÁVEL depois do "R$".
    assert.ok(h.programSubtotalLabel?.startsWith('Programa PARC: R$'))
    assert.ok(h.programSubtotalLabel?.includes('25.824.688,03'))
  })

  // Repetir o total como "subtotal" logo abaixo dele não informa nada — só polui.
  it('VÁRIOS programas → sem subtotal', () => {
    const h = deriveConsolidadoHeader(abc([plano('ETI', 100), plano('EPV', 50)], 150))
    assert.equal(h.programSubtotalLabel, null)
  })

  it('nenhum programa → sem subtotal (nem título de programa inventado)', () => {
    assert.equal(deriveConsolidadoHeader(abc([], 0)).programSubtotalLabel, null)
  })

  it('o título e o total geral seguem intactos', () => {
    const h = deriveConsolidadoHeader(abc([plano('ETI', 100)], 100))
    assert.equal(h.title, '2026 ABC')
    assert.ok(h.totalLabel.includes('1,00'))
  })
})
