/**
 * ViewModel do relatório "Realizado × Planejado" — unidades PURAS (node:test, sem DOM). Cobre a agregação em
 * árvore (CC→Cat→Subcat), os totais por medida, o AV% (incl. divisão por zero → 0), a ordenação de meses
 * (tabela DESC / gráfico ASC), os grand totals e o build do CSV.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  aggregateBudgetTree,
  grandTotal,
  computeAvPct,
  planejadoByCentroCusto,
  topCentroCustoByPlanejado,
  planejadoByMonth,
  realizadoVsPrevisto,
  buildCsv,
  formatBRL,
  formatPercent,
  sharePercent,
  loadBudgetTree,
  MONTH_NAMES_PT,
} from '../../../../src/modules/reports/client/realizado-x-planejado.view-model.ts'
import {
  REALIZADO_X_PLANEJADO_RAW,
  type RawBudgetRow,
} from '../../../../src/modules/reports/client/data/realizado-x-planejado.placeholder.ts'

// Fixture pequena e determinística (2 CCs, cada um com 1 categoria e 1-2 subcategorias).
const FIX: readonly RawBudgetRow[] = [
  {
    centroCusto: 'CC-A',
    categoria: '1. CAT-A',
    subcategoria: 'Sub-A1',
    months: [
      { month: 0, planejadoCents: 10000, realizadoCents: 5000, provisionadoCents: 1000 },
      { month: 1, planejadoCents: 20000, realizadoCents: 10000, provisionadoCents: 2000 },
    ],
  },
  {
    centroCusto: 'CC-A',
    categoria: '1. CAT-A',
    subcategoria: 'Sub-A2',
    months: [{ month: 0, planejadoCents: 30000, realizadoCents: 0, provisionadoCents: 3000 }],
  },
  {
    centroCusto: 'CC-B',
    categoria: '2. CAT-B',
    subcategoria: 'Sub-B1',
    months: [{ month: 5, planejadoCents: 0, realizadoCents: 4000, provisionadoCents: 0 }],
  },
]

describe('aggregateBudgetTree — árvore CC→Cat→Subcat', () => {
  const rows = aggregateBudgetTree(FIX)

  it('gera 2 centros de custo na ordem de inserção', () => {
    assert.strictEqual(rows.length, 2)
    assert.strictEqual(rows[0]?.name, 'CC-A')
    assert.strictEqual(rows[1]?.name, 'CC-B')
    assert.strictEqual(rows[0]?.depth, 0)
  })

  it('CC-A soma as 2 subcategorias (planejado 60000, realizado 15000, provisionado 6000)', () => {
    const a = rows[0]
    assert.ok(a)
    assert.strictEqual(a?.totals.planejadoCents, 60000)
    assert.strictEqual(a?.totals.realizadoCents, 15000)
    assert.strictEqual(a?.totals.provisionadoCents, 6000)
  })

  it('categoria e subcategoria aninham corretamente', () => {
    const cat = rows[0]?.children[0]
    assert.strictEqual(cat?.name, '1. CAT-A')
    assert.strictEqual(cat?.depth, 1)
    assert.strictEqual(cat?.children.length, 2)
    assert.strictEqual(cat?.children[0]?.name, 'Sub-A1')
    assert.strictEqual(cat?.children[0]?.depth, 2)
  })

  it('soma por mês (CC-A mês 0 = Sub-A1 10000 + Sub-A2 30000 = 40000 planejado)', () => {
    const m0 = rows[0]?.months.find((m) => m.month === 0)
    assert.strictEqual(m0?.planejadoCents, 40000)
    assert.strictEqual(m0?.realizadoCents, 5000)
  })
})

describe('computeAvPct — AV% com guard de divisão por zero', () => {
  it('realizado 15000 / planejado 60000 = 25%', () => {
    assert.strictEqual(
      computeAvPct({ planejadoCents: 60000, realizadoCents: 15000, provisionadoCents: 0 }),
      25,
    )
  })

  it('planejado 0 → 0 (nunca NaN/Infinity)', () => {
    const pct = computeAvPct({ planejadoCents: 0, realizadoCents: 4000, provisionadoCents: 0 })
    assert.strictEqual(pct, 0)
    assert.ok(Number.isFinite(pct))
  })

  it('realizado 0 → 0%', () => {
    assert.strictEqual(computeAvPct({ planejadoCents: 30000, realizadoCents: 0, provisionadoCents: 0 }), 0)
  })
})

describe('grandTotal + agregações dos gráficos', () => {
  const rows = aggregateBudgetTree(FIX)
  const total = grandTotal(rows)

  it('grand total soma todos os CCs (planejado 60000, realizado 19000, provisionado 6000)', () => {
    assert.strictEqual(total.planejadoCents, 60000)
    assert.strictEqual(total.realizadoCents, 19000)
    assert.strictEqual(total.provisionadoCents, 6000)
  })

  it('AV% do grand total = 19000/60000 ≈ 31,67%', () => {
    assert.ok(Math.abs(total.avPct - (19000 / 60000) * 100) < 1e-9)
  })

  it('planejadoByCentroCusto → 2 fatias (CC-A 60000, CC-B 0)', () => {
    const slices = planejadoByCentroCusto(rows)
    assert.strictEqual(slices.length, 2)
    assert.strictEqual(slices[0]?.valueCents, 60000)
    assert.strictEqual(slices[1]?.valueCents, 0)
  })

  it('topCentroCustoByPlanejado ordena DESC por planejado e limita a N (não muta rows)', () => {
    const top1 = topCentroCustoByPlanejado(rows, 1)
    assert.strictEqual(top1.length, 1)
    assert.strictEqual(top1[0]?.valueCents, 60000) // CC-A é o maior
    // ordenação DESC completa.
    const all = topCentroCustoByPlanejado(rows, 10)
    assert.strictEqual(all.length, 2)
    assert.ok((all[0]?.valueCents ?? 0) >= (all[1]?.valueCents ?? 0))
    // não mutou a ordem de inserção original de planejadoByCentroCusto.
    const original = planejadoByCentroCusto(rows)
    assert.strictEqual(original[0]?.valueCents, 60000)
    assert.strictEqual(original[1]?.valueCents, 0)
  })

  it('planejadoByMonth em ordem CRESCENTE (jan→dez), 12 barras', () => {
    const bars = planejadoByMonth(total)
    assert.strictEqual(bars.length, 12)
    assert.strictEqual(bars[0]?.month, 0)
    assert.strictEqual(bars[11]?.month, 11)
    // mês 0 = 40000 (CC-A), mês 1 = 20000, mês 5 = 0.
    assert.strictEqual(bars[0]?.planejadoCents, 40000)
    assert.strictEqual(bars[1]?.planejadoCents, 20000)
    assert.strictEqual(bars[5]?.planejadoCents, 0)
  })

  it('realizadoVsPrevisto expõe as 3 medidas do grand total', () => {
    const rvp = realizadoVsPrevisto(total)
    assert.strictEqual(rvp.realizadoCents, 19000)
    assert.strictEqual(rvp.planejadoCents, 60000)
    assert.strictEqual(rvp.provisionadoCents, 6000)
  })
})

describe('formatação', () => {
  it('formatBRL centavos → R$', () => {
    assert.strictEqual(formatBRL(123456), 'R$ 1.234,56')
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

describe('buildCsv — fiel ao cabeçalho legado', () => {
  const csv = buildCsv(FIX)
  const lines = csv.split('\r\n')

  it('cabeçalho exato do legado', () => {
    assert.strictEqual(
      lines[0],
      '"Centro de Custo";"Categoria";"Subcategoria";"Nome do Mês";"Valor Esperado (R$)";"Valor Realizado (R$)";"Valor Provisionado (R$)"',
    )
  })

  it('uma linha por CC/Cat/Subcat × mês presente na linha crua', () => {
    // Fixture: Sub-A1 (2 meses) + Sub-A2 (1) + Sub-B1 (1) = 4 linhas de dados + 1 header.
    assert.strictEqual(lines.length, 1 + 4)
  })

  it('primeira linha de dados = Sub-A1 janeiro com valores BRL', () => {
    assert.ok(lines[1]?.startsWith('"CC-A";"1. CAT-A";"Sub-A1";"janeiro";'))
  })

  it('MONTH_NAMES_PT tem 12 meses jan..dez', () => {
    assert.strictEqual(MONTH_NAMES_PT.length, 12)
    assert.strictEqual(MONTH_NAMES_PT[0], 'janeiro')
    assert.strictEqual(MONTH_NAMES_PT[11], 'dezembro')
  })
})

describe('placeholder real (loadBudgetTree)', () => {
  it('carrega os 7 centros de custo do legado', () => {
    const rows = loadBudgetTree()
    assert.strictEqual(rows.length, 7)
    const names = rows.map((r) => r.name)
    assert.ok(names.includes('ADMINISTRAÇÃO'))
    assert.ok(names.includes('LOGÍSTICA'))
  })

  it('grand total Planejado = R$ 77.474.064,09 (valores reais do CSV legado)', () => {
    const rows = loadBudgetTree()
    const total = grandTotal(rows)
    // 84 subcategorias reais → soma exata do relatório legado (em centavos).
    assert.strictEqual(total.planejadoCents, 7_747_406_409)
    // formatBRL usa NBSP (U+00A0/U+202F) entre "R$" e o número — normaliza p/ espaço comum na comparação.
    assert.strictEqual(formatBRL(total.planejadoCents).replace(/\s/g, ' '), 'R$ 77.474.064,09')
  })

  it('Realizado/Provisionado do grand total = 0 (fiel ao CSV — sem execução lançada)', () => {
    const rows = loadBudgetTree()
    const total = grandTotal(rows)
    assert.strictEqual(total.realizadoCents, 0)
    assert.strictEqual(total.provisionadoCents, 0)
    assert.strictEqual(total.avPct, 0)
  })

  it('todo Centro de Custo tem Realizado 0 → AV% = 0% (dado real sem execução)', () => {
    const rows = loadBudgetTree()
    for (const cc of rows) {
      assert.strictEqual(cc.totals.realizadoCents, 0)
      assert.strictEqual(cc.avPct, 0)
    }
  })

  it('o placeholder cru cobre os 7 centros de custo com as 84 subcategorias do CSV', () => {
    const ccs = new Set(REALIZADO_X_PLANEJADO_RAW.map((r) => r.centroCusto))
    assert.strictEqual(ccs.size, 7)
    assert.strictEqual(REALIZADO_X_PLANEJADO_RAW.length, 84)
  })
})
