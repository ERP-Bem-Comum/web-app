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
  categoriaLock,
  subLock,
  CENTRO_TIPO_OPTIONS,
  SUB_TIPO_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  type CentroNode,
  type CategoriaNode,
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
      active: true,
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [
        {
          id: 11,
          ref: 'ref-11',
          name: 'Educacional',
          active: true,
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              ref: 'ref-111',
              name: 'Formação',
              active: true,
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

  // Regressão: o `ref` da SUBCATEGORIA era descartado no achatamento (só centro e categoria o carregavam,
  // porque só eles eram pai de um POST). Sem ele não há como endereçar o PATCH do 3º nível (feature 075).
  it('preserva o `ref` uuid nos TRÊS níveis (o do 3º é o alvo do PATCH)', () => {
    const tree = buildCentrosTree(detail)
    assert.equal(tree[0]?.ref, 'ref-1')
    assert.equal(tree[0]?.categories[0]?.ref, 'ref-11')
    assert.equal(tree[0]?.categories[0]?.subCategories[0]?.ref, 'ref-111')
  })

  it('propaga o `active` dos três níveis (server-state, não Set local)', () => {
    const off = buildCentrosTree({
      ...detail,
      costCenters: detail.costCenters.map((c) => ({ ...c, active: false })),
    })
    assert.equal(off[0]?.active, false)
    assert.equal(off[0]?.categories[0]?.active, true) // o mapper NÃO recalcula herança — mostra o que vem
  })
})

// A trava existe porque o `active` que chega é o EFETIVO (nó ∧ ancestrais) e o PATCH grava a INTENÇÃO: com o
// pai desligado, ligar o filho gravaria `true` e a releitura devolveria `false` — o switch voltaria sozinho
// (core-api#469). Estas funções decidem QUANDO travar e QUEM citar na explicação.
describe('categoriaLock / subLock', () => {
  /** Devolve o par (centro, categoria) já resolvido — as funções recebem os dois, e assim não há `!` no teste. */
  const tree = (
    active: boolean,
    catActive = true,
    subActive = true,
  ): Readonly<{ centro: CentroNode; categoria: CategoriaNode }> => {
    const categoria: CategoriaNode = {
      id: 11,
      ref: 'ref-11',
      name: 'Educacional',
      active: catActive,
      subCategories: [{ id: 111, ref: 'ref-111', name: 'Formação', active: subActive }],
    }
    return {
      centro: {
        id: 1,
        ref: 'ref-1',
        name: 'Consultoria',
        type: 'A PAGAR',
        active,
        categories: [categoria],
      },
      categoria,
    }
  }

  it('centro ativo: nada trava', () => {
    const { centro, categoria } = tree(true)
    assert.equal(categoriaLock(centro), null)
    assert.equal(subLock(centro, categoria), null)
  })

  it('centro inativo: trava a categoria e cita o centro', () => {
    assert.deepEqual(categoriaLock(tree(false).centro), { ancestorName: 'Consultoria' })
  })

  it('centro inativo vence: a sub cita o CENTRO, não a categoria', () => {
    // Com o centro desligado, a categoria também chega `false` (efetivo) — mas quem causou foi o centro, e é
    // ele que a usuária precisa reativar. Citar a categoria mandaria consertar o lugar errado.
    const { centro, categoria } = tree(false, false)
    assert.deepEqual(subLock(centro, categoria), { ancestorName: 'Consultoria' })
  })

  it('centro ativo e categoria inativa: a sub cita a CATEGORIA (o ancestral mais próximo)', () => {
    const { centro, categoria } = tree(true, false)
    assert.deepEqual(subLock(centro, categoria), { ancestorName: 'Educacional' })
  })

  it('sub inativa por intenção própria (ancestrais ativos): NÃO trava — é o único caso editável', () => {
    const { centro, categoria } = tree(true, true, false)
    assert.equal(subLock(centro, categoria), null)
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
