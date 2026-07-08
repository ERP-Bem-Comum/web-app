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
  MONTH_ABBR_PT,
  CSV_HEADER_BASE,
} from '../../../../src/modules/reports/client/analise.view-model.ts'
import {
  ANALISE_PAGAMENTOS_RAW,
  ANALISE_PERIOD,
  type RawAnaliseRow,
} from '../../../../src/modules/reports/client/data/analise-pagamentos.placeholder.ts'

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

  it('buildCsvHeader = base + rótulo de cada mês', () => {
    assert.strictEqual(buildCsvHeader(MONTHS), `${CSV_HEADER_BASE};Jan/26;Fev/26;Mar/26`)
  })

  it('cabeçalho base fiel', () => {
    assert.ok(lines[0]?.startsWith('Plano Orçamentário;Centro de custo;Total'))
    assert.strictEqual(lines[0], 'Plano Orçamentário;Centro de custo;Total;Jan/26;Fev/26;Mar/26')
  })

  it('uma linha por folha (3 CCs) + header = 4 linhas', () => {
    assert.strictEqual(lines.length, 1 + 3)
  })

  it('primeira linha de dados = Plano A / CC-A1 com Total e 3 meses BRL', () => {
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

  it("'r' (Recebimentos) vem VAZIO (espelho futuro → empty state)", () => {
    const report = loadAnalise('r')
    assert.strictEqual(report.planos.length, 0)
    assert.strictEqual(report.totalPeriodo, 0)
    // Mesmo vazio, os meses do período continuam definidos (a matriz teria colunas).
    assert.strictEqual(report.months.length, 6)
  })
})
