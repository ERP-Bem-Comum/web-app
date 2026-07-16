/**
 * ViewModel PURO (§XI) que traduz cada FORMULÁRIO do "Calculando Gastos" no PAYLOAD do POST correspondente.
 * Sem React, sem I/O — só forma. É a fronteira entre o que o usuário digita (STRINGS, com vírgula decimal) e
 * o que o core-api aceita (NÚMEROS: centavos inteiros e percentuais).
 *
 * Reusa os parsers dos próprios cálculos (`parseCentsBR`/`parsePct`) DE PROPÓSITO: se a tela mostrar um total
 * calculado com um parser e gravar com outro, o valor exibido e o gravado divergem — e o usuário só descobre
 * ao recarregar. Um parser, uma verdade.
 *
 * O que NÃO viaja: `nivel`/`vinculo`/`qtd` da folha, e `justificativa`/`usePrev` do form geral. O core-api não
 * tem onde guardá-los (só persiste o resultado — core-api#464). Some no salvar; é a aresta que a P.O. aceitou
 * conscientemente. Quando o #464 existir, entram todos juntos pela `data`.
 */
import {
  parseCentsBR,
  parsePct,
  type PessoalForm,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/pessoal-calc.view-model.ts'
import type { CaedForm } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/caed-calc.view-model.ts'
import type { LogisticaForm } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/logistica-calc.view-model.ts'
import type { BudgetResultArgs } from '#modules/budget-plans/client/data/repository/budget-plans.repository.ts'

/**
 * `Omit` DISTRIBUTIVO: `BudgetResultArgs` é união, e `Omit` sobre união colapsa nos campos COMUNS (perderia o
 * discriminante e os campos de cada modelo). O `T extends unknown` força a distribuição membro a membro.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** O que cada form produz: o comando SEM o alvo (o alvo é de quem sabe a rede/subcategoria/mês). */
export type BudgetResultPayload = DistributiveOmit<
  BudgetResultArgs,
  'planId' | 'budgetId' | 'subcategoryId' | 'month'
>

/** Form "Configuração" (o geral) — é o modelo IPCA: `total * (1 + ipca/100)`. */
export type ConfigForm = Readonly<{ total: string; ipca: string }>

export const configToPayload = (f: ConfigForm): BudgetResultPayload => ({
  kind: 'ipca',
  baseValueInCents: parseCentsBR(f.total),
  // IPCA aceita NEGATIVO (deflação) — por isso `Number` direto, não `parsePct` (que também serve, mas o sinal
  // aqui é significativo e vale explicitar). Vazio/inválido → 0, que é "sem correção".
  ipca: Number(f.ipca.replace(',', '.')) || 0,
})

export const caedToPayload = (f: CaedForm): BudgetResultPayload => ({
  kind: 'caed',
  numberOfEnrollments: Math.max(0, Math.trunc(Number(f.matriculas) || 0)),
  baseValueInCents: parseCentsBR(f.custoUnitario),
})

export const pessoalToPayload = (f: PessoalForm): BudgetResultPayload => ({
  kind: 'personal',
  salaryInCents: parseCentsBR(f.salario),
  salaryAdjustment: parsePct(f.reajuste),
  inssEmployer: parsePct(f.inssPatronal),
  inss: parsePct(f.inss),
  fgtsCharges: parsePct(f.fgts),
  pisCharges: parsePct(f.pis),
  foodVoucherInCents: parseCentsBR(f.alimentacao),
  transportationVouchersInCents: parseCentsBR(f.valeTransporte),
  healthInsuranceInCents: parseCentsBR(f.planoSaude),
  lifeInsuranceInCents: parseCentsBR(f.seguroVida),
  holidaysAndChargesInCents: parseCentsBR(f.feriasEncargos),
  allowanceInCents: parseCentsBR(f.abono),
  thirteenthInCents: parseCentsBR(f.decimoEncargos),
  fgtsInCents: parseCentsBR(f.fgtsMultaAdicional),
  // `qtd` fica de fora: é METADADO, não multiplica (core-api#460 — decidido contra o print do legado).
})

export const logisticaToPayload = (f: LogisticaForm): BudgetResultPayload => ({
  kind: 'logistics',
  numberOfPeople: Math.max(0, Math.trunc(Number(f.pessoas) || 0)),
  totalTrips: Math.max(0, Math.trunc(Number(f.viagens) || 0)),
  airfareInCents: parseCentsBR(f.passagem),
  dailyAccommodation: Math.max(0, Math.trunc(Number(f.diariasHospedagem) || 0)),
  accommodationInCents: parseCentsBR(f.hospedagem),
  dailyFood: Math.max(0, Math.trunc(Number(f.diariasAlimentacao) || 0)),
  foodInCents: parseCentsBR(f.alimentacao),
  dailyTransport: Math.max(0, Math.trunc(Number(f.diariasTransporte) || 0)),
  transportInCents: parseCentsBR(f.transporte),
  dailyCarAndFuel: Math.max(0, Math.trunc(Number(f.diariasCarro) || 0)),
  carAndFuelInCents: parseCentsBR(f.carroCombustivel),
})

/**
 * Índices de mês da UI (0..11) → meses do exercício (1..12) do core-api. Um erro de 1 aqui gravaria Janeiro em
 * Fevereiro — silenciosamente, porque os dois são meses válidos. Fora da faixa é DESCARTADO (não existe mês 13).
 */
export const toExerciseMonths = (monthIndices: readonly number[]): readonly number[] =>
  monthIndices.filter((i) => Number.isInteger(i) && i >= 0 && i <= 11).map((i) => i + 1)
