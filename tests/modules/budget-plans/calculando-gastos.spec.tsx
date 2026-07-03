/**
 * Testes DOM (Vitest + jsdom) do modal "Calculando Gastos" (US2.4b): renderiza abas/colunas, edita um mês
 * (lápis → input → commit) e limpa (lixeira). Usa o binding REAL (useCalcGastos) via um harness.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import type { ReactNode } from 'react'

import { CalculandoGastos } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/calculando-gastos.component.tsx'
import { useCalcGastos } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/calc-gastos.binding.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

afterEach(() => {
  cleanup()
})

const m = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const detail: PlanDetail = {
  id: 1,
  year: 2026,
  programName: 'ETI',
  programAbbreviation: 'ETI',
  version: 1.1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 100,
  networks: [],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 100,
      monthlyInCents: m({ 2: 100 }),
      networkInCents: [],
      categories: [
        {
          id: 11,
          name: 'Educacional',
          totalInCents: 100,
          monthlyInCents: m({ 2: 100 }),
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              name: 'Formação',
              totalInCents: 100,
              monthlyInCents: m({ 2: 100 }),
              networkInCents: [],
            },
          ],
        },
      ],
    },
    {
      // Centro "Pessoal" — o lápis abre o FORMULÁRIO detalhado (US2.4c), não o form "Configuração".
      id: 2,
      name: 'Pessoal',
      type: 'A PAGAR',
      totalInCents: 200,
      monthlyInCents: m({ 1: 200 }),
      networkInCents: [],
      categories: [
        {
          id: 21,
          name: 'Salários',
          totalInCents: 200,
          monthlyInCents: m({ 1: 200 }),
          networkInCents: [],
          subCategories: [
            {
              id: 211,
              name: 'Diretor',
              totalInCents: 200,
              monthlyInCents: m({ 1: 200 }),
              networkInCents: [],
              releaseType: 'DESPESAS_PESSOAIS',
            },
          ],
        },
      ],
    },
    {
      // Centro com subcategorias CAED e Logística — o lápis roteia por Tipo de lançamento.
      id: 3,
      name: 'Logística',
      type: 'A PAGAR',
      totalInCents: 300,
      monthlyInCents: m({ 1: 300 }),
      networkInCents: [],
      categories: [
        {
          id: 31,
          name: 'Viagens',
          totalInCents: 300,
          monthlyInCents: m({ 1: 300 }),
          networkInCents: [],
          subCategories: [
            {
              id: 311,
              name: 'Matrículas CAED',
              totalInCents: 300,
              monthlyInCents: m({ 1: 300 }),
              networkInCents: [],
              releaseType: 'CAED',
            },
            {
              id: 312,
              name: 'Viagem de formação',
              totalInCents: 0,
              monthlyInCents: m({}),
              networkInCents: [],
              releaseType: 'DESPESAS_LOGISTICAS',
            },
          ],
        },
      ],
    },
  ],
}

const labels = {
  titlePrefix: 'Calculando Gastos -',
  close: 'Fechar',
  prevCentro: 'Centro anterior',
  nextCentro: 'Próximo centro',
  categoria: 'Categoria',
  subcategoria: 'Subcategoria',
  despesas: 'Despesas',
  calcular: 'Calcular',
  editValue: 'Editar valor',
  clearValue: 'Limpar valor',
  empty: 'Sem despesas para exibir.',
  info: 'Configuração da despesa',
  config: 'Configuração',
  usePreviousYear: 'Utilizar ano anterior',
  totalReajustado: 'Total reajustado',
  justificativa: 'Justificativa',
  ipca: 'IPCA (%)',
  custoTotal: 'Custo Total',
  aplicarMeses: 'Aplicar aos meses',
  todos: 'Todos',
  aplicar: 'Aplicar',
  cancelar: 'Cancelar',
  pessoal: {
    tipo: 'Tipo',
    nivel: 'Nível',
    vinculo: 'Vínculo',
    remuneracao: 'Remuneração Bruta Mensal',
    qtd: 'Qtd.',
    meses: 'Meses aplicados',
    salario: 'Salário (R$)',
    reajuste: 'Reajuste (%)',
    salarioTotal: 'Salário Total',
    encargos: 'Encargos Mensais (%)',
    inssPatronal: 'INSS Patronal',
    inss: 'INSS',
    fgts: 'FGTS',
    pis: 'PIS',
    totalEncargos: 'Total Encargos',
    beneficios: 'Benefícios Mensais (R$)',
    valeTransporte: 'Vale-Transporte',
    alimentacao: 'Alimentação',
    planoSaude: 'Plano de Saúde',
    seguroVida: 'Seguro de Vida',
    totalBeneficios: 'Total Benefícios',
    provisoes: 'Provisões Mensais (R$)',
    feriasEncargos: 'Férias + Encargos',
    abono: 'Abono',
    decimoEncargos: '13º + Encargos',
    fgtsMultaAdicional: 'FGTS Multa + Adicional',
    totalProvisoes: 'Total Provisões',
    mensal: 'Custo Mensal',
    anual: 'Custo Anual',
    descartar: 'Descartar',
    salvar: 'Salvar',
  },
  caed: {
    title: 'CAED',
    matriculas: 'Qtd. matrículas',
    custoUnitario: 'Custo unitário (R$)',
    meses: 'Meses aplicados',
    mensal: 'Custo Mensal',
    anual: 'Custo Anual',
    descartar: 'Descartar',
    salvar: 'Salvar',
  },
  logistica: {
    viagem: 'Viagem',
    pessoas: 'Qtd. pessoas',
    viagens: 'Qtd. viagens',
    custos: 'Custos por viagem',
    passagem: 'Passagem aérea (R$)',
    hospedagem: 'Hospedagem (R$)',
    alimentacao: 'Alimentação (R$)',
    transporte: 'Transporte (R$)',
    carroCombustivel: 'Aluguel carro + combustível (R$)',
    diarias: 'Diárias',
    resumo: 'Resumo',
    resumoPassagens: 'Passagens Aéreas',
    resumoHospedagem: 'Hospedagem',
    resumoDespesas: 'Despesas',
    meses: 'Meses aplicados',
    mensal: 'Custo Mensal',
    anual: 'Custo Anual',
    descartar: 'Descartar',
    salvar: 'Salvar',
  },
  discardTitle: 'Descartar alterações?',
  discardBody: 'As informações preenchidas não foram salvas e serão perdidas. Deseja continuar?',
  discardKeep: 'Continuar editando',
  discardConfirm: 'Descartar',
} as const

function Harness(): ReactNode {
  const b = useCalcGastos(detail)
  return (
    <CalculandoGastos title="2026 EPV 1.1 > Ceará" binding={b} labels={labels} onClose={() => undefined} />
  )
}

/** Localiza a linha da Despesa pelo nome do mês (Janeiro/Fevereiro…). */
const monthRow = (month: string): HTMLElement => {
  const el = screen.getByText(month).closest('div')
  expect(el).toBeTruthy()
  return el as HTMLElement
}

describe('CalculandoGastos', () => {
  it('renderiza aba do centro, colunas e os 12 meses', () => {
    render(<Harness />)
    expect(screen.getByText('Consultoria')).toBeTruthy()
    expect(screen.getByText('Educacional')).toBeTruthy()
    expect(screen.getByText('Formação')).toBeTruthy()
    expect(screen.getByText('Janeiro')).toBeTruthy()
    expect(screen.getByText('Dezembro')).toBeTruthy()
    // Fevereiro = R$ 1,00 (100 centavos)
    expect(within(monthRow('Fevereiro')).getByText(/R\$\s?1,00/)).toBeTruthy()
  })

  it('lápis abre o form "Configuração"; Total reajustado + Aplicar atualiza o mês marcado', () => {
    render(<Harness />)
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    // form abriu (não é mais input inline)
    expect(screen.getByText('Configuração')).toBeTruthy()
    expect(screen.getByText('Aplicar aos meses')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Total reajustado'), { target: { value: '5' } })
    fireEvent.click(screen.getByText('Aplicar'))
    // de volta à lista: Janeiro (pré-marcado) = R$ 5,00
    expect(within(monthRow('Janeiro')).getByText(/R\$\s?5,00/)).toBeTruthy()
  })

  it('lixeira zera o valor do mês', () => {
    render(<Harness />)
    fireEvent.click(within(monthRow('Fevereiro')).getByLabelText('Limpar valor'))
    expect(within(monthRow('Fevereiro')).getByText(/R\$\s?0,00/)).toBeTruthy()
  })

  it('Cancelar no form abre a confirmação; "Continuar editando" mantém o form', () => {
    render(<Harness />)
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    expect(screen.getByText('Configuração')).toBeTruthy()
    fireEvent.click(screen.getByText('Cancelar'))
    // modal de confirmação apareceu
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('Descartar alterações?')).toBeTruthy()
    // "Continuar editando" fecha o modal e mantém o form
    fireEvent.click(within(dialog).getByText('Continuar editando'))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Configuração')).toBeTruthy()
  })

  it('Cancelar → "Descartar" na confirmação volta para a lista de meses', () => {
    render(<Harness />)
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    fireEvent.click(screen.getByText('Cancelar'))
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByText('Descartar'))
    // form fechou; lista de meses de volta (sem "Configuração")
    expect(screen.queryByText('Configuração')).toBeNull()
    expect(screen.getByText('Janeiro')).toBeTruthy()
  })

  it('Pessoal: lista de meses aparece primeiro; o lápis abre o FORMULÁRIO detalhado', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Pessoal'))
    // ainda é a lista de meses (não o form) — Janeiro = R$ 2,00 (200 centavos)
    expect(within(monthRow('Janeiro')).getByText(/R\$\s?2,00/)).toBeTruthy()
    expect(screen.queryByText('Salário Total')).toBeNull()
    // lápis abre o form detalhado
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    expect(screen.getByText('Salário Total')).toBeTruthy()
    expect(screen.getByText('Custo Mensal')).toBeTruthy()
  })

  it('Pessoal: "Descartar" no form pede confirmação e volta para a lista', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Pessoal'))
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    // botão Descartar do form (único antes do modal)
    fireEvent.click(screen.getByText('Descartar'))
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('Descartar alterações?')).toBeTruthy()
    fireEvent.click(within(dialog).getByText('Descartar'))
    // de volta à lista de meses (form sumiu)
    expect(screen.queryByText('Salário Total')).toBeNull()
    expect(within(monthRow('Janeiro')).getByText(/R\$\s?2,00/)).toBeTruthy()
  })

  it('CAED: o lápis abre o form CAED (matrículas × custo unitário)', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Logística')) // centro id 3
    // subcategoria ativa = "Matrículas CAED" (releaseType CAED)
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    expect(screen.getByText('Qtd. matrículas')).toBeTruthy()
    expect(screen.getByText('Custo unitário (R$)')).toBeTruthy()
  })

  it('Logística: selecionar a subcategoria de viagem e o lápis abre o form de Logística', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Logística'))
    fireEvent.click(screen.getByText('Viagem de formação')) // sub releaseType DESPESAS_LOGISTICAS
    fireEvent.click(within(monthRow('Janeiro')).getByLabelText('Editar valor'))
    expect(screen.getByText('Passagens Aéreas')).toBeTruthy()
    expect(screen.getByText('Custos por viagem')).toBeTruthy()
  })
})
