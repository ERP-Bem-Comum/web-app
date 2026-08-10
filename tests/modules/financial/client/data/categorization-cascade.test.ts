/**
 * Cascata da categorização (Centro → Categoria → Subcategoria) — derivações PURAS compartilhadas pelo
 * Lançar Documento e pela Nova transação da Conciliação (spec 074 · core-api#341).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  topLevelCategories,
  categoriesForCostCenter,
  subcategoriesOf,
  leafCategoryRef,
} from '../../../../../src/modules/financial/client/data/helpers/categorization-cascade.ts'
import type { FinancialReferences } from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

// cc-A tem 2 categorias (uma com filhas), cc-B tem 1, cc-C não tem nenhuma. `glob` = categoria sem
// centro (GLOBAL) — o caso de 100% do seed real de hoje (o #341 entregou capacidade, não dado).
const REFS: FinancialReferences = {
  costCenters: [
    { id: 'cc-A', code: '01', name: 'Centro A' },
    { id: 'cc-B', code: '02', name: 'Centro B' },
    { id: 'cc-C', code: '03', name: 'Centro C' },
  ],
  categories: [
    { id: 'cat-1', name: 'Cat 1', group: 'despesa', parentId: null, costCenterId: 'cc-A' },
    { id: 'cat-2', name: 'Cat 2', group: 'despesa', parentId: null, costCenterId: 'cc-A' },
    { id: 'cat-3', name: 'Cat 3', group: 'receita', parentId: null, costCenterId: 'cc-B' },
    { id: 'glob', name: 'Ajuste de conciliação', group: 'ajuste', parentId: null, costCenterId: null },
    { id: 'sub-1a', name: 'Sub 1a', group: 'despesa', parentId: 'cat-1', costCenterId: 'cc-A' },
    { id: 'sub-1b', name: 'Sub 1b', group: 'despesa', parentId: 'cat-1', costCenterId: 'cc-A' },
  ],
}

describe('topLevelCategories', () => {
  it('só as de topo (parentId null) — nunca subcategoria', () => {
    assert.deepEqual(
      topLevelCategories(REFS).map((c) => c.id),
      ['cat-1', 'cat-2', 'cat-3', 'glob'],
    )
  })
})

describe('categoriesForCostCenter', () => {
  it('sem centro escolhido → TODAS as de topo (o centro é opcional; não bloqueia)', () => {
    assert.deepEqual(
      categoriesForCostCenter(REFS, '').map((c) => c.id),
      ['cat-1', 'cat-2', 'cat-3', 'glob'],
    )
  })

  it('com centro → as DELE + as GLOBAIS (costCenterId null)', () => {
    assert.deepEqual(
      categoriesForCostCenter(REFS, 'cc-A').map((c) => c.id),
      ['cat-1', 'cat-2', 'glob'],
    )
    assert.deepEqual(
      categoriesForCostCenter(REFS, 'cc-B').map((c) => c.id),
      ['cat-3', 'glob'],
    )
  })

  it('centro SEM categorias atribuídas → só as globais (a lista nunca fica inutilizável)', () => {
    assert.deepEqual(
      categoriesForCostCenter(REFS, 'cc-C').map((c) => c.id),
      ['glob'],
    )
  })

  it('nunca devolve subcategoria (mesmo que ela seja do centro)', () => {
    const ids = categoriesForCostCenter(REFS, 'cc-A').map((c) => c.id)
    assert.ok(!ids.includes('sub-1a') && !ids.includes('sub-1b'))
  })

  it('taxonomia SEM centros atribuídos (seed real de hoje) → todo centro lista tudo: zero regressão', () => {
    const legacy: FinancialReferences = {
      costCenters: REFS.costCenters,
      categories: REFS.categories.map((c) => ({ ...c, costCenterId: null })),
    }
    assert.deepEqual(
      categoriesForCostCenter(legacy, 'cc-A').map((c) => c.id),
      ['cat-1', 'cat-2', 'cat-3', 'glob'],
    )
  })
})

describe('subcategoriesOf', () => {
  it('filhas da categoria (parentId === categoria)', () => {
    assert.deepEqual(
      subcategoriesOf(REFS, 'cat-1').map((c) => c.id),
      ['sub-1a', 'sub-1b'],
    )
  })

  it('categoria SEM subcategorias → vazio (o caso de 100% do seed de hoje)', () => {
    assert.deepEqual(subcategoriesOf(REFS, 'cat-2'), [])
  })

  it('nenhuma categoria escolhida → vazio', () => {
    assert.deepEqual(subcategoriesOf(REFS, ''), [])
  })
})

describe('leafCategoryRef (a FOLHA que vai ao backend)', () => {
  it('subcategoria escolhida → vence a categoria (é a mais específica)', () => {
    assert.equal(leafCategoryRef('cat-1', 'sub-1a'), 'sub-1a')
  })

  it('só categoria → a categoria', () => {
    assert.equal(leafCategoryRef('cat-1', ''), 'cat-1')
  })

  it('nada escolhido → vazio (não envia)', () => {
    assert.equal(leafCategoryRef('', ''), '')
  })
})
