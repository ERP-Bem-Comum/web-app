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
})
