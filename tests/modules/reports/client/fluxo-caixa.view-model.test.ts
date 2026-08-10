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
  buildReportFromCashflow,
  monthlyFlow,
  buildTimeline,
  sectionDonutData,
  executionPercent,
  formatPercent,
  monthsInRange,
  formatMonthLabel,
  formatMonthShort,
  timelineYearLabel,
  buildCsv,
  buildStatement,
  buildStatementSection,
  sliceStatement,
  formatAmount,
  CSV_HEADER,
  type RawFluxoLeaf,
  type TimelinePoint,
} from '#modules/reports/client/fluxo-caixa.view-model.ts'
import type { CashflowRow, CashflowChartRow } from '#modules/reports/client/data/model/cashflow.model.ts'

// Intervalo do período de teste (jan–jun/2026) — buildReport recebe o range explícito (não há mais placeholder).
const RANGE = { start: '2026-01', end: '2026-06' }

// Fixture determinística: Saídas com 2 categorias (Pessoal com 2 subcats, Operacional com 1); Entradas com 1.
const SAIDAS: readonly RawFluxoLeaf[] = [
  { category: 'Pessoal', subcategory: 'Salários', month: '2026-01', realizedCents: 800, expectedCents: 900 },
  { category: 'Pessoal', subcategory: 'Encargos', month: '2026-01', realizedCents: 200, expectedCents: 250 },
  {
    category: 'Operacional',
    subcategory: 'Aluguel',
    month: '2026-02',
    realizedCents: 500,
    expectedCents: 500,
  },
]
const ENTRADAS: readonly RawFluxoLeaf[] = [
  {
    category: 'Doações',
    subcategory: 'Convênio',
    month: '2026-02',
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
  const report = buildReport(SAIDAS, [], RANGE)

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

describe('buildReportFromCashflow — fonte REAL (#590): árvore do Slice A + série do Slice B', () => {
  // Slice A (payables) — árvore Categoria × Subcategoria, sem mês. Nome null → sentinela honesta.
  const PAYABLES: readonly CashflowRow[] = [
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's1',
      subcategoryName: 'Salários',
      realizedCents: 800,
      expectedCents: 900,
    },
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's2',
      subcategoryName: 'Encargos',
      realizedCents: 200,
      expectedCents: 250,
    },
    {
      categoryRef: null,
      categoryName: null,
      subcategoryRef: null,
      subcategoryName: null,
      realizedCents: 500,
      expectedCents: 500,
    },
  ]
  // Slice B (chart) — mesmas linhas com o eixo de mês (`dueMonth`).
  const CHART: readonly CashflowChartRow[] = [
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's1',
      subcategoryName: 'Salários',
      realizedCents: 800,
      expectedCents: 900,
      dueMonth: '2026-01',
    },
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's2',
      subcategoryName: 'Encargos',
      realizedCents: 200,
      expectedCents: 250,
      dueMonth: '2026-01',
    },
    {
      categoryRef: null,
      categoryName: null,
      subcategoryRef: null,
      subcategoryName: null,
      realizedCents: 500,
      expectedCents: 500,
      dueMonth: '2026-03',
    },
  ]

  it('a árvore Saídas vem do Slice A (payables), somando as subcategorias na categoria', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [])
    assert.deepEqual(
      r.saidas.categories.map((c) => c.name),
      ['Pessoal', 'Sem categoria'],
    )
    assert.equal(r.saidas.totals.realizedCents, 1500)
    assert.equal(r.saidas.totals.expectedCents, 1650)
  })

  it('nome null vira sentinela "Sem categoria"/"Sem subcategoria"', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [])
    const semCat = r.saidas.categories.find((c) => c.name === 'Sem categoria')
    assert.equal(semCat?.children[0]?.name, 'Sem subcategoria')
  })

  it('Entradas SEMPRE vazia (receivables []); Saldo = 0 − Saídas (negativo)', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [])
    assert.equal(r.entradas.categories.length, 0)
    assert.equal(r.saldo.realizedCents, -1500)
    assert.equal(r.saldo.expectedCents, -1650)
  })

  it('os meses saem do MIN..MAX presente na série (jan..mar), sem "Invalid Date"', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [])
    assert.deepEqual(r.months, ['2026-01', '2026-02', '2026-03'])
    const jan = r.timeline.find((p) => p.key === '2026-01')
    assert.equal(jan?.realizadoCents, 1000) // Salários + Encargos
    assert.equal(jan?.saldoCents, -1000) // 0 − 1000 (só saídas)
    for (const p of r.timeline) assert.ok(!p.label.includes('Invalid'))
  })

  it('série/chart vazios → months [] e seções vazias (empty-state honesto)', () => {
    const r = buildReportFromCashflow([], [], [])
    assert.deepEqual(r.months, [])
    assert.equal(r.saidas.categories.length, 0)
    assert.equal(r.timeline.length, 0)
  })

  it('byCostCenter (fan-out do BFF) → barras Previsto × Realizado, preservando a ordem do BFF', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [
      { ref: 'cc1', name: 'Passagens', realizedCents: 100, expectedCents: 220 },
      { ref: 'cc2', name: 'Gestor', realizedCents: 50, expectedCents: 60 },
    ])
    assert.deepEqual(
      r.byCostCenter.map((c) => c.label),
      ['Passagens', 'Gestor'],
    )
    // expectedCents → previstoCents; realizedCents → realizadoCents.
    assert.equal(r.byCostCenter[0]?.previstoCents, 220)
    assert.equal(r.byCostCenter[0]?.realizadoCents, 100)
  })

  it('sem Centro de Custo (fan-out vazio) → byCostCenter [] (gráfico cai no empty-state)', () => {
    const r = buildReportFromCashflow(PAYABLES, CHART, [])
    assert.deepEqual(r.byCostCenter, [])
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

  it('formatMonthShort: só o mês (sem ano) para o eixo X; malformada → a própria chave', () => {
    assert.equal(formatMonthShort('2026-01'), 'Jan')
    assert.equal(formatMonthShort('2026-12'), 'Dez')
    assert.equal(formatMonthShort('lixo'), 'lixo')
  })

  it('timelineYearLabel: um ano → "2026"; atravessa o ano → "2025–2026"; vazio → ""', () => {
    const pt = (key: string): TimelinePoint => ({
      key,
      label: formatMonthLabel(key),
      monthShort: formatMonthShort(key),
      previstoCents: 0,
      realizadoCents: 0,
      saldoCents: 0,
    })
    assert.equal(timelineYearLabel([pt('2026-01'), pt('2026-07')]), '2026')
    assert.equal(timelineYearLabel([pt('2025-11'), pt('2026-02')]), '2025–2026')
    assert.equal(timelineYearLabel([]), '')
  })
})

describe('buildStatement — demonstrativo por mês (Real + Prev, Fluxo líquido, Saldo acumulado)', () => {
  const months = ['2026-01', '2026-02', '2026-03']

  it('buildStatementSection agrega por CATEGORIA e alinha as células aos meses', () => {
    const sec = buildStatementSection(SAIDAS, months)
    // 2 categorias (Pessoal, Operacional), na ordem de inserção.
    assert.deepEqual(
      sec.items.map((i) => i.name),
      ['Pessoal', 'Operacional'],
    )
    // Pessoal: jan = Salários(800/900) + Encargos(200/250) = 1000/1150; fev/mar = 0.
    const pessoal = sec.items[0]
    assert.deepEqual(pessoal?.byMonth[0], { realizedCents: 1000, expectedCents: 1150 })
    assert.deepEqual(pessoal?.byMonth[1], { realizedCents: 0, expectedCents: 0 })
    assert.deepEqual(pessoal?.total, { realizedCents: 1000, expectedCents: 1150 })
    // Total da seção por mês: jan = 1000/1150 (Pessoal); fev = 500/500 (Operacional/Aluguel).
    assert.deepEqual(sec.totalByMonth[0], { realizedCents: 1000, expectedCents: 1150 })
    assert.deepEqual(sec.totalByMonth[1], { realizedCents: 500, expectedCents: 500 })
    assert.deepEqual(sec.total, { realizedCents: 1500, expectedCents: 1650 })
  })

  it('Entradas = [] → Fluxo líquido = −Saídas e Saldo acumulado corre negativo', () => {
    const st = buildStatement([], SAIDAS, months)
    assert.equal(st.entradas.items.length, 0)
    // líquido jan = 0 − 1000 = −1000 (realizado); fev = 0 − 500 = −500.
    assert.equal(st.liquido[0]?.realizedCents, -1000)
    assert.equal(st.liquido[1]?.realizedCents, -500)
    // saldo inicial começa em 0; acumulado corre: jan −1000, fev −1500, mar −1500.
    assert.deepEqual(st.saldoInicial[0], { realizedCents: 0, expectedCents: 0 })
    assert.equal(st.saldoAcumulado[0]?.realizedCents, -1000)
    assert.equal(st.saldoAcumulado[1]?.realizedCents, -1500)
    assert.equal(st.saldoAcumulado[2]?.realizedCents, -1500)
    // saldo inicial de fev = acumulado de jan.
    assert.deepEqual(st.saldoInicial[1], st.saldoAcumulado[0])
    assert.equal(st.liquidoTotal.realizedCents, -1500)
  })

  it('sliceStatement recorta a janela e RECOMPUTA totais, preservando o Saldo inicial da janela', () => {
    const st = buildStatement([], SAIDAS, months)
    // Recorta fev..mar (idx 1..2).
    const sl = sliceStatement(st, 1, 2)
    assert.deepEqual(sl.months, ['2026-02', '2026-03'])
    // Saldo inicial do 1º mês visível (fev) = acumulado de jan do statement COMPLETO (−1000) → continuidade.
    assert.equal(sl.saldoInicial[0]?.realizedCents, -1000)
    // Total de saídas recomputado só sobre fev..mar (Aluguel fev = 500; mar = 0).
    assert.equal(sl.saidas.total.realizedCents, 500)
    assert.equal(sl.liquidoTotal.realizedCents, -500)
    // Saldo acumulado final da janela = final do período completo (−1500).
    assert.equal(sl.saldoAcumulado[sl.months.length - 1]?.realizedCents, -1500)
  })

  it('sliceStatement clampa índices fora do intervalo (janela inválida não quebra)', () => {
    const st = buildStatement([], SAIDAS, months)
    const sl = sliceStatement(st, 5, 9) // fora do range → clampa p/ o último mês
    assert.equal(sl.months.length, 1)
    assert.deepEqual(sl.months, ['2026-03'])
  })
})

describe('formatAmount — valor SEM "R$" (colunas densas do demonstrativo)', () => {
  it('formata centavos em pt-BR sem o símbolo, com sinal', () => {
    assert.equal(formatAmount(1530555), '15.305,55')
    assert.equal(formatAmount(-591000), '-5.910,00')
    assert.equal(formatAmount(0), '0,00')
  })
})

describe('buildCsv — CSV client-side fiel (header pt-BR, seções, valores BRL)', () => {
  const report = buildReport(SAIDAS, ENTRADAS, RANGE)

  it('a 1ª linha é o header pt-BR esperado', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines[0], CSV_HEADER)
    assert.equal(lines[0], '"Seção";"Categoria";"Subcategoria";"Realizado (R$)";"Previsto (R$)"')
  })

  it('uma linha por FOLHA de cada seção (3 saídas + 1 entrada = 4) + header', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines.length, 1 + 4)
  })

  it('cada linha traz seção + Cat/Sub + as 2 medidas em BRL', () => {
    const lines = buildCsv(report, 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines[1], '"Saídas";"Pessoal";"Salários";"8,00";"9,00"')
    // Última folha = Entradas / Doações / Convênio.
    assert.equal(lines[4], '"Entradas";"Doações";"Convênio";"30,00";"32,00"')
  })

  it('Entradas = [] → só as linhas de Saídas (empty-state no CSV também)', () => {
    const lines = buildCsv(buildReport(SAIDAS, [], RANGE), 'Saídas', 'Entradas').split('\r\n')
    assert.equal(lines.length, 1 + 3)
    assert.ok(!lines.some((l) => l.startsWith('"Entradas"')))
  })
})
