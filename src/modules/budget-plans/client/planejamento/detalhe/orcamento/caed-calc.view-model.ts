/**
 * ViewModel PURO (§XI) do FORMULÁRIO CAED (Tipo C — §1.8): matrículas × custo unitário. Campos como STRING
 * (o que o usuário digita); o total reusa `previewCaed` (domínio, já testado). Sem React. Testável por node:test.
 */
import { previewCaed } from '#modules/budget-plans/client/domain/calc/preview.ts'
import { parseCentsBR } from './pessoal-calc.view-model.ts'

/** Inteiro não-negativo a partir do input (matrículas). */
export const parseCount = (s: string): number => Math.max(0, Math.trunc(Number(s.replace(',', '.')) || 0))

export type CaedForm = Readonly<{
  matriculas: string
  custoUnitario: string
  meses: readonly number[] // índices de mês (0..11)
}>

export const emptyCaedForm = (meses: readonly number[] = []): CaedForm => ({
  matriculas: '',
  custoUnitario: '',
  meses,
})

export type CaedCalc = Readonly<{ custoMensalCents: number; custoAnualCents: number }>

export const computeCaed = (f: CaedForm): CaedCalc => {
  const custoMensalCents = previewCaed({
    releaseType: 'CAED',
    numberOfEnrollments: parseCount(f.matriculas),
    baseValueInCents: parseCentsBR(f.custoUnitario),
  })
  return { custoMensalCents, custoAnualCents: custoMensalCents * f.meses.length }
}
