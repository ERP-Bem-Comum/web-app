/**
 * Testes do ViewModel puro do modal "Centros de Custo" (§1.5): achatamento da árvore (sem centavos),
 * chave estável de nó e opções dos enums.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  buildCentrosTree,
  nodeKey,
  emptyCentroFormFields,
  CENTRO_TIPO_OPTIONS,
  SUB_TIPO_OPTIONS,
  RELEASE_TYPE_OPTIONS,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.view-model.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

const zero: MonthlyCents = Array.from({ length: 12 }, () => 0)

const detail: PlanDetail = {
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
      id: 1,
      ref: 'ref-1',
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [
        {
          id: 11,
          ref: 'ref-11',
          name: 'Educacional',
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              ref: 'ref-111',
              name: 'Formação',
              totalInCents: 0,
              monthlyInCents: zero,
              networkInCents: [],
            },
          ],
        },
      ],
    },
  ],
}

describe('buildCentrosTree', () => {
  it('achata a árvore preservando id/nome/tipo e a hierarquia', () => {
    const tree = buildCentrosTree(detail)
    assert.equal(tree.length, 1)
    assert.equal(tree[0]?.name, 'Consultoria')
    assert.equal(tree[0]?.type, 'A PAGAR')
    assert.equal(tree[0]?.categories[0]?.name, 'Educacional')
    assert.equal(tree[0]?.categories[0]?.subCategories[0]?.name, 'Formação')
  })
})

describe('nodeKey / opções', () => {
  it('nodeKey é estável por (kind,id)', () => {
    assert.equal(nodeKey('sub', 111), 'sub:111')
    assert.equal(nodeKey('centro', 1), 'centro:1')
  })
  it('opções dos enums estão completas', () => {
    assert.deepEqual([...CENTRO_TIPO_OPTIONS], ['A PAGAR', 'A RECEBER'])
    assert.deepEqual([...SUB_TIPO_OPTIONS], ['INSTITUCIONAL', 'REDE'])
    assert.equal(RELEASE_TYPE_OPTIONS.length, 4)
  })
  it('emptyCentroFormFields tem defaults sãos', () => {
    const f = emptyCentroFormFields()
    assert.equal(f.nome, '')
    assert.equal(f.centroTipo, 'A PAGAR')
    assert.equal(f.subTipo, 'INSTITUCIONAL')
    assert.equal(f.releaseType, 'DESPESAS_PESSOAIS')
  })
})
