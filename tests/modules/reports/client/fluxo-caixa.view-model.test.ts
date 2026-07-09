/**
 * ViewModel do relatório "Fluxo de Caixa" — unidades PURAS (node:test, sem DOM). Cobre:
 * (1) `aggregateSection` — árvore Categoria → Subcategoria, soma das 2 medidas folha → categoria → total;
 * (2) `computeSaldo` — Entradas − Saídas (por medida), inclusive negativo;
 * (3) `buildReport` com Entradas = [] — a seção Entradas cai vazia (0 categorias, total 0) SEM quebrar Saídas;
 *     o Saldo passa a ser `0 − Saídas` (negativo);
 * (4) `monthlyFlow` — série mensal por vencimento (realizado por mês/lado), Entradas = [] → série toda 0;
 * (5) `monthsInRange` / `formatMonthLabel` — meses derivados por ordinal, guard "Invalid Date";
 * (6) `buildCsv` — header pt-BR, rótulos de seção, uma linha por folha, valores BRL.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  aggregateSection,
  computeSaldo,
  buildReport,
  monthlyFlow,
  buildTimeline,
  aggregateByCostCenter,
  sectionDonutData,
  executionPercent,
  formatPercent,
  monthsInRange,
  formatMonthLabel,
  loadFluxoCaixa,
  buildCsv,
  formatBRL,
  CSV_HEADER,
  type RawFluxoLeaf,
} from '#modules/reports/client/fluxo-caixa.view-model.ts'

// Fixture determinística: Saídas com 2 categorias (Pessoal com 2 subcats, Operacional com 1); Entradas com 1.
// Centros de Custo: Pessoal → 'Equipe' (2 folhas), Operacional → 'Infra' (1 folha), Convênio → 'Captação'.
const SAIDAS: readonly RawFluxoLeaf[] = [
  {
    category: 'Pessoal',
    subcategory: 'Salários',
    month: '2026-01',
    costCenter: 'Equipe',
    realizedCents: 800,
    expectedCents: 900,
  },
  {
    category: 'Pessoal',
    subcategory: 'Encargos',
    month: '2026-01',
    costCenter: 'Equipe',
    realizedCents: 200,
    expectedCents: 250,
  },
  {
    category: 'Operacional',
    subcategory: 'Aluguel',
    month: '2026-02',
    costCenter: 'Infra',
    realizedCents: 500,
    expectedCents: 500,
  },
]
const ENTRADAS: readonly RawFluxoLeaf[] = [
  {
    category: 'Doações',
    subcategory: 'Convênio',
    month: '2026-02',
    costCenter: 'Captação',
    realizedCents: 3000,
    expectedCents: 3200,
  },
]

describe('aggregateSection — árvore Categoria → Subcategoria', () => {
  it('monta 2 níveis preservando a ordem de inserção', () => {
    const s = aggregateSection(SAIDAS)
    assert.equal(s.categories.length, 2)
    assert.deepEqual(
      s.categories.map((c) => c.name),
      ['Pessoal', 'Operacional'],
    )
    const pessoal = s.categories[0]
    assert.equal(pessoal?.level, 'category')
    assert.deepEqual(
      pessoal?.children.map((c) => c.name),
      ['Salários', 'Encargos'],
    )
    assert.equal(pessoal?.children[0]?.level, 'subcategory')
    assert.equal(pessoal?.children[0]?.children.length, 0)
  })

  it('a folha carrega as medidas da sua linha; a categoria soma os filhos', () => {
    const s = aggregateSection(SAIDAS)
    const pessoal = s.categories[0]
    assert.equal(pessoal?.children[0]?.measures.realizedCents, 800)
    assert.equal(pessoal?.children[0]?.measures.expectedCents, 900)
    assert.equal(pessoal?.measures.realizedCents, 1000) // 800 + 200
    assert.equal(pessoal?.measures.expectedCents, 1150) // 900 + 250
  })

  it('o total da seção soma as categorias', () => {
    const s = aggregateSection(SAIDAS)
    assert.equal(s.totals.realizedCents, 1500) // 1000 + 500
    assert.equal(s.totals.expectedCents, 1650) // 1150 + 500
  })

  it('seção vazia → 0 categorias e totais zero', () => {
    const s = aggregateSection([])
    assert.equal(s.categories.length, 0)
    assert.equal(s.totals.realizedCents, 0)
    assert.equal(s.totals.expectedCents, 0)
  })
})

describe('computeSaldo — Entradas − Saídas (por medida)', () => {
  it('positivo quando entradas > saídas', () => {
    const saldo = computeSaldo(aggregateSection(ENTRADAS), aggregateSection(SAIDAS))
    assert.equal(saldo.realizedCents, 3000 - 1500) // 1500
    assert.equal(saldo.expectedCents, 3200 - 1650) // 1550
  })

  it('negativo quando saídas > entradas (ex.: sem entradas)', () => {
    const saldo = computeSaldo(aggregateSection([]), aggregateSection(SAIDAS))
    assert.equal(saldo.realizedCents, -1500)
    assert.equal(saldo.expectedCents, -1650)
  })
})

describe('buildReport — Entradas = [] cai no vazio SEM quebrar Saídas/Saldo', () => {
  const report = buildReport(SAIDAS, [])

  it('a seção Saídas continua íntegra', () => {
    assert.equal(report.saidas.categories.length, 2)
    assert.equal(report.saidas.totals.realizedCents, 1500)
  })

  it('a seção Entradas vem vazia (0 categorias, total 0)', () => {
    assert.equal(report.entradas.categories.length, 0)
    assert.equal(report.entradas.totals.realizedCents, 0)
    assert.equal(report.entradas.totals.expectedCents, 0)
  })

  it('o Saldo passa a ser 0 − Saídas (negativo)', () => {
    assert.equal(report.saldo.realizedCents, -1500)
    assert.equal(report.saldo.expectedCents, -1650)
  })

  it('a série mensal de Entradas fica toda 0', () => {
    for (const m of report.monthly) assert.equal(m.entradasCents, 0)
    // Saídas ainda populam jan e fev.
    const jan = report.monthly.find((m) => m.key === '2026-01')
    assert.equal(jan?.saidasCents, 1000) // 800 + 200
  })
})

describe('monthlyFlow — série mensal por vencimento (realizado por lado)', () => {
  const months = monthsInRange({ start: '2026-01', end: '2026-06' })
  const flow = monthlyFlow(SAIDAS, ENTRADAS, months)

  it('cobre exatamente os 6 meses do período, em ordem', () => {
    assert.deepEqual(
      flow.map((m) => m.key),
      ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    )
  })

  it('soma o realizado de cada lado por mês', () => {
    const jan = flow.find((m) => m.key === '2026-01')
    const fev = flow.find((m) => m.key === '2026-02')
    assert.equal(jan?.saidasCents, 1000) // Salários + Encargos
    assert.equal(jan?.entradasCents, 0)
    assert.equal(fev?.saidasCents, 500) // Aluguel
    assert.equal(fev?.entradasCents, 3000) // Convênio
  })

  it('rótulo do mês é sempre válido (nunca "Invalid Date")', () => {
    for (const m of flow) assert.ok(!m.label.includes('Invalid'))
    assert.equal(flow[0]?.label, 'Jan/26')
  })
})

describe('buildTimeline — Esperado × Realizado × Saldo por período (mês por vencimento)', () => {
  const months = monthsInRange({ start: '2026-01', end: '2026-06' })
  const tl = buildTimeline(SAIDAS, ENTRADAS, months)

  it('cobre exatamente os 6 meses do período, em ordem, com rótulo válido', () => {
    assert.deepEqual(
      tl.map((p) => p.key),
      ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    )
    assert.equal(tl[0]?.label, 'Jan/26')
    for (const p of tl) assert.ok(!p.label.includes('Invalid'))
  })

  it('Previsto = Σ expected e Realizado = Σ realized (Entradas ∪ Saídas) por mês', () => {
    const jan = tl.find((p) => p.key === '2026-01')
    const fev = tl.find((p) => p.key === '2026-02')
    // jan: só saídas (real 1000, exp 1150).
    assert.equal(jan?.previstoCents, 1150)
    assert.equal(jan?.realizadoCents, 1000)
    // fev: saídas (real 500, exp 500) + entradas (real 3000, exp 3200).
    assert.equal(fev?.previstoCents, 3700)
    assert.equal(fev?.realizadoCents, 3500)
  })

  it('Saldo = Entradas − Saídas (realizado) do período, podendo NEGATIVAR', () => {
    const jan = tl.find((p) => p.key === '2026-01')
    const fev = tl.find((p) => p.key === '2026-02')
    assert.equal(jan?.saldoCents, -1000) // 0 − 1000
    assert.equal(fev?.saldoCents, 2500) // 3000 − 500
  })

  it('Entradas = [] → Saldo é −Saídas realizadas; Previsto/Realizado só das saídas', () => {
    const tl0 = buildTimeline(SAIDAS, [], months)
    const jan = tl0.find((p) => p.key === '2026-01')
    assert.equal(jan?.saldoCents, -1000)
    assert.equal(jan?.realizadoCents, 1000)
    // meses sem movimento ficam zerados (não quebram).
    const mar = tl0.find((p) => p.key === '2026-03')
    assert.deepEqual(
      { p: mar?.previstoCents, r: mar?.realizadoCents, s: mar?.saldoCents },
      { p: 0, r: 0, s: 0 },
    )
  })
})

describe('aggregateByCostCenter — Previsto × Realizado por Centro de Custo', () => {
  it('agrega as folhas por Centro de Custo, em ordem DECRESCENTE pelo Realizado', () => {
    const cc = aggregateByCostCenter(SAIDAS)
    assert.deepEqual(
      cc.map((c) => c.label),
      ['Equipe', 'Infra'],
    )
    // Equipe = Salários + Encargos: previsto 900+250=1150, realizado 800+200=1000.
    assert.equal(cc[0]?.previstoCents, 1150)
    assert.equal(cc[0]?.realizadoCents, 1000)
    // Infra = Aluguel: 500/500.
    assert.equal(cc[1]?.previstoCents, 500)
    assert.equal(cc[1]?.realizadoCents, 500)
  })

  it('fonte vazia → [] (o gráfico cai no empty-state)', () => {
    assert.deepEqual(aggregateByCostCenter([]), [])
  })

  it('no relatório completo, byCostCenter agrega as SAÍDAS (não as Entradas)', () => {
    const r = buildReport(SAIDAS, ENTRADAS)
    // Nenhum Centro de Custo de Entradas (Captação) aparece.
    assert.ok(!r.byCostCenter.some((c) => c.label === 'Captação'))
    assert.deepEqual(
      r.byCostCenter.map((c) => c.label),
      ['Equipe', 'Infra'],
    )
  })
})

describe('sectionDonutData / executionPercent — donuts Previsto × Realizado', () => {
  it('deriva as 2 fatias (Previsto, Realizado) dos totais da seção', () => {
    const slices = sectionDonutData(aggregateSection(ENTRADAS))
    assert.deepEqual(slices, [
      { key: 'previsto', valueCents: 3200 },
      { key: 'realizado', valueCents: 3000 },
    ])
  })

  it('seção vazia → fatias zeradas (total 0 → donut cai no empty-state)', () => {
    const slices = sectionDonutData(aggregateSection([]))
    assert.deepEqual(slices, [
      { key: 'previsto', valueCents: 0 },
      { key: 'realizado', valueCents: 0 },
    ])
    assert.equal((slices[0]?.valueCents ?? 0) + (slices[1]?.valueCents ?? 0), 0)
  })

  it('executionPercent = realizado ÷ previsto (guard ÷0 → 0)', () => {
    // Saídas: realizado 1500 / previsto 1650 ≈ 90,9%.
    const exec = executionPercent(aggregateSection(SAIDAS))
    assert.equal(Math.round(exec * 10) / 10, 90.9)
    assert.equal(executionPercent(aggregateSection([])), 0)
    // NBSP do Intl não aparece aqui (percentual puro), mas o rótulo formata sem quebrar.
    assert.equal(formatPercent(0), '0%')
  })
})

describe('monthsInRange / formatMonthLabel — blindados contra "Invalid Date"', () => {
  it('gera as chaves do intervalo em ordem crescente', () => {
    assert.deepEqual(monthsInRange({ start: '2026-01', end: '2026-03' }), ['2026-01', '2026-02', '2026-03'])
  })
  it('extremo malformado ou end < start → []', () => {
    assert.deepEqual(monthsInRange({ start: 'xxxx', end: '2026-03' }), [])
    assert.deepEqual(monthsInRange({ start: '2026-05', end: '2026-01' }), [])
  })
  it('formatMonthLabel: chave válida → "Jan/26"; malformada → a própria chave (nunca "Invalid Date")', () => {
    assert.equal(formatMonthLabel('2026-01'), 'Jan/26')
    assert.equal(formatMonthLabel('2026-12'), 'Dez/26')
    assert.equal(formatMonthLabel('lixo'), 'lixo')
  })
})

describe('loadFluxoCaixa — fonte da tela (front-first)', () => {
  it('Saídas não vazias; Entradas placeholder presente hoje', () => {
    const r = loadFluxoCaixa()
    assert.ok(r.saidas.categories.length > 0)
    assert.ok(r.saidas.totals.realizedCents > 0)
    assert.ok(r.entradas.categories.length > 0)
  })
  it('a série mensal cobre o período completo', () => {
    const r = loadFluxoCaixa()
    assert.equal(r.monthly.length, r.months.length)
  })
})

describe('buildCsv — CSV client-side fiel (header pt-BR, seções, valores BRL)', () => {
  const report = buildReport(SAIDAS, ENTRADAS)

  it('a 1ª linha é o header pt-BR esperado', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines[0], CSV_HEADER)
    assert.equal(lines[0], 'Seção;Categoria;Subcategoria;Realizado;Previsto')
  })

  it('uma linha por FOLHA de cada seção (3 saídas + 1 entrada = 4) + header', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines.length, 1 + 4)
  })

  it('cada linha traz seção + Cat/Sub + as 2 medidas em BRL', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines[1], `"Saídas";"Pessoal";"Salários";"${formatBRL(800)}";"${formatBRL(900)}"`)
    // Última folha = Entradas / Doações / Convênio.
    assert.equal(lines[4], `"Entradas";"Doações";"Convênio";"${formatBRL(3000)}";"${formatBRL(3200)}"`)
  })

  it('Entradas = [] → só as linhas de Saídas (empty-state no CSV também)', () => {
    const lines = buildCsv(buildReport(SAIDAS, []), 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines.length, 1 + 3)
    assert.ok(!lines.some((l) => l.startsWith('"Entradas"')))
  })
})
