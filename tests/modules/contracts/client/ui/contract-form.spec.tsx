/**
 * ContractForm (Vitest/jsdom) — view burra: validação de botão Finalizar,
 * destaque de campos obrigatórios e checklist do aside.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ContractForm } from '#modules/contracts/client/contract-create/components/contract-form.component.tsx'
import type { ContractFormState } from '#modules/contracts/client/contract-create/components/contract-form.controller.ts'

afterEach(() => {
  cleanup()
})

const baseState = (): ContractFormState => ({
  title: '',
  objective: '',
  originalValueCents: 0,
  valorInput: '',
  originalPeriodStart: '',
  originalPeriodEnd: '',
  classification: 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
  supplierId: '',
  financierId: '',
  collaboratorId: '',
  actId: '',
  programId: null,
  budgetPlanId: null,
  categorizacao: null,
  centroDeCusto: null,
  costCenterRef: null,
  categoryRef: null,
  subcategoryRef: null,
  email: '',
  telephone: '',
  observations: '',
  bancaryInfo: { bank: '', agency: '', accountNumber: '', dv: '' },
  pixInfo: { keyType: '', key: '' },
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  state: baseState(),
  onUpdate: vi.fn(),
  onSubmit: vi.fn(),
  submitting: false,
  errorText: null,
  selectedPartner: null,
  onSelectPartner: vi.fn(),
  onRemovePartner: vi.fn(),
  checklist: {
    checks: {
      contratado: false,
      contrato: false,
      valor: false,
      vigencia: false,
      programa: false,
      categorizacao: false,
      centroDeCusto: false,
    },
    done: 0,
    total: 7,
  },
  isOvertopOS: false,
  validationAttempted: false,
  onCancel: vi.fn(),
  onOpenModal: vi.fn(),
  partnerSearchQuery: '',
  onPartnerSearchQueryChange: vi.fn(),
  partnerSearchResults: [],
  partnerSearchLoading: false,
  partnerSearchOpen: false,
  onPartnerSearchOpen: vi.fn(),
  onPartnerSearchClose: vi.fn(),
  onCreateNewPartner: vi.fn(),
  documentUploaded: false,
  currentYear: 2026,
  programOptions: [],
  costCenterOptions: [],
  categoryOptions: [],
  subcategoryOptions: [],
  budgetPlanOptions: [],
  onSelectPlan: vi.fn(),
  onSelectCostCenter: vi.fn(),
  onSelectCategory: vi.fn(),
  onSelectSubcategory: vi.fn(),
  ...over,
})

describe('ContractForm', () => {
  it('renderiza título da página', () => {
    render(<ContractForm {...baseProps()} />)
    expect(screen.getByText('Novo Contrato')).toBeTruthy()
  })

  it('botão Finalizar habilitado quando isOvertopOS é false', () => {
    render(<ContractForm {...baseProps()} />)
    const btn = screen.getByRole('button', { name: /salvar/i })
    expect(btn.hasAttribute('disabled')).toBe(false)
  })

  it('botão Finalizar desabilitado quando isOvertopOS é true', () => {
    render(<ContractForm {...baseProps({ isOvertopOS: true })} />)
    const btn = screen.getByRole('button', { name: /salvar/i })
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('botão Finalizar desabilitado quando submitting', () => {
    render(<ContractForm {...baseProps({ submitting: true })} />)
    const btn = screen.getByRole('button', { name: /carregando/i })
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('checklist aside mostra 7 itens', () => {
    render(<ContractForm {...baseProps()} />)
    expect(screen.getByText('Contratado selecionado')).toBeTruthy()
    expect(screen.getByText('Tipo, Modelo e Objeto preenchidos')).toBeTruthy()
    expect(screen.getByText('Valor original informado')).toBeTruthy()
    expect(screen.getByText('Início e fim da vigência')).toBeTruthy()
    expect(screen.getByText('Programa e plano orçamentário')).toBeTruthy()
    expect(screen.getByText('Categoria preenchida')).toBeTruthy()
    expect(screen.getByText('Centro de custo selecionado')).toBeTruthy()
    expect(screen.getByText('Documento principal anexado')).toBeTruthy()
  })

  it('checklist progresso mostra 0 / 8', () => {
    render(<ContractForm {...baseProps()} />)
    expect(screen.getByText('0 / 8')).toBeTruthy()
  })

  it('encaminha onOpenModal ao clicar Finalizar', () => {
    const onOpenModal = vi.fn()
    render(<ContractForm {...baseProps({ onOpenModal })} />)
    const btn = screen.getByRole('button', { name: /salvar/i })
    btn.click()
    expect(onOpenModal).toHaveBeenCalled()
  })

  // #502/S3: cascata da árvore do plano no contrato.
  it('Centro de custo fica DESABILITADO enquanto não há plano selecionado', () => {
    render(<ContractForm {...baseProps()} />)
    const centro = screen.getByDisplayValue('Escolha o plano primeiro') as HTMLSelectElement
    expect(centro.hasAttribute('disabled')).toBe(true)
  })

  it('com plano + opções da árvore, o Centro habilita e selecionar dispara onSelectCostCenter(ref, nome)', () => {
    const onSelectCostCenter = vi.fn()
    const state = { ...baseState(), budgetPlanId: 'p-1' }
    render(
      <ContractForm
        {...baseProps({
          state,
          costCenterOptions: [{ value: 'cc-luz', label: 'Luz' }],
          onSelectCostCenter,
        })}
      />,
    )
    const centro = screen.getByRole('option', { name: 'Luz' }).parentElement as HTMLSelectElement
    expect(centro.hasAttribute('disabled')).toBe(false)
    fireEvent.change(centro, { target: { value: 'cc-luz' } })
    expect(onSelectCostCenter).toHaveBeenCalledWith('cc-luz', 'Luz')
  })

  it('Subcategoria REAL (não mais placeholder morto): habilita com categoria e dispara onSelectSubcategory', () => {
    const onSelectSubcategory = vi.fn()
    const state = { ...baseState(), budgetPlanId: 'p-1', costCenterRef: 'cc-luz', categoryRef: 'cat-noite' }
    render(
      <ContractForm
        {...baseProps({
          state,
          subcategoryOptions: [{ value: 'sub-dia', label: 'Dia' }],
          onSelectSubcategory,
        })}
      />,
    )
    const sub = screen.getByRole('option', { name: 'Dia' }).parentElement as HTMLSelectElement
    expect(sub.hasAttribute('disabled')).toBe(false)
    fireEvent.change(sub, { target: { value: 'sub-dia' } })
    expect(onSelectSubcategory).toHaveBeenCalledWith('sub-dia')
  })
})
