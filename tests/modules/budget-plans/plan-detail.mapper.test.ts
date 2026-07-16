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
  fillNetworkCells,
  fillMonthlyCells,
  networkNameKey,
  deriveTotalsFromCells,
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
      // Sem catálogo, o ESTADO cai na própria ref — e a `uf` de um estado É a ref (não precisa adivinhar).
      { id: 0, name: 'RN', ref: 'RN', kind: 'state', uf: 'RN', budgetId: 'b1', totalInCents: 500_000 },
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

describe('fillNetworkCells (#C2 — acende as células da matriz "Por Rede")', () => {
  const base = mapPlanDetail(
    {
      id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
      year: 2027,
      status: 'RASCUNHO',
      version: '1.0',
      programName: 'P',
      totalInCents: 0,
      budgets: [
        { budgetId: 'bg-rn', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 },
        { budgetId: 'bg-ce', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 },
      ],
    },
    structure,
  )
  // 2 redes; resultados só p/ a subcategoria 'Folha' (ref sub-folha-0001) — RN=1000, CE=0.
  const filled = fillNetworkCells(base, [
    [{ subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 1000 }],
    [],
  ])

  it('preenche a célula da subcategoria pela ref, alinhada por rede', () => {
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0] // Folha
    assert.ok(sub)
    assert.deepEqual(sub.networkInCents, [1000, 0]) // RN=1000, CE=0
    assert.equal(sub.totalInCents, 1000) // Σ redes
  })

  it('roll-up: categoria e centro somam os filhos por rede', () => {
    const cat = filled.costCenters[0]?.categories[0]
    const cc = filled.costCenters[0]
    assert.ok(cat && cc)
    assert.deepEqual(cat.networkInCents, [1000, 0]) // Folha(1000)+Reajuste(0)
    assert.deepEqual(cc.networkInCents, [1000, 0])
    assert.equal(cc.totalInCents, 1000)
  })
})

// ⚠️ core-api#413: o `by-budget` passou a devolver 12 linhas por subcategoria (uma por mês). O anual da rede
// é a SOMA delas. Antes, `fillNetworkCells` indexava num `Map` por `subcategoryRef` — chave repetida
// SOBRESCREVE, então o "Por Rede" mostraria o valor do ÚLTIMO mês como se fosse o anual, sem erro nenhum.
describe('fillNetworkCells — 12 meses por subcategoria (#413)', () => {
  // `base` próprio: o do describe acima é local a ele.
  const base = mapPlanDetail(
    {
      id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
      year: 2027,
      status: 'RASCUNHO',
      version: '1.0',
      programName: 'P',
      totalInCents: 0,
      budgets: [
        { budgetId: 'bg-rn', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 },
        { budgetId: 'bg-ce', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 },
      ],
    },
    structure,
  )
  const doze = (ref: string, cents: number) =>
    Array.from({ length: 12 }, (_, i) => ({ subcategoryRef: ref, month: i + 1, valueInCents: cents }))

  const filled = fillNetworkCells(base, [doze('sub-folha-0001', 100), []])

  it('o anual da rede é a SOMA dos 12 meses, não o último', () => {
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.deepEqual(sub.networkInCents, [1200, 0]) // 100 × 12 — não 100
    assert.equal(sub.totalInCents, 1200)
  })

  it('meses com valores DIFERENTES somam corretamente', () => {
    const meses = [10, 20, 30].map((v, i) => ({
      subcategoryRef: 'sub-folha-0001',
      month: i + 1,
      valueInCents: v,
    }))
    const f = fillNetworkCells(base, [meses, []])
    const sub = f.costCenters[0]?.categories[0]?.subCategories[0]
    assert.equal(sub?.networkInCents[0], 60) // 10+20+30
  })

  it('o roll-up (categoria/centro) usa a soma dos meses', () => {
    const cc = filled.costCenters[0]
    assert.deepEqual(cc?.networkInCents, [1200, 0])
    assert.equal(cc?.totalInCents, 1200)
  })
})

// A EDIÇÃO de Orçamento (§1.7) — colunas = MESES de UMA rede. É a outra pergunta ao mesmo dado do #413:
// `fillNetworkCells` agrega o ANUAL por rede; aqui a série mensal fica INTEIRA, mês a mês (é o que se orça).
describe('fillMonthlyCells (§1.7 — a grade Categorias × 12 meses de UMA rede)', () => {
  const base = mapPlanDetail(
    {
      id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
      year: 2027,
      status: 'RASCUNHO',
      version: '1.0',
      programName: 'P',
      totalInCents: 0,
      budgets: [{ budgetId: 'bg-rn', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 }],
    },
    structure,
  )

  it('cada mês cai no SEU índice (month 1..12 → 0..11)', () => {
    const filled = fillMonthlyCells(base, [
      { subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 100 },
      { subcategoryRef: 'sub-folha-0001', month: 2, valueInCents: 200 },
      { subcategoryRef: 'sub-folha-0001', month: 12, valueInCents: 300 },
    ])
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.equal(sub.monthlyInCents[0], 100) // Janeiro
    assert.equal(sub.monthlyInCents[1], 200) // Fevereiro
    assert.equal(sub.monthlyInCents[11], 300) // Dezembro
    assert.equal(sub.monthlyInCents.length, 12)
  })

  it('mês SEM lançamento fica 0 e a série continua com 12 posições (a grade não encolhe)', () => {
    const filled = fillMonthlyCells(base, [{ subcategoryRef: 'sub-folha-0001', month: 6, valueInCents: 500 }])
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.deepEqual([...sub.monthlyInCents], [0, 0, 0, 0, 0, 500, 0, 0, 0, 0, 0, 0])
  })

  it('o total da subcategoria é a SOMA dos 12 — o anual não é campo próprio (#413)', () => {
    const filled = fillMonthlyCells(
      base,
      Array.from({ length: 12 }, (_, i) => ({
        subcategoryRef: 'sub-folha-0001',
        month: i + 1,
        valueInCents: 100,
      })),
    )
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.equal(sub?.totalInCents, 1200) // 100 × 12, não 100
  })

  it('roll-up: categoria e centro somam os filhos MÊS A MÊS (não só no anual)', () => {
    const filled = fillMonthlyCells(base, [{ subcategoryRef: 'sub-folha-0001', month: 3, valueInCents: 70 }])
    const cat = filled.costCenters[0]?.categories[0]
    const cc = filled.costCenters[0]
    assert.equal(cat?.monthlyInCents[2], 70)
    assert.equal(cc?.monthlyInCents[2], 70)
    assert.equal(cc?.totalInCents, 70)
  })

  // Defesa em profundidade: o schema já barra na borda. Se um mês fora da faixa passasse, um índice inválido
  // corromperia a série em silêncio (ou estouraria pra 13ª posição numa grade de 12).
  it('mês fora de 1..12 é IGNORADO — não cria posição nem quebra a série', () => {
    const filled = fillMonthlyCells(base, [
      { subcategoryRef: 'sub-folha-0001', month: 0, valueInCents: 999 },
      { subcategoryRef: 'sub-folha-0001', month: 13, valueInCents: 999 },
      { subcategoryRef: 'sub-folha-0001', month: 5, valueInCents: 50 },
    ])
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.equal(sub.monthlyInCents.length, 12)
    assert.equal(sub.totalInCents, 50) // só o mês válido entrou
  })

  it('subcategoria sem lançamento nenhum → 12 zeros (grade completa, não vazia)', () => {
    const filled = fillMonthlyCells(base, [])
    const sub = filled.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.deepEqual(
      [...sub.monthlyInCents],
      Array.from({ length: 12 }, () => 0),
    )
    assert.equal(sub.totalInCents, 0)
  })
})

// A coluna do "Por Rede" é o NOME do parceiro (print do legado: "FORTALEZA"), não a chave natural. O nome vem
// do catálogo (`GET /options`); sem ele a coluna mostraria 'CE' ou, pior, o código IBGE de um município.
describe('mapPlanDetail — rótulo da rede (nome do catálogo, não a chave crua)', () => {
  const header = (budgets: readonly PlanDetailHeaderInput['budgets'][number][]): PlanDetailHeaderInput => ({
    id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
    year: 2026,
    status: 'RASCUNHO',
    version: '1.0',
    programName: 'P',
    totalInCents: 0,
    budgets,
  })

  it('estado: mostra "Ceará", não "CE"', () => {
    const d = mapPlanDetail(
      header([{ budgetId: 'b1', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 }]),
      structure,
      new Map([[networkNameKey('state', 'CE'), { name: 'Ceará', uf: 'CE' }]]),
    )
    assert.equal(d.networks[0]?.name, 'Ceará')
    assert.equal(d.networks[0]?.ref, 'CE') // a chave natural CONTINUA sendo a ref (é ela que casa o filtro)
  })

  it('município: mostra "Fortaleza", não o código IBGE', () => {
    const d = mapPlanDetail(
      header([{ budgetId: 'b1', partnerKind: 'municipality', partnerRef: '2304400', valueInCents: 0 }]),
      structure,
      new Map([[networkNameKey('municipality', '2304400'), { name: 'Fortaleza', uf: 'CE' }]]),
    )
    assert.equal(d.networks[0]?.name, 'Fortaleza')
  })

  // `ref` é chave natural em DOIS espaços (UF × IBGE). Chavear só por ref misturaria estado com município.
  it('mesma ref em kinds diferentes NÃO se confunde', () => {
    const d = mapPlanDetail(
      header([
        { budgetId: 'b1', partnerKind: 'state', partnerRef: '99', valueInCents: 0 },
        { budgetId: 'b2', partnerKind: 'municipality', partnerRef: '99', valueInCents: 0 },
      ]),
      structure,
      new Map([
        [networkNameKey('state', '99'), { name: 'Estado Noventa e Nove', uf: '99' }],
        [networkNameKey('municipality', '99'), { name: 'Município Noventa e Nove', uf: 'CE' }],
      ]),
    )
    assert.equal(d.networks[0]?.name, 'Estado Noventa e Nove')
    assert.equal(d.networks[1]?.name, 'Município Noventa e Nove')
  })

  // O catálogo é COSMÉTICO: se cair, a tela mostra a chave — feia, mas verdadeira. Nunca um nome inventado.
  it('sem catálogo → cai na ref (degrada, não mente nem some)', () => {
    const d = mapPlanDetail(
      header([{ budgetId: 'b1', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 }]),
      structure,
      new Map(),
    )
    assert.equal(d.networks[0]?.name, 'CE')
  })

  it('rede fora do catálogo → cai na ref (parceiro novo/desativado não apaga a coluna)', () => {
    const d = mapPlanDetail(
      header([{ budgetId: 'b1', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 }]),
      structure,
      new Map([[networkNameKey('state', 'CE'), { name: 'Ceará', uf: 'CE' }]]),
    )
    assert.equal(d.networks[0]?.name, 'RN')
  })
})

// INTERINO #458: o core-api guarda o total da rede como CAMPO e nunca o deriva — vem 0 pra toda rede. Em tela
// isso era "Total Orçamento: R$ 0,00" ao lado de uma grade somando R$ 149.879,22 (achado da P.O.).
describe('deriveTotalsFromCells (#458 — o total sai dos lançamentos, não do campo zerado)', () => {
  const base = mapPlanDetail(
    {
      id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
      year: 2027,
      status: 'RASCUNHO',
      version: '1.0',
      programName: 'P',
      totalInCents: 0, // ⟵ o que o core-api manda hoje: ZERO
      budgets: [
        { budgetId: 'bg-rn', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 },
        { budgetId: 'bg-ce', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 },
      ],
    },
    structure,
  )

  it('total do PLANO = Σ de todas as redes, mesmo com o campo do core-api zerado', () => {
    const filled = fillNetworkCells(base, [
      [{ subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 1000 }],
      [{ subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 500 }],
    ])
    assert.equal(filled.totalInCents, 0) // antes de derivar, ainda é o zero do core-api
    const d = deriveTotalsFromCells(filled)
    assert.equal(d.totalInCents, 1500) // 1000 (RN) + 500 (CE)
  })

  it('total de CADA rede = Σ dos lançamentos dela', () => {
    const d = deriveTotalsFromCells(
      fillNetworkCells(base, [
        [{ subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 1000 }],
        [{ subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 500 }],
      ]),
    )
    assert.equal(d.networks[0]?.totalInCents, 1000) // RN
    assert.equal(d.networks[1]?.totalInCents, 500) // CE
  })

  it('soma os 12 meses da rede (não o último) — o anual é Σ dos meses (#413)', () => {
    const doze = Array.from({ length: 12 }, (_, i) => ({
      subcategoryRef: 'sub-folha-0001',
      month: i + 1,
      valueInCents: 100,
    }))
    const d = deriveTotalsFromCells(fillNetworkCells(base, [doze, []]))
    assert.equal(d.totalInCents, 1200)
  })

  it('sem lançamento nenhum → 0 (zero DERIVADO é honesto; zero por campo esquecido não era)', () => {
    const d = deriveTotalsFromCells(fillNetworkCells(base, [[], []]))
    assert.equal(d.totalInCents, 0)
    assert.equal(d.networks[0]?.totalInCents, 0)
  })
})

// A tela alterna "Por Mês" × "Por Rede" sobre a MESMA matriz — as duas passadas têm que convergir. Se
// divergirem, uma está errada e o operador vê dois números pro mesmo plano.
describe('detalhe: "Por Rede" e "Por Mês" convergem no mesmo total', () => {
  const base = mapPlanDetail(
    {
      id: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
      year: 2027,
      status: 'RASCUNHO',
      version: '1.0',
      programName: 'P',
      totalInCents: 0,
      budgets: [
        { budgetId: 'bg-rn', partnerKind: 'state', partnerRef: 'RN', valueInCents: 0 },
        { budgetId: 'bg-ce', partnerKind: 'state', partnerRef: 'CE', valueInCents: 0 },
      ],
    },
    structure,
  )
  const rn = [
    { subcategoryRef: 'sub-folha-0001', month: 1, valueInCents: 100 },
    { subcategoryRef: 'sub-folha-0001', month: 2, valueInCents: 200 },
  ]
  const ce = [{ subcategoryRef: 'sub-folha-0001', month: 2, valueInCents: 50 }]

  // É o que o use-case do detalhe faz: rede primeiro, depois mês com os lançamentos ACHATADOS (= Σ redes).
  const detail = deriveTotalsFromCells(fillMonthlyCells(fillNetworkCells(base, [rn, ce]), [...rn, ...ce]))

  it('"Por Mês" soma TODAS as redes por mês (era o bug: meses zerados no detalhe)', () => {
    const sub = detail.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    assert.equal(sub.monthlyInCents[0], 100) // Jan: só RN
    assert.equal(sub.monthlyInCents[1], 250) // Fev: RN 200 + CE 50
  })

  it('"Por Rede" continua intacta depois da passada do mês (uma não apaga a outra)', () => {
    const sub = detail.costCenters[0]?.categories[0]?.subCategories[0]
    assert.deepEqual(sub?.networkInCents, [300, 50]) // RN=100+200, CE=50
  })

  it('Σ 12 meses == Σ redes == total do plano (as 3 leituras do MESMO dado)', () => {
    const sub = detail.costCenters[0]?.categories[0]?.subCategories[0]
    assert.ok(sub)
    const somaMeses = sub.monthlyInCents.reduce((a, b) => a + b, 0)
    const somaRedes = sub.networkInCents.reduce((a, b) => a + b, 0)
    assert.equal(somaMeses, 350)
    assert.equal(somaRedes, 350)
    assert.equal(detail.totalInCents, 350)
  })
})
