/**
 * Testes puros (feature 060 + core-api#416) de `buildInsightsView`: rótulos em BRL, delta de cada ano anterior
 * FRENTE ao ano atual e o tom (subiu/desceu/igual), + Histórico (média 5 anos), Realizado e média por rede
 * do HANDBOOK §1.6 — incluindo a regra de HONESTIDADE (dado ausente = "—", nunca R$ 0,00). Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { buildInsightsView } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.view-model.ts'
import type { BudgetPlanInsights } from '#modules/budget-plans/client/data/model/plan-actions.model.ts'

const insights: BudgetPlanInsights = {
  current: { year: 2027, totalInCents: 300_000, realizedInCents: 250_000 },
  previousYears: [
    { year: 2026, totalInCents: 200_000, realizedInCents: null }, // atual > anterior ⇒ up
    { year: 2025, totalInCents: 400_000, realizedInCents: null }, // atual < anterior ⇒ down
    { year: 2024, totalInCents: 300_000, realizedInCents: null }, // igual ⇒ flat
  ],
  networksCount: 3,
}

describe('buildInsightsView', () => {
  const view = buildInsightsView(insights)

  it('deriva o cabeçalho do ano atual', () => {
    assert.equal(view.currentYear, 2027)
    assert.ok(view.currentTotalLabel.includes('3.000,00'))
  })

  it('gera uma linha por ano anterior, na ordem', () => {
    assert.deepEqual(
      view.rows.map((r) => r.year),
      [2026, 2025, 2024],
    )
  })

  it('classifica o tom do delta (up/down/flat)', () => {
    assert.equal(view.rows[0]?.deltaTone, 'up')
    assert.equal(view.rows[1]?.deltaTone, 'down')
    assert.equal(view.rows[2]?.deltaTone, 'flat')
  })

  it('rotula o delta com sinal explícito', () => {
    assert.ok(view.rows[0]?.deltaLabel.startsWith('+ '))
    assert.ok(view.rows[1]?.deltaLabel.startsWith('- '))
    assert.equal(view.rows[2]?.deltaTone, 'flat')
  })

  it('sem anos anteriores → nenhuma linha', () => {
    const empty = buildInsightsView({
      current: { year: 2027, totalInCents: 0, realizedInCents: 0 },
      previousYears: [],
      networksCount: 0,
    })
    assert.equal(empty.rows.length, 0)
  })
})

// ── HANDBOOK §1.6 + core-api#416 ──────────────────────────────────────────────
describe('buildInsightsView — card do ano (§1.6)', () => {
  const view = buildInsightsView(insights)

  it('Realizado sai do `realizedInCents` (Σ conciliado)', () => {
    assert.ok(view.realizedLabel.includes('2.500,00'))
  })

  it('média por rede = Planejado ÷ networksCount', () => {
    // 300.000 centavos ÷ 3 redes = 100.000 centavos = R$ 1.000,00
    assert.ok(view.networksAvgLabel.includes('1.000,00'))
    assert.equal(view.networksCountLabel, '3 redes')
  })

  it('Histórico = média do Planejado dos anos anteriores', () => {
    // (200.000 + 400.000 + 300.000) / 3 = 300.000 centavos = R$ 3.000,00
    assert.ok(view.historyAvgLabel.includes('3.000,00'))
  })

  it('Histórico usa só os 5 anos anteriores MAIS RECENTES', () => {
    const many = buildInsightsView({
      current: { year: 2027, totalInCents: 0, realizedInCents: null },
      // 6 anos: os 5 mais recentes (2026..2022) valem 100.000; o 6º (2021) é um outlier que deve ficar de fora.
      previousYears: [
        { year: 2026, totalInCents: 100_000, realizedInCents: null },
        { year: 2025, totalInCents: 100_000, realizedInCents: null },
        { year: 2024, totalInCents: 100_000, realizedInCents: null },
        { year: 2023, totalInCents: 100_000, realizedInCents: null },
        { year: 2022, totalInCents: 100_000, realizedInCents: null },
        { year: 2021, totalInCents: 999_999_999, realizedInCents: null },
      ],
      networksCount: null,
    })
    assert.ok(many.historyAvgLabel.includes('1.000,00'))
  })
})

// A regra que impede a tela de MENTIR: ausente ≠ zero. Ver "HONESTIDADE" no topo da ViewModel.
describe('buildInsightsView — honestidade: dado ausente vira "—", nunca R$ 0,00', () => {
  const semDado = buildInsightsView({
    current: { year: 2027, totalInCents: 300_000, realizedInCents: null },
    previousYears: [],
    networksCount: null,
  })

  it('Realizado desconhecido → "—" (não "R$ 0,00", que afirmaria "nada foi realizado")', () => {
    assert.equal(semDado.realizedLabel, '—')
  })

  it('contagem de redes desconhecida → "—" no rótulo e na média', () => {
    assert.equal(semDado.networksCountLabel, '—')
    assert.equal(semDado.networksAvgLabel, '—')
  })

  it('sem ano anterior → Histórico "—" (não existe média de nada)', () => {
    assert.equal(semDado.historyAvgLabel, '—')
  })

  it('ZERO redes → média "—" (divisão por zero não é R$ 0,00 nem ∞)', () => {
    const zeroRedes = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: null },
      previousYears: [],
      networksCount: 0,
    })
    assert.equal(zeroRedes.networksAvgLabel, '—')
    assert.equal(zeroRedes.networksCountLabel, '0 redes')
  })

  it('Realizado ZERO de verdade → "R$ 0,00" (zero conhecido ≠ desconhecido)', () => {
    const zeroReal = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: 0 },
      previousYears: [],
      networksCount: 1,
    })
    assert.ok(zeroReal.realizedLabel.includes('0,00'))
    assert.notEqual(zeroReal.realizedLabel, '—')
  })
})
