/**
 * Testes do ViewModel puro de "Calculando Gastos" (US2.4b): espelha Centro→Categoria→Subcategoria com os
 * 12 meses; MONTH_NAMES em Title Case; soma dos meses.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  buildCalcGastosCentros,
  sumMonths,
  MONTH_NAMES,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/calc-gastos.view-model.ts'

const m = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const detail: PlanDetail = {
  id: 1,
  year: 2026,
  programName: 'ETI',
  programAbbreviation: 'ETI',
  version: 1.1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 100,
  networks: [],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 100,
      monthlyInCents: m({ 2: 100 }),
      networkInCents: [],
      categories: [
        {
          id: 11,
          name: 'Educacional',
          totalInCents: 100,
          monthlyInCents: m({ 2: 100 }),
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              name: 'Formação',
              totalInCents: 100,
              monthlyInCents: m({ 2: 100 }),
              networkInCents: [],
            },
          ],
        },
      ],
    },
  ],
}

describe('MONTH_NAMES', () => {
  it('12 meses em Title Case, Janeiro..Dezembro', () => {
    assert.equal(MONTH_NAMES.length, 12)
    assert.equal(MONTH_NAMES[0], 'Janeiro')
    assert.equal(MONTH_NAMES[11], 'Dezembro')
  })
})

describe('buildCalcGastosCentros', () => {
  it('espelha Centro→Categoria→Subcategoria com os 12 meses', () => {
    const centros = buildCalcGastosCentros(detail)
    assert.equal(centros.length, 1)
    const c = centros[0]
    assert.ok(c !== undefined)
    assert.equal(c.name, 'Consultoria')
    const cat = c.categories[0]
    assert.ok(cat !== undefined)
    assert.equal(cat.name, 'Educacional')
    const sub = cat.subCategories[0]
    assert.ok(sub !== undefined)
    assert.equal(sub.name, 'Formação')
    assert.equal(sub.monthsInCents.length, 12)
    assert.equal(sub.monthsInCents[1], 100) // Fevereiro
    assert.equal(sumMonths(sub.monthsInCents), 100)
  })
})
