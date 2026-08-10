/**
 * ViewModel do relatório "Análise de Pagamentos" — unidades PURAS (node:test, sem DOM). Cobre: a geração de
 * meses do período (ASC, à prova de "Invalid Date"), o formato dos rótulos de mês (por ÍNDICE, com fallback
 * seguro), a agregação em matriz (Plano → Centro de Custo × mês), o Total do Período, os 2 agregados dos
 * gráficos (total por CC desc; total por mês) e o build do CSV (header base + colunas de mês).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  aggregateAnalise,
  monthsInRange,
  formatMonthLabel,
  totalByCostCenter,
  totalByMonth,
  buildCsv,
  buildCsvHeader,
  formatBRL,
  formatPercent,
  sharePercent,
  loadAnalise,
  analiseReportFromAnalysis,
  filterPaymentAnalysis,
  ANALISE_SEM_PLANO,
  ANALISE_SEM_CENTRO,
  MONTH_ABBR_PT,
  CSV_HEADER_LABELS,
} from '../../../../src/modules/reports/client/analise.view-model.ts'
import {
  ANALISE_PAGAMENTOS_RAW,
  ANALISE_PERIOD,
  type RawAnaliseRow,
} from '../../../../src/modules/reports/client/data/analise-pagamentos.placeholder.ts'
import { ANALISE_RECEBIMENTOS_RAW } from '../../../../src/modules/reports/client/data/analise-recebimentos.placeholder.ts'
import type { PaymentAnalysis } from '../../../../src/modules/reports/client/data/model/payment-analysis.model.ts'

// Fixture pequena e determinística: 2 planos, 3 centros de custo, período de 3 meses (jan–mar/2026).
const MONTHS = ['2026-01', '2026-02', '2026-03']
const FIX: readonly RawAnaliseRow[] = [
  {
    plano: 'Plano A',
    costCenter: 'CC-A1',
    monthValues: { '2026-01': 10000, '2026-02': 20000, '2026-03': 30000 },
  },
  {
    plano: 'Plano A',
    costCenter: 'CC-A2',
    monthValues: { '2026-01': 5000, '2026-03': 5000 },
  },
  {
    plano: 'Plano B',
    costCenter: 'CC-B1',
    monthValues: { '2026-02': 40000 },
  },
]

describe('monthsInRange — geração de meses (ASC, à prova de "Invalid Date")', () => {
  it('gera os 6 meses do período jan–jun/2026 em ordem CRESCENTE', () => {
    const months = monthsInRange({ start: '2026-01', end: '2026-06' })
    assert.deepStrictEqual(months, ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'])
  })

  it('atravessa a virada de ano (nov/2025 → fev/2026)', () => {
    const months = monthsInRange({ start: '2025-11', end: '2026-02' })
    assert.deepStrictEqual(months, ['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('um único mês quando start === end', () => {
    assert.deepStrictEqual(monthsInRange({ start: '2026-03', end: '2026-03' }), ['2026-03'])
  })

  it('end < start → [] (sem throw)', () => {
    assert.deepStrictEqual(monthsInRange({ start: '2026-06', end: '2026-01' }), [])
  })

  it('intervalo malformado → [] (nunca Date inválida)', () => {
    assert.deepStrictEqual(monthsInRange({ start: 'lixo', end: '2026-01' }), [])
    assert.deepStrictEqual(monthsInRange({ start: '2026-13', end: '2026-14' }), [])
    assert.deepStrictEqual(monthsInRange({ start: '2026-1', end: '2026-2' }), [])
  })
})

describe('formatMonthLabel — rótulo por ÍNDICE (zero "Invalid Date")', () => {
  it('chave válida → "Abbr/AA"', () => {
    assert.strictEqual(formatMonthLabel('2026-01'), 'Jan/26')
    assert.strictEqual(formatMonthLabel('2026-06'), 'Jun/26')
    assert.strictEqual(formatMonthLabel('2025-12'), 'Dez/25')
  })

  it('NENHUM mês do período produz "Invalid Date"', () => {
    for (const key of monthsInRange({ start: '2026-01', end: '2026-12' })) {
      const label = formatMonthLabel(key)
      assert.ok(!label.includes('Invalid'), `rótulo inválido para ${key}: ${label}`)
      assert.ok(label.includes('/'), `rótulo sem sufixo de ano para ${key}: ${label}`)
    }
  })

  it('chave malformada → devolve a própria chave (fallback honesto, nunca "Invalid Date")', () => {
    assert.strictEqual(formatMonthLabel('lixo'), 'lixo')
    assert.strictEqual(formatMonthLabel('2026-99'), '2026-99')
  })

  it('MONTH_ABBR_PT tem 12 meses (Jan..Dez)', () => {
    assert.strictEqual(MONTH_ABBR_PT.length, 12)
    assert.strictEqual(MONTH_ABBR_PT[0], 'Jan')
    assert.strictEqual(MONTH_ABBR_PT[11], 'Dez')
  })
})

describe('aggregateAnalise — matriz Plano → Centro de Custo × mês', () => {
  const report = aggregateAnalise(FIX, MONTHS)

  it('gera 2 planos na ordem de inserção', () => {
    assert.strictEqual(report.planos.length, 2)
    assert.strictEqual(report.planos[0]?.name, 'Plano A')
    assert.strictEqual(report.planos[1]?.name, 'Plano B')
    assert.strictEqual(report.planos[0]?.level, 'plano')
  })

  it('centros de custo aninham como folhas (level costCenter)', () => {
    const planoA = report.planos[0]
    assert.strictEqual(planoA?.children.length, 2)
    assert.strictEqual(planoA?.children[0]?.name, 'CC-A1')
    assert.strictEqual(planoA?.children[0]?.level, 'costCenter')
  })

  it('Plano A soma as 2 folhas por mês (jan 15000, fev 20000, mar 35000)', () => {
    const planoA = report.planos[0]
    assert.strictEqual(planoA?.monthCells['2026-01'], 15000)
    assert.strictEqual(planoA?.monthCells['2026-02'], 20000)
    assert.strictEqual(planoA?.monthCells['2026-03'], 35000)
  })

  it('total da folha = soma da série (CC-A1 = 60000)', () => {
    const ccA1 = report.planos[0]?.children[0]
    assert.strictEqual(ccA1?.total, 60000)
  })

  it('total do Plano A = 70000 (60000 + 10000)', () => {
    assert.strictEqual(report.planos[0]?.total, 70000)
  })

  it('Total do Período = soma geral (70000 + 40000 = 110000)', () => {
    assert.strictEqual(report.totalPeriodo, 110000)
  })

  it('completa com 0 os meses ausentes na linha crua (CC-A2 fev = 0)', () => {
    const ccA2 = report.planos[0]?.children[1]
    assert.strictEqual(ccA2?.monthCells['2026-02'], 0)
    assert.strictEqual(ccA2?.monthCells['2026-01'], 5000)
  })

  it('report.months reflete o período passado', () => {
    assert.deepStrictEqual(report.months, MONTHS)
  })
})

describe('agregações dos gráficos', () => {
  const report = aggregateAnalise(FIX, MONTHS)

  it('totalByCostCenter ordena DESC por total', () => {
    const bars = totalByCostCenter(report)
    assert.strictEqual(bars.length, 3)
    // CC-A1 60000 > CC-B1 40000 > CC-A2 10000.
    assert.strictEqual(bars[0]?.name, 'CC-A1')
    assert.strictEqual(bars[0]?.valueCents, 60000)
    assert.strictEqual(bars[1]?.name, 'CC-B1')
    assert.strictEqual(bars[2]?.name, 'CC-A2')
    assert.ok((bars[0]?.valueCents ?? 0) >= (bars[1]?.valueCents ?? 0))
  })

  it('totalByMonth soma todas as folhas por mês, na ordem ASC do período', () => {
    const months = totalByMonth(report)
    assert.strictEqual(months.length, 3)
    assert.strictEqual(months[0]?.key, '2026-01')
    // jan = 10000 + 5000 (Plano A) + 0 (Plano B) = 15000; fev = 20000 + 40000 = 60000; mar = 35000.
    assert.strictEqual(months[0]?.valueCents, 15000)
    assert.strictEqual(months[1]?.valueCents, 60000)
    assert.strictEqual(months[2]?.valueCents, 35000)
  })
})

describe('formatação', () => {
  it('formatBRL centavos → R$', () => {
    // formatBRL usa NBSP (U+00A0/U+202F) entre "R$" e o número — normaliza p/ espaço comum na comparação.
    assert.strictEqual(formatBRL(123456).replace(/\s/g, ' '), 'R$ 1.234,56')
  })

  it('formatPercent: inteiro sem casas, fracionário 1 casa, não-finito → 0%', () => {
    assert.strictEqual(formatPercent(25), '25%')
    assert.strictEqual(formatPercent(0), '0%')
    assert.strictEqual(formatPercent(31.666), '31,7%')
    assert.strictEqual(formatPercent(Number.POSITIVE_INFINITY), '0%')
  })

  it('sharePercent guard ÷0 → 0', () => {
    assert.strictEqual(sharePercent(50, 0), 0)
    assert.strictEqual(sharePercent(25, 100), 25)
  })
})

describe('buildCsv — header base + colunas de mês, uma linha por folha', () => {
  const report = aggregateAnalise(FIX, MONTHS)
  const csv = buildCsv(report)
  const lines = csv.split('\r\n')

  it('buildCsvHeader = base + rótulo de cada mês, com a moeda no CABEÇALHO', () => {
    assert.strictEqual(CSV_HEADER_LABELS[2], 'Total (R$)')
    assert.strictEqual(
      buildCsvHeader(MONTHS),
      '"Plano Orçamentário";"Centro de custo";"Total (R$)";"Jan/26 (R$)";"Fev/26 (R$)";"Mar/26 (R$)"',
    )
  })

  it('cabeçalho é escapado como os dados (era o único sem aspas)', () => {
    assert.strictEqual(lines[0], buildCsvHeader(MONTHS))
  })

  it('uma linha por folha (3 CCs) + header = 4 linhas', () => {
    assert.strictEqual(lines.length, 1 + 3)
  })

  it('primeira linha de dados = Plano A / CC-A1 com Total e 3 meses', () => {
    assert.ok(lines[1]?.startsWith('"Plano A";"CC-A1";'))
    // 3 colunas base (plano/cc/total) + 3 meses = 6 campos.
    assert.strictEqual(lines[1]?.split(';').length, 6)
  })

  it('nenhum campo do CSV contém "Invalid Date"', () => {
    assert.ok(!csv.includes('Invalid'))
  })
})

describe('placeholder real (loadAnalise)', () => {
  it("carrega os 3 planos do placeholder com 'p'", () => {
    const report = loadAnalise('p')
    assert.strictEqual(report.planos.length, 3)
    const names = report.planos.map((p) => p.name)
    assert.ok(names.some((n) => n.startsWith('PARC')))
    assert.ok(names.some((n) => n.startsWith('ETI')))
  })

  it('o período placeholder tem 6 meses (jan–jun/2026)', () => {
    const report = loadAnalise('p')
    assert.strictEqual(report.months.length, 6)
    assert.strictEqual(report.months[0], '2026-01')
    assert.strictEqual(report.months[5], '2026-06')
    assert.deepStrictEqual(report.months, monthsInRange(ANALISE_PERIOD))
  })

  it('Total do Período = soma de todas as folhas × meses (> 0)', () => {
    const report = loadAnalise('p')
    // Soma manual do placeholder para travar o valor.
    let expected = 0
    for (const row of ANALISE_PAGAMENTOS_RAW) {
      for (const m of report.months) expected += row.monthValues[m] ?? 0
    }
    assert.strictEqual(report.totalPeriodo, expected)
    assert.ok(report.totalPeriodo > 0)
  })

  it('todo rótulo de mês do placeholder é válido (zero "Invalid Date")', () => {
    const report = loadAnalise('p')
    for (const key of report.months) {
      assert.ok(!formatMonthLabel(key).includes('Invalid'))
    }
  })

  it("'r' (Recebimentos) agrega o placeholder de recebíveis (espelho — NÃO vazio)", () => {
    const report = loadAnalise('r')
    // 3 planos de recebíveis (CONV, FOM, PATR).
    assert.strictEqual(report.planos.length, 3)
    const names = report.planos.map((p) => p.name)
    assert.ok(names.some((n) => n.startsWith('CONV')))
    assert.ok(names.some((n) => n.startsWith('FOM')))
    // Total do Período = soma de todas as folhas × meses (trava no valor do placeholder).
    let expected = 0
    for (const row of ANALISE_RECEBIMENTOS_RAW) {
      for (const m of report.months) expected += row.monthValues[m] ?? 0
    }
    assert.strictEqual(report.totalPeriodo, expected)
    assert.ok(report.totalPeriodo > 0)
    // Mesmo período (6 meses) que Pagamentos.
    assert.strictEqual(report.months.length, 6)
  })

  it('caso VAZIO (fonte `[]` — remoção futura do placeholder) → 0 planos e Total 0', () => {
    // Simula o dia em que o placeholder de recebíveis for removido: a agregação de `[]` cai limpa no vazio.
    const empty = aggregateAnalise([], monthsInRange(ANALISE_PERIOD))
    assert.strictEqual(empty.planos.length, 0)
    assert.strictEqual(empty.totalPeriodo, 0)
    // Mesmo vazio, os meses do período continuam definidos (a matriz teria colunas).
    assert.strictEqual(empty.months.length, 6)
  })
})

describe('analiseReportFromAnalysis (DTO #446 → AnaliseReport)', () => {
  // Plano/centro SEM nome (id/name null) + série esparsa: jan e mar presentes, fev AUSENTE (deve virar 0).
  const ANALYSIS: PaymentAnalysis = {
    totalValueOfPeriod: 60000,
    data: [
      {
        id: null,
        name: null,
        total: 60000,
        itens: [
          { monthYear: '2026-01', total: 10000 },
          { monthYear: '2026-03', total: 50000 },
        ],
        costCenters: [
          {
            id: null,
            name: null,
            total: 60000,
            itens: [
              { monthYear: '2026-01', total: 10000 },
              { monthYear: '2026-03', total: 50000 },
            ],
          },
        ],
      },
    ],
  }

  it('name null → "Sem plano" / "Sem centro de custo"', () => {
    const report = analiseReportFromAnalysis(ANALYSIS)
    assert.strictEqual(report.planos.length, 1)
    assert.strictEqual(report.planos[0]?.name, ANALISE_SEM_PLANO)
    assert.strictEqual(report.planos[0]?.name, 'Sem plano')
    assert.strictEqual(report.planos[0]?.children[0]?.name, ANALISE_SEM_CENTRO)
    assert.strictEqual(report.planos[0]?.children[0]?.name, 'Sem centro de custo')
  })

  it('deriva os meses do MIN..MAX do DADO (contíguo), NÃO de ano fixo', () => {
    const report = analiseReportFromAnalysis(ANALYSIS)
    // min=2026-01, max=2026-03 → range contíguo inclui fev (que não veio no dado).
    assert.deepStrictEqual(report.months, ['2026-01', '2026-02', '2026-03'])
  })

  it('completa a célula do mês AUSENTE com 0 (fev) e preserva os presentes', () => {
    const report = analiseReportFromAnalysis(ANALYSIS)
    const cc = report.planos[0]?.children[0]
    assert.strictEqual(cc?.monthCells['2026-01'], 10000)
    assert.strictEqual(cc?.monthCells['2026-02'], 0)
    assert.strictEqual(cc?.monthCells['2026-03'], 50000)
  })

  it('totalPeriodo = totalValueOfPeriod (contrato do backend, não a soma recomputada)', () => {
    const report = analiseReportFromAnalysis({ ...ANALYSIS, totalValueOfPeriod: 99999 })
    assert.strictEqual(report.totalPeriodo, 99999)
  })

  it('resposta VAZIA (data: []) → months [] e planos [] (empty-state honesto)', () => {
    const report = analiseReportFromAnalysis({ totalValueOfPeriod: 0, data: [] })
    assert.strictEqual(report.months.length, 0)
    assert.strictEqual(report.planos.length, 0)
    assert.strictEqual(report.totalPeriodo, 0)
  })

  it('nome real preservado; monthYear malformado é IGNORADO na derivação de meses', () => {
    const report = analiseReportFromAnalysis({
      totalValueOfPeriod: 5000,
      data: [
        {
          id: 'p1',
          name: 'Plano Real',
          total: 5000,
          itens: [],
          costCenters: [
            {
              id: 'c1',
              name: 'Centro Real',
              total: 5000,
              itens: [
                { monthYear: 'lixo', total: 999 }, // malformado → ignorado
                { monthYear: '2026-05', total: 5000 },
              ],
            },
          ],
        },
      ],
    })
    assert.strictEqual(report.planos[0]?.name, 'Plano Real')
    assert.strictEqual(report.planos[0]?.children[0]?.name, 'Centro Real')
    // Só o mês válido entra; 'lixo' não gera coluna.
    assert.deepStrictEqual(report.months, ['2026-05'])
    assert.strictEqual(report.planos[0]?.children[0]?.monthCells['2026-05'], 5000)
  })
})

/**
 * `filterPaymentAnalysis` — o recorte CLIENT-SIDE que o #446 não aceita (é `.strict()`: só período+status) mas
 * o grão da resposta permite. É o que faz Programa/Plano/Centro de Custo filtrarem de verdade na tela.
 */
describe('filterPaymentAnalysis', () => {
  const analysis = {
    totalValueOfPeriod: 900,
    data: [
      {
        id: 'plano-a',
        name: 'Plano A',
        total: 600,
        itens: [
          { monthYear: '2026-01', total: 400 },
          { monthYear: '2026-02', total: 200 },
        ],
        costCenters: [
          { id: 'cc-1', name: 'CC Um', total: 400, itens: [{ monthYear: '2026-01', total: 400 }] },
          { id: 'cc-2', name: 'CC Dois', total: 200, itens: [{ monthYear: '2026-02', total: 200 }] },
        ],
      },
      {
        id: 'plano-b',
        name: 'Plano B',
        total: 300,
        itens: [{ monthYear: '2026-01', total: 300 }],
        costCenters: [
          { id: 'cc-1', name: 'CC Um', total: 300, itens: [{ monthYear: '2026-01', total: 300 }] },
        ],
      },
    ],
  } as const

  it('sem recorte devolve a MESMA referência (não invalida o memo do binding à toa)', () => {
    assert.strictEqual(filterPaymentAnalysis(analysis, {}), analysis)
  })

  it('recorta por Plano e recalcula o Total do Período', () => {
    const r = filterPaymentAnalysis(analysis, { planId: 'plano-b' })
    assert.deepStrictEqual(
      r.data.map((p) => p.id),
      ['plano-b'],
    )
    assert.strictEqual(r.totalValueOfPeriod, 300)
  })

  it('recorta por Programa (lista de planos) mantendo os dois quando ambos pertencem a ele', () => {
    const r = filterPaymentAnalysis(analysis, { planIds: ['plano-a', 'plano-b'] })
    assert.strictEqual(r.data.length, 2)
    assert.strictEqual(r.totalValueOfPeriod, 900)
  })

  it('Programa sem plano conhecido esvazia — resultado honesto, não filtro ignorado', () => {
    const r = filterPaymentAnalysis(analysis, { planIds: [] })
    assert.deepStrictEqual(r.data, [])
    assert.strictEqual(r.totalValueOfPeriod, 0)
  })

  it('bucket "Sem plano" (id null) sai quando há recorte por Programa', () => {
    const semPlano = {
      totalValueOfPeriod: 100,
      data: [
        {
          id: null,
          name: null,
          total: 100,
          itens: [{ monthYear: '2026-01', total: 100 }],
          costCenters: [
            { id: 'cc-1', name: 'CC Um', total: 100, itens: [{ monthYear: '2026-01', total: 100 }] },
          ],
        },
      ],
    } as const
    assert.deepStrictEqual(filterPaymentAnalysis(semPlano, { planIds: ['plano-a'] }).data, [])
  })

  it('recorta por Centro de Custo e RECALCULA total e série mensal do plano', () => {
    const r = filterPaymentAnalysis(analysis, { costCenterId: 'cc-2' })
    // Só o Plano A tem o cc-2; o Plano B sai inteiro (linha vazia seria pior que ausência).
    assert.deepStrictEqual(
      r.data.map((p) => p.id),
      ['plano-a'],
    )
    // O total do plano deixa de somar o cc-1 — sem recalcular, a tela mostraria 600 exibindo só 200.
    assert.strictEqual(r.data[0]?.total, 200)
    assert.deepStrictEqual(r.data[0]?.itens, [{ monthYear: '2026-02', total: 200 }])
    assert.strictEqual(r.totalValueOfPeriod, 200)
  })

  it('combina Plano + Centro de Custo', () => {
    const r = filterPaymentAnalysis(analysis, { planId: 'plano-a', costCenterId: 'cc-1' })
    assert.strictEqual(r.data.length, 1)
    assert.strictEqual(r.totalValueOfPeriod, 400)
  })

  it('o recorte chega na matriz que a tela consome (Total do Período e árvore)', () => {
    const report = analiseReportFromAnalysis(filterPaymentAnalysis(analysis, { planId: 'plano-b' }))
    assert.strictEqual(report.totalPeriodo, 300)
    assert.deepStrictEqual(
      report.planos.map((p) => p.name),
      ['Plano B'],
    )
  })
})
