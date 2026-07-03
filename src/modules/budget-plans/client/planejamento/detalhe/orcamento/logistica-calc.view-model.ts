/**
 * ViewModel PURO (§XI) do FORMULÁRIO de Logística (Tipo D — §1.8): viagem = (pessoas × viagens) ×
 * [passagem + hospedagem·diárias + (alimentação/transporte/carro)·diárias]. Campos como STRING; o total
 * reusa `previewLogisticsExpenses` (domínio, já testado) e a quebra por cartão (Passagens/Hospedagem/
 * Despesas) é derivada localmente. Sem React. Testável por node:test.
 */
import { previewLogisticsExpenses } from '#modules/budget-plans/client/domain/calc/preview.ts'
import { parseCentsBR, parsePct } from './pessoal-calc.view-model.ts'
import { parseCount } from './caed-calc.view-model.ts'

export type LogisticaForm = Readonly<{
  pessoas: string
  viagens: string
  passagem: string
  hospedagem: string
  diariasHospedagem: string
  alimentacao: string
  diariasAlimentacao: string
  transporte: string
  diariasTransporte: string
  carroCombustivel: string
  diariasCarro: string
  meses: readonly number[]
}>

export const emptyLogisticaForm = (meses: readonly number[] = []): LogisticaForm => ({
  pessoas: '1',
  viagens: '1',
  passagem: '',
  hospedagem: '',
  diariasHospedagem: '1',
  alimentacao: '',
  diariasAlimentacao: '1',
  transporte: '',
  diariasTransporte: '1',
  carroCombustivel: '',
  diariasCarro: '1',
  meses,
})

export type LogisticaCalc = Readonly<{
  passagensCents: number
  hospedagemCents: number
  despesasCents: number
  custoMensalCents: number
  custoAnualCents: number
}>

export const computeLogistica = (f: LogisticaForm): LogisticaCalc => {
  const tripsOfPeople = parseCount(f.pessoas) * parseCount(f.viagens)
  const passagensCents = Math.round(tripsOfPeople * parseCentsBR(f.passagem))
  const hospedagemCents = Math.round(
    tripsOfPeople * parsePct(f.diariasHospedagem) * parseCentsBR(f.hospedagem),
  )
  const despesasCents = Math.round(
    tripsOfPeople * parsePct(f.diariasAlimentacao) * parseCentsBR(f.alimentacao) +
      tripsOfPeople * parsePct(f.diariasTransporte) * parseCentsBR(f.transporte) +
      tripsOfPeople * parsePct(f.diariasCarro) * parseCentsBR(f.carroCombustivel),
  )
  // Total canônico via o preview de domínio (fonte de verdade da fórmula).
  const custoMensalCents = previewLogisticsExpenses({
    releaseType: 'DESPESAS_LOGISTICAS',
    numberOfPeople: parseCount(f.pessoas),
    totalTrips: parseCount(f.viagens),
    airfareInCents: parseCentsBR(f.passagem),
    accommodationInCents: parseCentsBR(f.hospedagem),
    dailyAccommodation: parsePct(f.diariasHospedagem),
    foodInCents: parseCentsBR(f.alimentacao),
    dailyFood: parsePct(f.diariasAlimentacao),
    transportInCents: parseCentsBR(f.transporte),
    dailyTransport: parsePct(f.diariasTransporte),
    carAndFuelInCents: parseCentsBR(f.carroCombustivel),
    dailyCarAndFuel: parsePct(f.diariasCarro),
  })
  return {
    passagensCents,
    hospedagemCents,
    despesasCents,
    custoMensalCents,
    custoAnualCents: custoMensalCents * f.meses.length,
  }
}
