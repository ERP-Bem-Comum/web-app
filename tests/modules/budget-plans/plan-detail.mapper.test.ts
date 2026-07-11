/**
 * Testes do mapper PURO do DETALHE do Plano Orçamentário (feature 059). Cobre as decisões:
 *   (a) cabeçalho + árvore (1 centro / 1 categoria / 2 subs) → header (version parse, totalInCents real,
 *       networks [], programAbbreviation null, scenarioName null), tipos, ids numéricos únicos, releaseType
 *       mapeado, 12 zeros e totais/networkInCents zerados;
 *   (b) árvore vazia (`costCenters: []`) → costCenters [];
 *   (c) direction desconhecida → 'A PAGAR' (fallback) e launchType desconhecido → releaseType AUSENTE.
 * UUIDs v4 VÁLIDOS nos fixtures (o schema da borda usa `z.uuid`, RFC-strict — o mapper não valida, mas os
 * fixtures espelham o formato real).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  mapPlanDetail,
  mapDirection,
  mapLaunchType,
} from '#modules/budget-plans/server/domain/plan-detail.mapper.ts'
import type {
  CostStructureInput,
  PlanDetailHeaderInput,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'

const header: PlanDetailHeaderInput = {
  id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
  year: 2027,
  status: 'RASCUNHO',
  version: '2.0',
  programName: 'Programa Alfa',
  totalInCents: 123_456,
  budgets: [{ budgetId: 'b1', partnerKind: 'state', partnerRef: 'RN', valueInCents: 500_000 }],
}

const CENTRO_REF = 'c1c1c1c1-1111-4a2b-8c3d-000000000010'
const CATEGORIA_REF = 'ca7e9017-2222-4a2b-8c3d-000000000020'

const structure: CostStructureInput = {
  costCenters: [
    {
      id: CENTRO_REF,
      name: 'Consultoria',
      direction: 'A PAGAR',
      categories: [
        {
          id: CATEGORIA_REF,
          name: 'Consultoria Estratégica',
          subcategories: [
            { id: 'sub-folha-0001', name: 'Folha', launchType: 'DESPESAS_PESSOAIS' },
            { id: 'sub-reaj-0002', name: 'Reajuste', launchType: 'IPCA' },
          ],
        },
      ],
    },
  ],
}

const zeros12 = Array.from({ length: 12 }, () => 0)

describe('mapPlanDetail — cabeçalho + árvore', () => {
  const detail = mapPlanDetail(header, structure)

  it('cabeçalho: id, year, status, programName repassados', () => {
    assert.equal(detail.id, header.id)
    assert.equal(detail.year, 2027)
    assert.equal(detail.status, 'RASCUNHO')
    assert.equal(detail.programName, 'Programa Alfa')
  })

  it('version string "2.0" → number 2; totalInCents é o REAL do cabeçalho', () => {
    assert.equal(detail.version, 2)
    assert.equal(detail.totalInCents, 123_456)
  })

  it('programAbbreviation e scenarioName = null; networks = orçamentos por rede (#394)', () => {
    assert.equal(detail.programAbbreviation, null)
    assert.equal(detail.scenarioName, null)
    // #394: a visão "Por Rede" acende dos budgets reais (id por índice, ref = chave natural, total real).
    assert.deepEqual(detail.networks, [
      { id: 0, name: 'RN', ref: 'RN', kind: 'state', budgetId: 'b1', totalInCents: 500_000 },
    ])
  })

  it('centro: id numérico, type mapeado (A PAGAR), zeros, ref = uuid do backend (feature 061)', () => {
    const cc = detail.costCenters[0]
    assert.ok(cc)
    assert.equal(cc.id, 1)
    assert.equal(cc.ref, CENTRO_REF)
    assert.equal(cc.type, 'A PAGAR')
    assert.equal(cc.totalInCents, 0)
    assert.deepEqual(cc.monthlyInCents, zeros12)
    assert.deepEqual(cc.networkInCents, [])
  })

  it('categoria: id derivado (centro*100 + 1), ref = uuid do backend e zeros', () => {
    const cat = detail.costCenters[0]?.categories[0]
    assert.ok(cat)
    assert.equal(cat.id, 101)
    assert.equal(cat.ref, CATEGORIA_REF)
    assert.equal(cat.totalInCents, 0)
    assert.deepEqual(cat.monthlyInCents, zeros12)
    assert.deepEqual(cat.networkInCents, [])
  })

  it('subcategorias: ids numéricos ÚNICOS e releaseType mapeado', () => {
    const cat = detail.costCenters[0]?.categories[0]
    assert.ok(cat)
    const [s1, s2] = cat.subCategories
    assert.ok(s1 && s2)
    assert.equal(s1.id, 10_101)
    assert.equal(s2.id, 10_102)
    assert.notEqual(s1.id, s2.id)
    assert.equal(s1.releaseType, 'DESPESAS_PESSOAIS')
    assert.equal(s2.releaseType, 'IPCA')
    assert.deepEqual(s1.monthlyInCents, zeros12)
    assert.deepEqual(s1.networkInCents, [])
  })

  it('todos os ids de nó são únicos na árvore', () => {
    const ids: number[] = []
    for (const cc of detail.costCenters) {
      ids.push(cc.id)
      for (const cat of cc.categories) {
        ids.push(cat.id)
        for (const sub of cat.subCategories) ids.push(sub.id)
      }
    }
    assert.equal(new Set(ids).size, ids.length)
  })
})

describe('mapPlanDetail — árvore vazia', () => {
  it('costCenters [] → costCenters []', () => {
    const detail = mapPlanDetail(header, { costCenters: [] })
    assert.deepEqual(detail.costCenters, [])
    assert.equal(detail.totalInCents, 123_456) // cabeçalho intacto
  })
})

describe('mapPlanDetail — enums desconhecidos (fallback)', () => {
  const detail = mapPlanDetail(header, {
    costCenters: [
      {
        id: 'c1c1c1c1-9999-4a2b-8c3d-000000000099',
        name: 'Centro X',
        direction: 'ALGO_ESTRANHO',
        categories: [
          {
            id: 'ca7e9017-9999-4a2b-8c3d-000000000098',
            name: 'Cat X',
            subcategories: [{ id: 'sub-x-0003', name: 'Sub X', launchType: 'MODELO_DESCONHECIDO' }],
          },
        ],
      },
    ],
  })

  it('direction desconhecida → A PAGAR', () => {
    assert.equal(detail.costCenters[0]?.type, 'A PAGAR')
  })

  it('launchType desconhecido → releaseType AUSENTE (chave omitida)', () => {
    const sub = detail.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.equal(sub.releaseType, undefined)
    assert.equal(Object.prototype.hasOwnProperty.call(sub, 'releaseType'), false)
  })
})

describe('mapDirection — dicionário tolerante', () => {
  it('reconhece variações de A RECEBER', () => {
    for (const v of ['A RECEBER', 'A-RECEBER', 'A_RECEBER', 'areceber', 'Receber']) {
      assert.equal(mapDirection(v), 'A RECEBER')
    }
  })
  it('reconhece variações de A PAGAR', () => {
    for (const v of ['A PAGAR', 'A-PAGAR', 'A_PAGAR', 'APAGAR', 'pagar']) {
      assert.equal(mapDirection(v), 'A PAGAR')
    }
  })
  it('desconhecido → A PAGAR (fallback)', () => {
    assert.equal(mapDirection('xyz'), 'A PAGAR')
  })
})

describe('mapLaunchType — dicionário tolerante', () => {
  it('casa os 4 modelos por sinais tolerantes', () => {
    assert.equal(mapLaunchType('DESPESAS_PESSOAIS'), 'DESPESAS_PESSOAIS')
    assert.equal(mapLaunchType('Folha de pagamento'), 'DESPESAS_PESSOAIS')
    assert.equal(mapLaunchType('IPCA'), 'IPCA')
    assert.equal(mapLaunchType('CAED'), 'CAED')
    assert.equal(mapLaunchType('matricula'), 'CAED')
    assert.equal(mapLaunchType('DESPESAS_LOGISTICAS'), 'DESPESAS_LOGISTICAS')
    assert.equal(mapLaunchType('viagem'), 'DESPESAS_LOGISTICAS')
  })
  it('desconhecido → undefined', () => {
    assert.equal(mapLaunchType('nada'), undefined)
  })
})
