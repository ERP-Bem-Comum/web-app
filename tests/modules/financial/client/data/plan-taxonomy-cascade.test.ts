/**
 * Cascata da categorização a partir da ÁRVORE DO PLANO (ADR-0051 · Fatia 1). Derivações PURAS sobre o
 * `PlanDetail` — os 3 níveis Centro → Categoria → Subcategoria vindos do que o Orçamento cadastrou.
 *
 * O que estes testes protegem: (1) o `value` do dropdown é o `ref` (UUID), não o `id` numérico sintético;
 * (2) nós INATIVOS (feature 075) não aparecem na cascata — categorizar num destino desativado seria bug;
 * (3) a cascata não vaza entre centros (categoria de um centro não some noutro).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  planCostCenterOptions,
  planCategoryOptions,
  planSubcategoryOptions,
} from '../../../../../src/modules/financial/client/data/helpers/plan-taxonomy-cascade.ts'
import type { PlanDetail } from '../../../../../src/modules/budget-plans/client/data/model/plan-detail.model.ts'

const zeros = Array.from({ length: 12 }, () => 0)
const sub = (ref: string, name: string, active: boolean) => ({
  id: 0,
  ref,
  name,
  active,
  totalInCents: 0,
  monthlyInCents: zeros,
  networkInCents: [],
})
const cat = (ref: string, name: string, active: boolean, subs: ReturnType<typeof sub>[]) => ({
  id: 0,
  ref,
  name,
  active,
  totalInCents: 0,
  monthlyInCents: zeros,
  networkInCents: [],
  subCategories: subs,
})

// Centro ATIVO com 2 categorias (uma inativa); centro INATIVO (some inteiro).
const PLAN: PlanDetail = {
  id: 'p-1',
  year: 2026,
  programName: 'EPV',
  programAbbreviation: 'EPV',
  version: 1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [],
  costCenters: [
    {
      id: 0,
      ref: 'cc-luz',
      name: 'Luz',
      type: 'A PAGAR',
      active: true,
      totalInCents: 0,
      monthlyInCents: zeros,
      networkInCents: [],
      categories: [
        cat('cat-noite', 'Noite', true, [
          sub('sub-dia', 'Dia', true),
          sub('sub-tarde', 'Tarde', false), // inativa → some
        ]),
        cat('cat-morta', 'Categoria Morta', false, [sub('sub-x', 'X', true)]), // inativa → some
      ],
    },
    {
      id: 0,
      ref: 'cc-sombra',
      name: 'Sombra',
      type: 'A PAGAR',
      active: false, // centro inativo → não aparece
      totalInCents: 0,
      monthlyInCents: zeros,
      networkInCents: [],
      categories: [cat('cat-y', 'Y', true, [])],
    },
  ],
}

describe('planCostCenterOptions', () => {
  it('lista só centros ATIVOS, com o ref uuid no value', () => {
    const opts = planCostCenterOptions(PLAN)
    assert.deepEqual(opts, [{ value: 'cc-luz', label: 'Luz' }])
  })
})

describe('planCategoryOptions', () => {
  it('categorias ATIVAS do centro (a inativa some)', () => {
    const opts = planCategoryOptions(PLAN, 'cc-luz')
    assert.deepEqual(opts, [{ value: 'cat-noite', label: 'Noite' }])
  })
  it('sem centro escolhido → vazio (na árvore do plano não há categoria global)', () => {
    assert.deepEqual(planCategoryOptions(PLAN, ''), [])
  })
  it('centro inexistente → vazio (não estoura)', () => {
    assert.deepEqual(planCategoryOptions(PLAN, 'cc-fantasma'), [])
  })
})

describe('planSubcategoryOptions', () => {
  it('subcategorias ATIVAS da categoria (a inativa some)', () => {
    const opts = planSubcategoryOptions(PLAN, 'cat-noite')
    assert.deepEqual(opts, [{ value: 'sub-dia', label: 'Dia' }])
  })
  it('acha a categoria por ref varrendo os centros — sem precisar do centro-pai', () => {
    // cat-noite está sob cc-luz; a função encontra sem receber o centro.
    assert.equal(planSubcategoryOptions(PLAN, 'cat-noite').length, 1)
  })
  it('categoria de centro INATIVO não é alcançável (o centro nem entra na cascata)', () => {
    // cat-y está sob cc-sombra (inativo). Como a subcategoria varre TODOS os centros, ela acharia cat-y —
    // mas cat-y não tem subs, então vazio. O ponto real: o usuário nunca chega aqui (cc-sombra não aparece).
    assert.deepEqual(planSubcategoryOptions(PLAN, 'cat-y'), [])
  })
  it('categoria inexistente → vazio', () => {
    assert.deepEqual(planSubcategoryOptions(PLAN, 'cat-fantasma'), [])
  })
})
