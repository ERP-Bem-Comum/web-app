/**
 * Inputs dos 4 modelos de lançamento (união discriminada por `releaseType`) — §IV: estados ilegais
 * irrepresentáveis. Todos os valores monetários em CENTAVOS (inteiros). Espelha `BudgetResultData` do
 * legado (ver HANDBOOK §B.3). Campos de metadado (education/vínculo/qtd de folha) ficam fora do cálculo.
 */
import type {
  Education,
  EmploymentRelationship,
  ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

/** Folha: salário reajustado + encargos% + benefícios + provisões. NÃO multiplica por quantidade (metadado). */
export type PersonalExpensesInput = Readonly<{
  releaseType: 'DESPESAS_PESSOAIS'
  salaryInCents: number
  salaryAdjustment: number // %
  inssEmployer: number // %
  inss: number // %
  fgtsCharges: number // %
  pisCharges: number // %
  foodVoucherInCents: number
  transportationVouchersInCents: number
  healthInsuranceInCents: number
  lifeInsuranceInCents: number
  holidaysAndChargesInCents: number
  allowanceInCents: number
  thirteenthInCents: number
  fgtsInCents: number
  // metadados (não entram no total):
  education?: Education
  employmentRelationship?: EmploymentRelationship
  numberOfFinancialDirectors?: number
}>

/** IPCA: valor-base corrigido pelo IPCA%. */
export type IpcaInput = Readonly<{
  releaseType: 'IPCA'
  baseValueInCents: number
  ipca: number // %
  justification?: string
}>

/** CAED: matrículas × custo unitário. */
export type CaedInput = Readonly<{
  releaseType: 'CAED'
  numberOfEnrollments: number
  baseValueInCents: number
}>

/** Logística/viagem: (pessoas × viagens) × [passagem + hospedagem·diária + despesas·diária]. */
export type LogisticsExpensesInput = Readonly<{
  releaseType: 'DESPESAS_LOGISTICAS'
  numberOfPeople: number
  totalTrips: number
  airfareInCents: number
  accommodationInCents: number
  dailyAccommodation: number
  foodInCents: number
  dailyFood: number
  transportInCents: number
  dailyTransport: number
  carAndFuelInCents: number
  dailyCarAndFuel: number
}>

export type BudgetResultInput = PersonalExpensesInput | IpcaInput | CaedInput | LogisticsExpensesInput

/** Garantia em tempo de compilação de que a união cobre todos os ReleaseType. */
export type _AssertReleaseTypeCovered = ReleaseType extends BudgetResultInput['releaseType'] ? true : never
