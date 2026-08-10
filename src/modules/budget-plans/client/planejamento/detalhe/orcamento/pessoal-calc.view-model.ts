/**
 * ViewModel PURO (§XI) do FORMULÁRIO de custo de Pessoal (US2.4c — frame 4). Campos como STRING (o que o
 * usuário digita) e o cálculo derivado em centavos. Sem React. Testável por node:test.
 *
 * Espelha a fórmula do legado — agora de fato: até 2026-07-15 este docblock afirmava isso enquanto o cálculo
 * multiplicava por `qtd`, coisa que o legado não faz (core-api#460). A afirmação era a única "prova" de
 * paridade, e estava errada; por isso a regra agora é TESTE (paridade contra o print da P.O.), não comentário.
 */

/** "34.336,73" / "34336.73" → centavos (tolerante). */
export const parseCentsBR = (s: string): number => {
  const cleaned = s.replace(/[^\d,-]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0
}

/**
 * Agrupa o milhar SEM regex. A forma clássica (`/\B(?=(\d{3})+(?!\d))/g`) tem quantificador aninhado — é o
 * padrão de ReDoS que o `security/detect-unsafe-regex` acusa, e isto roda a CADA TECLA. Este laço é linear.
 */
const groupThousands = (digits: string): string => {
  let out = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.'
    out += digits[i] ?? ''
  }
  return out
}

/**
 * Máscara de VALOR enquanto o usuário digita (pedido da P.O.: o campo tem que parecer dinheiro, como os
 * totais). Agrupa o milhar e aceita UMA vírgula decimal: "2500" → "2.500"; "2500,5" → "2.500,5".
 *
 * ⚠️ NÃO é máscara de centavos (aquela em que "2500" vira "25,00"): o que se digita continua valendo REAIS,
 * exatamente como antes. A escolha foi da P.O. — a de centavos mudaria o significado de todo número já
 * digitado (os mesmos "2500" passariam a valer 100× menos), inclusive do que já está gravado.
 *
 * Casa com `parseCentsBR`, que ignora o ponto de milhar e lê a vírgula como decimal — máscara e parser são
 * o mesmo par: formatar de um jeito e ler de outro faria o mostrado divergir do gravado.
 */
export const maskValorBR = (raw: string): string => {
  // Só dígitos e vírgula; a PRIMEIRA vírgula manda (digitar outra não quebra o número, é ignorada).
  const cleaned = raw.replace(/[^\d,]/g, '')
  const [intRaw = '', ...rest] = cleaned.split(',')
  const decRaw = rest.join('')
  // Centavos: 2 casas bastam (dinheiro). Digitar mais não some com o dígito — só não entra.
  const dec = decRaw.slice(0, 2)
  // Zeros à esquerda saem ("007" → "7"), mas "" continua "" (campo vazio ≠ zero).
  const int = intRaw.replace(/^0+(?=\d)/, '')
  const grouped = groupThousands(int)
  if (!cleaned.includes(',')) return grouped
  return `${grouped},${dec}` // vírgula digitada FICA, mesmo sem decimal ainda ("2500," → "2.500,")
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
 * - Custo Mensal = Salário Total + Encargos + Benefícios + Provisões.
 * - Custo Anual = Custo Mensal × nº de meses aplicados.
 *
 * ── A "Qtd" NÃO multiplica (core-api#460, decisão da P.O. 2026-07-15) ──
 * Este cálculo multiplicava por `qtd` e o docblock dizia "espelha a fórmula do legado" — **não espelhava**.
 * O legado (`calc-total-value-result.ts`, `DESPESAS_PESSOAIS`) devolve `totalSalary + totalCharges +
 * totalBenefits + totalProvisions`, **sem quantidade nenhuma** — e o core-api reproduz isso (`calc-model.ts`).
 * Éramos nós que divergíamos: com Qtd > 1 o preview do front mostrava N× o valor que o backend gravaria.
 *
 * Não é distração do legado: ele SABE multiplicar por contagem — faz isso em `CAED`
 * (`numberOfEnrollments * baseValueInCents`) e em `DESPESAS_LOGISTICAS` (`numberOfPeople * totalTrips`).
 * Na folha, deliberadamente não faz: o campo se chama `numberOfFinancialDirectors`, nunca entra em cálculo
 * algum e o import de Excel do legado o força em `1` — é METADADO.
 *
 * `qtd` segue no form (o legado o exibe e persiste), mas fora da conta.
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
  // `f.qtd` NÃO entra aqui — é metadado (ver docblock / core-api#460).
  const custoMensalCents = salarioTotalCents + totalEncargosCents + totalBeneficiosCents + totalProvisoesCents
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
