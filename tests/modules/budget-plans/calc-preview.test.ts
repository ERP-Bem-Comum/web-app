/**
 * Testes das 4 fórmulas de preview do Plano Orçamentário — espelham `calc-total-value-result.ts` do legado.
 * Valores em CENTAVOS. Casos-âncora com dados reais observados (prints EPV/PARC). TDD: escrito ANTES/junto.
 * Servem de base para a futura suíte de equivalência preview↔backend (T051).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  previewBudgetResult,
  previewIpca,
  previewCaed,
  previewPersonalExpenses,
  previewLogisticsExpenses,
} from '#modules/budget-plans/client/domain/calc/preview.ts'
import type {
  IpcaInput,
  CaedInput,
  PersonalExpensesInput,
  LogisticsExpensesInput,
} from '#modules/budget-plans/client/domain/calc/types.ts'

describe('previewIpca', () => {
  it('aplica ipca% sobre o valor base', () => {
    const i: IpcaInput = { releaseType: 'IPCA', baseValueInCents: 100_000, ipca: 10 }
    assert.equal(previewIpca(i), 110_000)
  })
  it('ipca 0 retorna o valor base', () => {
    const i: IpcaInput = { releaseType: 'IPCA', baseValueInCents: 7_857_824, ipca: 0 }
    assert.equal(previewIpca(i), 7_857_824)
  })
})

describe('previewCaed', () => {
  it('matrículas × custo unitário', () => {
    const i: CaedInput = { releaseType: 'CAED', numberOfEnrollments: 50, baseValueInCents: 13_330 }
    assert.equal(previewCaed(i), 666_500)
  })
})

describe('previewPersonalExpenses', () => {
  it('salário reajustado + encargos% + benefícios + provisões (não multiplica por qtd)', () => {
    const i: PersonalExpensesInput = {
      releaseType: 'DESPESAS_PESSOAIS',
      salaryInCents: 500_000,
      salaryAdjustment: 0,
      inssEmployer: 20,
      inss: 0,
      fgtsCharges: 8,
      pisCharges: 0,
      foodVoucherInCents: 0,
      transportationVouchersInCents: 0,
      healthInsuranceInCents: 0,
      lifeInsuranceInCents: 0,
      holidaysAndChargesInCents: 0,
      allowanceInCents: 0,
      thirteenthInCents: 0,
      fgtsInCents: 0,
    }
    // 500000 + (0.2+0.08)*500000 = 500000 + 140000 = 640000
    assert.equal(previewPersonalExpenses(i), 640_000)
  })

  it('soma benefícios e provisões e arredonda para centavos inteiros', () => {
    const i: PersonalExpensesInput = {
      releaseType: 'DESPESAS_PESSOAIS',
      salaryInCents: 333,
      salaryAdjustment: 10, // 366.3
      inssEmployer: 0,
      inss: 0,
      fgtsCharges: 0,
      pisCharges: 0,
      foodVoucherInCents: 100,
      transportationVouchersInCents: 0,
      healthInsuranceInCents: 0,
      lifeInsuranceInCents: 0,
      holidaysAndChargesInCents: 50,
      allowanceInCents: 0,
      thirteenthInCents: 0,
      fgtsInCents: 0,
    }
    // 366.3 + 0 + 100 + 50 = 516.3 → round 516
    assert.equal(previewPersonalExpenses(i), 516)
  })
})

describe('previewLogisticsExpenses', () => {
  it('só passagem (1 pessoa × 1 viagem) — dado real "Passagens aéreas" = R$ 76.230,00', () => {
    const i: LogisticsExpensesInput = {
      releaseType: 'DESPESAS_LOGISTICAS',
      numberOfPeople: 1,
      totalTrips: 1,
      airfareInCents: 7_623_000,
      accommodationInCents: 0,
      dailyAccommodation: 0,
      foodInCents: 0,
      dailyFood: 0,
      transportInCents: 0,
      dailyTransport: 0,
      carAndFuelInCents: 0,
      dailyCarAndFuel: 0,
    }
    assert.equal(previewLogisticsExpenses(i), 7_623_000)
  })

  it('transporte × diária (1 pessoa × 1 viagem) — dado real "Despesas de viagem" = R$ 17.410,00', () => {
    const i: LogisticsExpensesInput = {
      releaseType: 'DESPESAS_LOGISTICAS',
      numberOfPeople: 1,
      totalTrips: 1,
      airfareInCents: 0,
      accommodationInCents: 0,
      dailyAccommodation: 0,
      foodInCents: 0,
      dailyFood: 0,
      transportInCents: 1_741_000,
      dailyTransport: 1,
      carAndFuelInCents: 0,
      dailyCarAndFuel: 0,
    }
    assert.equal(previewLogisticsExpenses(i), 1_741_000)
  })

  it('multiplica por pessoas × viagens × diárias', () => {
    const i: LogisticsExpensesInput = {
      releaseType: 'DESPESAS_LOGISTICAS',
      numberOfPeople: 2,
      totalTrips: 3,
      airfareInCents: 100_000,
      accommodationInCents: 20_000,
      dailyAccommodation: 4,
      foodInCents: 5_000,
      dailyFood: 4,
      transportInCents: 3_000,
      dailyTransport: 2,
      carAndFuelInCents: 0,
      dailyCarAndFuel: 0,
    }
    // trips=6; air=6*100000=600000; accom=6*4*20000=480000; food=6*4*5000=120000; transp=6*2*3000=36000
    // total=600000+480000+120000+36000=1236000
    assert.equal(previewLogisticsExpenses(i), 1_236_000)
  })
})

describe('previewBudgetResult (dispatcher)', () => {
  it('roteia por releaseType', () => {
    assert.equal(previewBudgetResult({ releaseType: 'IPCA', baseValueInCents: 100_000, ipca: 10 }), 110_000)
    assert.equal(
      previewBudgetResult({ releaseType: 'CAED', numberOfEnrollments: 2, baseValueInCents: 500 }),
      1_000,
    )
  })
})
