/**
 * Testes do ViewModel puro do Detalhe do plano — matrizes "Consolidado por Mês" (semestre) e "Por Rede"
 * (parceiros) + cabeçalho. Valores fiéis ao mapa (ETI 1.2 > Consultoria: Fev/Mar R$ 16.219,36 →
 * total R$ 32.438,72; Por Rede = coluna ACRE).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type {
  PlanDetail,
  MonthlyCents,
  NetworkRef,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  buildMonthlyMatrix,
  buildNetworkMatrix,
  derivePlanDetailHeader,
  estadoOptionsFor,
  municipioOptionsFor,
  planNetworkKind,
  selectedNetworkRef,
  buildOrcamentoMatrix,
  orcamentoCentroOptions,
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
  id: 'p-3',
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1.2,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 3_243_872,
  networks: [
    {
      id: 1,
      name: 'Acre',
      ref: 'AC',
      kind: 'state' as const,
      uf: 'AC',
      budgetId: 'b-ac',
      totalInCents: 3243872,
    },
  ],
  costCenters: [
    {
      id: 1,
      ref: 'ref-1',
      name: 'Consultoria',
      active: true,
      type: 'A PAGAR',
      totalInCents: 3_243_872,
      monthlyInCents: consult,
      networkInCents: [3_243_872],
      categories: [
        {
          id: 11,
          ref: 'ref-11',
          name: 'Consultoria Educacional',
          active: true,
          totalInCents: 3_243_872,
          monthlyInCents: consult,
          networkInCents: [3_243_872],
          subCategories: [
            {
              id: 111,
              ref: 'ref-111',
              name: 'Formação de professores',
              active: true,
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
      ref: 'ref-2',
      name: 'Comunicação',
      active: true,
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
    // Nome e natureza separados: `name` limpo + `tag` (renderizado como badge âmbar ao lado, mock).
    assert.equal(consultoria.name, 'Consultoria')
    assert.equal(consultoria.tag, 'A PAGAR')
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
    assert.equal(consultoria.name, 'Consultoria')
    assert.equal(consultoria.tag, 'A PAGAR')
    assert.equal(norm(at(consultoria.cellLabels, 0)), 'R$ 32.438,72')
    // Comunicação zerada na coluna ACRE
    assert.equal(norm(at(at(mx.rows, 1).cellLabels, 0)), 'R$ 0,00')
    // TOTAL da coluna
    assert.equal(norm(at(mx.total.cellLabels, 0)), 'R$ 32.438,72')
    assert.equal(norm(mx.total.totalLabel), 'R$ 32.438,72')
  })
})

// O filtro lista as REDES DO PLANO. Até 2026-07-15 era um mapa fixo (CE/SP/AC + municípios de mentira) — em
// tela, escolher "Ceará" num plano sem rede levava a Edição a dizer "não foi possível carregar" (achado da
// P.O.). A regra (natureza da rede é do PLANO) veio da coluna PARCEIROS do legado: "1 estados" × "1 municípios".
const rede = (over: Partial<NetworkRef>): NetworkRef => ({
  id: 0,
  name: 'Ceará',
  ref: 'CE',
  kind: 'state',
  uf: 'CE',
  budgetId: 'bg-1',
  totalInCents: 0,
  ...over,
})
const withNetworks = (networks: readonly NetworkRef[]): PlanDetail => ({ ...detail, networks })

describe('filtro por Rede — as opções saem das REDES DO PLANO', () => {
  it('plano de ESTADO: os estados SÃO as redes (o estado é a rede)', () => {
    const d = withNetworks([rede({}), rede({ id: 1, ref: 'RN', name: 'Rio Grande do Norte', uf: 'RN' })])
    assert.equal(planNetworkKind(d), 'state')
    assert.deepEqual(
      estadoOptionsFor(d).map((o) => o.value),
      ['CE', 'RN'],
    )
  })

  it('plano de ESTADO: NÃO tem município (o legado só mostra o filtro de Estado)', () => {
    assert.equal(municipioOptionsFor(withNetworks([rede({})]), 'CE').length, 0)
  })

  it('plano de MUNICÍPIO: o Estado agrupa; o município é a rede', () => {
    const d = withNetworks([
      rede({ id: 0, kind: 'municipality', ref: '2304400', name: 'Fortaleza', uf: 'CE' }),
      rede({ id: 1, kind: 'municipality', ref: '2303709', name: 'Caucaia', uf: 'CE' }),
      rede({ id: 2, kind: 'municipality', ref: '3550308', name: 'São Paulo', uf: 'SP' }),
    ])
    assert.equal(planNetworkKind(d), 'municipality')
    // 3 municípios em 2 UFs → 2 opções de estado (dedup), não 3.
    assert.deepEqual(
      estadoOptionsFor(d).map((o) => o.value),
      ['CE', 'SP'],
    )
    assert.deepEqual(
      municipioOptionsFor(d, 'CE').map((o) => o.label),
      ['Caucaia', 'Fortaleza'],
    )
    assert.deepEqual(
      municipioOptionsFor(d, 'SP').map((o) => o.label),
      ['São Paulo'],
    )
  })

  it('plano SEM rede → nada a filtrar (era aqui que a lista fixa mentia)', () => {
    const d = withNetworks([])
    assert.equal(planNetworkKind(d), null)
    assert.equal(estadoOptionsFor(d).length, 0)
    assert.equal(municipioOptionsFor(d, 'CE').length, 0)
    assert.equal(selectedNetworkRef(d, 'CE', ''), null)
  })

  it('selectedNetworkRef: no plano de ESTADO a rede é o estado escolhido', () => {
    const d = withNetworks([rede({})])
    assert.equal(selectedNetworkRef(d, 'CE', ''), 'CE')
  })

  it('selectedNetworkRef: no plano de MUNICÍPIO a rede é o MUNICÍPIO, não o estado', () => {
    const d = withNetworks([rede({ kind: 'municipality', ref: '2304400', name: 'Fortaleza', uf: 'CE' })])
    assert.equal(selectedNetworkRef(d, 'CE', ''), null) // só o estado não fecha uma rede
    assert.equal(selectedNetworkRef(d, 'CE', '2304400'), '2304400')
  })

  // A guarda que teria evitado o bug: escolha que não existe no plano não vira rede.
  it('rede que NÃO existe no plano → null (não deixa "filtrar" o inexistente)', () => {
    const d = withNetworks([rede({})])
    assert.equal(selectedNetworkRef(d, 'SP', ''), null)
  })

  it('município sem UF no catálogo → fica FORA do filtro de estado (não vira opção em branco)', () => {
    const d = withNetworks([rede({ kind: 'municipality', ref: '9999999', name: '9999999', uf: '' })])
    assert.equal(estadoOptionsFor(d).length, 0)
  })
})

describe('buildOrcamentoMatrix (edição de Orçamento — escopo a 1 centro)', () => {
  it('categorias viram linhas raiz (depth 0) → subcategorias (depth 1), com meses e total do centro', () => {
    const mx = buildOrcamentoMatrix(detail, 1, 0)
    assert.ok(mx !== null)
    assert.deepEqual([...mx.columnHeaders], [...MONTH_HEADERS.slice(0, 6)])
    const cat = at(mx.rows, 0)
    assert.equal(cat.name, 'Consultoria Educacional')
    assert.equal(cat.depth, 0)
    assert.equal(norm(at(cat.cellLabels, 1)), 'R$ 16.219,36') // Fevereiro
    const sub = at(cat.children, 0)
    assert.equal(sub.name, 'Formação de professores')
    assert.equal(sub.depth, 1)
    assert.equal(norm(mx.total.totalLabel), 'R$ 32.438,72')
  })
  it('centro inexistente → null', () => {
    assert.equal(buildOrcamentoMatrix(detail, 999, 0), null)
  })
})

describe('orcamentoCentroOptions', () => {
  it('deriva {value:id, label:nome} dos centros do plano', () => {
    assert.deepEqual(orcamentoCentroOptions(detail), [
      { value: '1', label: 'Consultoria' },
      { value: '2', label: 'Comunicação' },
    ])
  })
})
