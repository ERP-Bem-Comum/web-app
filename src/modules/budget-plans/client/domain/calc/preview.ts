/**
 * Preview de cálculo dos 4 modelos de lançamento — funções PURAS em centavos, espelhando 1:1 o legado
 * `../ERP-BACKEND/src/common/utils/calc-total-value-result.ts` (ver HANDBOOK §B.3). Uso: mostrar o valor da
 * célula/mês em tempo real na tela "Calculando Gastos". ⚠️ O BACKEND é a fonte de verdade no submit — o
 * preview existe só para UX; uma suíte de equivalência garante paridade (specs/041…/tasks.md T051).
 *
 * Arredondamento: o legado retorna número possivelmente fracionário gravado em coluna bigint; aqui
 * normalizamos para CENTAVOS INTEIROS via Math.round no fim de cada modelo (assunção a confirmar na
 * suíte de equivalência). Não há regra de "reajuste só a partir do mês X" — cada mês é independente.
 */
import type {
  BudgetResultInput,
  CaedInput,
  IpcaInput,
  LogisticsExpensesInput,
  PersonalExpensesInput,
} from '#modules/budget-plans/client/domain/calc/types.ts'

/** IPCA: `base·(1 + ipca/100)`. */
export const previewIpca = (i: IpcaInput): number =>
  Math.round(i.baseValueInCents * (i.ipca / 100) + i.baseValueInCents)

/** CAED: `matrículas × custo unitário`. */
export const previewCaed = (i: CaedInput): number => Math.round(i.numberOfEnrollments * i.baseValueInCents)

/** Folha: salário reajustado + encargos% + benefícios + provisões (sem multiplicar por quantidade). */
export const previewPersonalExpenses = (i: PersonalExpensesInput): number => {
  const totalSalary = (i.salaryAdjustment / 100) * i.salaryInCents + i.salaryInCents
  const totalCharges =
    (i.inssEmployer / 100) * totalSalary +
    (i.inss / 100) * totalSalary +
    (i.fgtsCharges / 100) * totalSalary +
    (i.pisCharges / 100) * totalSalary
  const totalBenefits =
    i.foodVoucherInCents + i.transportationVouchersInCents + i.healthInsuranceInCents + i.lifeInsuranceInCents
  const totalProvisions =
    i.holidaysAndChargesInCents + i.allowanceInCents + i.thirteenthInCents + i.fgtsInCents
  return Math.round(totalSalary + totalCharges + totalBenefits + totalProvisions)
}

/** Logística: `(pessoas×viagens) × [passagem + hospedagem·diária + (alim+transp+carro)·diárias]`. */
export const previewLogisticsExpenses = (i: LogisticsExpensesInput): number => {
  const tripsOfPeople = i.numberOfPeople * i.totalTrips
  const airfare = tripsOfPeople * i.airfareInCents
  const accommodation = tripsOfPeople * i.dailyAccommodation * i.accommodationInCents
  const expenses =
    tripsOfPeople * i.dailyFood * i.foodInCents +
    tripsOfPeople * i.dailyTransport * i.transportInCents +
    tripsOfPeople * i.dailyCarAndFuel * i.carAndFuelInCents
  return Math.round(airfare + accommodation + expenses)
}

/** Dispatcher exaustivo por `releaseType` (§IV) → valor da célula em centavos inteiros. */
export const previewBudgetResult = (input: BudgetResultInput): number => {
  switch (input.releaseType) {
    case 'DESPESAS_PESSOAIS':
      return previewPersonalExpenses(input)
    case 'IPCA':
      return previewIpca(input)
    case 'CAED':
      return previewCaed(input)
    case 'DESPESAS_LOGISTICAS':
      return previewLogisticsExpenses(input)
    default: {
      const _exhaustive: never = input
      return _exhaustive
    }
  }
}
