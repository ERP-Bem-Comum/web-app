/**
 * Testes do ViewModel puro do Detalhe do plano — matrizes "Consolidado por Mês" (semestre) e "Por Rede"
 * (parceiros) + cabeçalho. Valores fiéis ao mapa (ETI 1.2 > Consultoria: Fev/Mar R$ 16.219,36 →
 * total R$ 32.438,72; Por Rede = coluna ACRE).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  buildMonthlyMatrix,
  buildNetworkMatrix,
  derivePlanDetailHeader,
  MONTH_HEADERS,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

const NBSP = String.fromCharCode(160)
const norm = (s: string): string => s.split(NBSP).join(' ')

/** Acesso seguro a índice (evita non-null assertion) — falha o teste se ausente. */
const at = <T>(arr: readonly T[], i: number): T => {
  const v = arr[i]
  assert.ok(v !== undefined, `índice ${String(i)} ausente`)
  return v
}

const m = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const consult = m({ 2: 1_621_936, 3: 1_621_936 })

const detail: PlanDetail = {
  id: 3,
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1.2,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 3_243_872,
  networks: [{ id: 1, name: 'Acre' }],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 3_243_872,
      monthlyInCents: consult,
      networkInCents: [3_243_872],
      categories: [
        {
          id: 11,
          name: 'Consultoria Educacional',
          totalInCents: 3_243_872,
          monthlyInCents: consult,
          networkInCents: [3_243_872],
          subCategories: [
            {
              id: 111,
              name: 'Formação de professores',
              totalInCents: 3_243_872,
              monthlyInCents: consult,
              networkInCents: [3_243_872],
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Comunicação',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: m({}),
      networkInCents: [0],
      categories: [],
    },
  ],
}

describe('derivePlanDetailHeader', () => {
  it('título, status e total', () => {
    const h = derivePlanDetailHeader(detail)
    assert.equal(h.title, '2026 ETI 1.2')
    assert.deepEqual(h.status, { label: 'Rascunho', tone: 'neutral' })
    assert.equal(norm(h.totalLabel), 'R$ 32.438,72')
  })
})

describe('buildMonthlyMatrix', () => {
  it('1º semestre: cabeçalhos Jan–Jun e valores de Fev/Mar', () => {
    const mx = buildMonthlyMatrix(detail, 0)
    assert.equal(mx.kind, 'month')
    assert.deepEqual([...mx.columnHeaders], [...MONTH_HEADERS.slice(0, 6)])
    const consultoria = at(mx.rows, 0)
    assert.equal(consultoria.name, 'Consultoria - A PAGAR')
    assert.equal(consultoria.depth, 0)
    assert.equal(norm(at(consultoria.cellLabels, 0)), 'R$ 0,00')
    assert.equal(norm(at(consultoria.cellLabels, 1)), 'R$ 16.219,36')
    assert.equal(norm(at(consultoria.cellLabels, 2)), 'R$ 16.219,36')
    // árvore: centro → categoria → subcategoria
    const categoria = at(consultoria.children, 0)
    assert.equal(categoria.name, 'Consultoria Educacional')
    assert.equal(at(categoria.children, 0).name, 'Formação de professores')
    // TOTAL do semestre por mês
    assert.equal(norm(at(mx.total.cellLabels, 1)), 'R$ 16.219,36')
    assert.equal(norm(mx.total.totalLabel), 'R$ 32.438,72')
  })

  it('2º semestre: cabeçalhos Jul–Dez e tudo zero', () => {
    const mx = buildMonthlyMatrix(detail, 1)
    assert.deepEqual([...mx.columnHeaders], [...MONTH_HEADERS.slice(6, 12)])
    assert.equal(norm(at(at(mx.rows, 0).cellLabels, 0)), 'R$ 0,00')
  })
})

describe('buildNetworkMatrix', () => {
  it('colunas = redes MAIÚSCULAS; valores e TOTAL por rede', () => {
    const mx = buildNetworkMatrix(detail)
    assert.equal(mx.kind, 'network')
    assert.deepEqual([...mx.columnHeaders], ['ACRE'])
    const consultoria = at(mx.rows, 0)
    assert.equal(consultoria.name, 'Consultoria - A PAGAR')
    assert.equal(norm(at(consultoria.cellLabels, 0)), 'R$ 32.438,72')
    // Comunicação zerada na coluna ACRE
    assert.equal(norm(at(at(mx.rows, 1).cellLabels, 0)), 'R$ 0,00')
    // TOTAL da coluna
    assert.equal(norm(at(mx.total.cellLabels, 0)), 'R$ 32.438,72')
    assert.equal(norm(mx.total.totalLabel), 'R$ 32.438,72')
  })
})
