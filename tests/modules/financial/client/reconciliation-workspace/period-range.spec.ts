/**
 * resolvePeriodRange (#205) — resolve o preset/intervalo do header em from/to (ISO date-only) p/ o extrato
 * por período. PURA (now injetado). Vitest (o símbolo vive num módulo de binding com React).
 */
import { describe, it, expect } from 'vitest'

import { resolvePeriodRange } from '#modules/financial/client/reconciliation-workspace/header-menus.binding.ts'

// 15/mai/2026 (mês 0-indexado = 4), data local.
const NOW = new Date(2026, 4, 15)

describe('resolvePeriodRange', () => {
  it('today / yesterday', () => {
    expect(resolvePeriodRange('today', '', '', NOW)).toEqual({ from: '2026-05-15', to: '2026-05-15' })
    expect(resolvePeriodRange('yesterday', '', '', NOW)).toEqual({ from: '2026-05-14', to: '2026-05-14' })
  })
  it('last7 = 6 dias atrás → hoje', () => {
    expect(resolvePeriodRange('last7', '', '', NOW)).toEqual({ from: '2026-05-09', to: '2026-05-15' })
  })
  it('month / lastMonth = mês cheio', () => {
    expect(resolvePeriodRange('month', '', '', NOW)).toEqual({ from: '2026-05-01', to: '2026-05-31' })
    expect(resolvePeriodRange('lastMonth', '', '', NOW)).toEqual({ from: '2026-04-01', to: '2026-04-30' })
  })
  it('quarter = trimestre cheio (abr–jun)', () => {
    expect(resolvePeriodRange('quarter', '', '', NOW)).toEqual({ from: '2026-04-01', to: '2026-06-30' })
  })
  it('custom: completo usa as datas; incompleto → null', () => {
    expect(resolvePeriodRange('custom', '2026-01-10', '2026-02-20', NOW)).toEqual({
      from: '2026-01-10',
      to: '2026-02-20',
    })
    expect(resolvePeriodRange('custom', '2026-01-10', '', NOW)).toBeNull()
    expect(resolvePeriodRange('custom', '', '', NOW)).toBeNull()
  })
})
