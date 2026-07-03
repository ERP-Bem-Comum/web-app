/**
 * ViewModel PURO (§XI) do FORMULÁRIO de custo de Pessoal (US2.4c — frame 4). Campos como STRING (o que o
 * usuário digita) e o cálculo derivado em centavos. Sem React. Front-first: espelha a fórmula do legado;
 * persistência/valores reais chegam com o backend (core-api#113). Testável por node:test.
 */

/** "34.336,73" / "34336.73" → centavos (tolerante). */
export const parseCentsBR = (s: string): number => {
  const cleaned = s.replace(/[^\d,-]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0
}

/** "12,5" / "12.5" → número (percentual). */
export const parsePct = (s: string): number => {
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export type PessoalForm = Readonly<{
  nivel: string
  vinculo: string
  qtd: string
  meses: readonly number[] // índices de mês (0..11) em que o custo se aplica
  salario: string
  reajuste: string
  // Encargos mensais (%)
  inssPatronal: string
  inss: string
  fgts: string
  pis: string
  // Benefícios mensais (R$)
  valeTransporte: string
  alimentacao: string
  planoSaude: string
  seguroVida: string
  // Provisões mensais (R$)
  feriasEncargos: string
  abono: string
  decimoEncargos: string
  fgtsMultaAdicional: string
}>

export const emptyPessoalForm = (salarioCents = 0, meses: readonly number[] = []): PessoalForm => ({
  nivel: '',
  vinculo: '',
  qtd: '1',
  meses,
  salario: salarioCents > 0 ? String(salarioCents / 100) : '',
  reajuste: '0',
  inssPatronal: '0',
  inss: '0',
  fgts: '0',
  pis: '0',
  valeTransporte: '',
  alimentacao: '',
  planoSaude: '',
  seguroVida: '',
  feriasEncargos: '',
  abono: '',
  decimoEncargos: '',
  fgtsMultaAdicional: '',
})

export type PessoalCalc = Readonly<{
  salarioTotalCents: number
  totalEncargosCents: number
  totalBeneficiosCents: number
  totalProvisoesCents: number
  custoMensalCents: number
  custoAnualCents: number
}>

/**
 * Custo de pessoal:
 * - Salário Total = Salário × (1 + Reajuste%).
 * - Total Encargos = Salário Total × (INSS Patronal + INSS + FGTS + PIS)%.
 * - Total Benefícios/Provisões = soma dos respectivos campos.
 * - Custo Mensal = (Salário Total + Encargos + Benefícios + Provisões) × Qtd.
 * - Custo Anual = Custo Mensal × nº de meses aplicados.
 */
export const computePessoal = (f: PessoalForm): PessoalCalc => {
  const salarioCents = parseCentsBR(f.salario)
  const salarioTotalCents = Math.round(salarioCents * (1 + parsePct(f.reajuste) / 100))
  const encargosPct = parsePct(f.inssPatronal) + parsePct(f.inss) + parsePct(f.fgts) + parsePct(f.pis)
  const totalEncargosCents = Math.round((salarioTotalCents * encargosPct) / 100)
  const totalBeneficiosCents =
    parseCentsBR(f.valeTransporte) +
    parseCentsBR(f.alimentacao) +
    parseCentsBR(f.planoSaude) +
    parseCentsBR(f.seguroVida)
  const totalProvisoesCents =
    parseCentsBR(f.feriasEncargos) +
    parseCentsBR(f.abono) +
    parseCentsBR(f.decimoEncargos) +
    parseCentsBR(f.fgtsMultaAdicional)
  const qtd = Math.max(1, Math.trunc(Number(f.qtd) || 1))
  const custoMensalCents =
    (salarioTotalCents + totalEncargosCents + totalBeneficiosCents + totalProvisoesCents) * qtd
  const custoAnualCents = custoMensalCents * Math.max(0, f.meses.length)
  return {
    salarioTotalCents,
    totalEncargosCents,
    totalBeneficiosCents,
    totalProvisoesCents,
    custoMensalCents,
    custoAnualCents,
  }
}
