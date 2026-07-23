/**
 * AddBudgetModal (Vitest/jsdom) — view burra: fechada quando `open=false`; abre com as opções de estado;
 * exibe a mensagem de erro traduzida; encaminha os callbacks.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AddBudgetModal } from '#modules/budget-plans/client/planejamento/detalhe/components/add-budget-modal.component.tsx'
import type { RegionOption } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

afterEach(() => {
  cleanup()
})

const estadoOptions: readonly RegionOption[] = [
  { value: 'CE', label: 'Ceará' },
  { value: 'AC', label: 'Acre' },
]
const municipioOptions: readonly RegionOption[] = [{ value: '2304400', label: 'Caucaia' }]

const labels = {
  title: 'Adicionar Orçamento',
  close: 'Fechar',
  estado: 'Estado',
  estadoPlaceholder: 'Selecione o estado',
  municipio: 'Município',
  municipioPlaceholder: 'Todo o estado (sem município)',
  add: 'Adicionar',
  cancel: 'Cancelar',
} as const

const baseProps = (over: Record<string, unknown> = {}) => ({
  open: true,
  estado: '',
  municipio: '',
  estadoOptions,
  municipioOptions: [] as readonly RegionOption[],
  submitting: false,
  errorTag: null,
  labels,
  translateError: (tag: string) => `erro:${tag}`,
  onClose: vi.fn(),
  onEstado: vi.fn(),
  onMunicipio: vi.fn(),
  onSubmit: vi.fn(),
  ...over,
})

describe('AddBudgetModal', () => {
  it('não renderiza quando open=false', () => {
    render(<AddBudgetModal {...baseProps({ open: false })} />)
    expect(screen.queryByText('Adicionar Orçamento')).toBeNull()
  })

  it('renderiza título e as opções de estado', () => {
    render(<AddBudgetModal {...baseProps()} />)
    expect(screen.getByText('Adicionar Orçamento')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Ceará' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Acre' })).toBeTruthy()
  })

  it('exibe a mensagem de erro traduzida', () => {
    render(<AddBudgetModal {...baseProps({ errorTag: 'estado-duplicate' })} />)
    expect(screen.getByRole('alert').textContent).toContain('erro:estado-duplicate')
  })

  it('encaminha onSubmit e onEstado', () => {
    const onSubmit = vi.fn()
    const onEstado = vi.fn()
    render(<AddBudgetModal {...baseProps({ onSubmit, onEstado })} />)
    fireEvent.change(screen.getByLabelText('Estado', { selector: 'select' }), { target: { value: 'CE' } })
    expect(onEstado).toHaveBeenCalledWith('CE')
    fireEvent.click(screen.getByText('Adicionar'))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('sem municípios → o select de Município não aparece', () => {
    render(<AddBudgetModal {...baseProps({ municipioOptions: [] })} />)
    expect(screen.queryByText('Município')).toBeNull()
  })

  it('com municípios do estado → mostra o select de Município e encaminha onMunicipio', () => {
    const onMunicipio = vi.fn()
    render(<AddBudgetModal {...baseProps({ estado: 'CE', municipioOptions, onMunicipio })} />)
    expect(screen.getByRole('option', { name: 'Caucaia' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Município', { selector: 'select' }), {
      target: { value: '2304400' },
    })
    expect(onMunicipio).toHaveBeenCalledWith('2304400')
  })
})
