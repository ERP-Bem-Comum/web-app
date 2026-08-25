/**
 * AddAccountModal (Vitest/jsdom) — view burra (#138): form controlado. Campos por binding, CNPJ presente,
 * tipo segmentado dispara setType, Salvar gated por canSubmit e dispara submit. Binding mock por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AddAccountModal } from '#modules/financial/client/reconciliation-accounts/components/add-account-modal.component.tsx'
import type { AddAccountBinding } from '#modules/financial/client/reconciliation-accounts/add-account.binding.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const base = (over: Partial<AddAccountBinding> = {}): AddAccountBinding => ({
  bankCode: '',
  customBankName: '',
  needsBankName: false,
  type: 'Corrente',
  typeLabel: '',
  needsTypeLabel: false,
  agency: '',
  agencyIncomplete: false,
  account: '',
  document: '',
  nickname: '',
  openingBalance: '',
  openingBalanceDate: '',
  convenio: '',
  canSubmit: false,
  submitting: false,
  errorTag: null,
  setConvenio: vi.fn(),
  setBank: vi.fn(),
  setCustomBankName: vi.fn(),
  setType: vi.fn(),
  setTypeLabel: vi.fn(),
  setAgency: vi.fn(),
  setAccount: vi.fn(),
  setDocument: vi.fn(),
  setNickname: vi.fn(),
  setOpeningBalance: vi.fn(),
  setOpeningBalanceDate: vi.fn(),
  reset: vi.fn(),
  submit: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('AddAccountModal (#138)', () => {
  it('mostra os campos, incluindo CNPJ (exigido pelo backend)', () => {
    render(<AddAccountModal open binding={base()} onClose={vi.fn()} />)
    expect(screen.getByText(tr('financial.recon.add.field.bank'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.add.field.document'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.recon.add.field.alias'))).toBeTruthy()
  })

  it('Salvar bloqueado quando !canSubmit; habilitado e dispara submit quando pode', () => {
    const submit = vi.fn()
    const { rerender } = render(
      <AddAccountModal open binding={base({ canSubmit: false })} onClose={vi.fn()} />,
    )
    const save = () => screen.getByRole('button', { name: tr('financial.recon.add.save') })
    expect(save().hasAttribute('disabled')).toBe(true)
    rerender(<AddAccountModal open binding={base({ canSubmit: true, submit })} onClose={vi.fn()} />)
    fireEvent.click(save())
    expect(submit).toHaveBeenCalled()
  })

  it('clicar num tipo dispara setType', () => {
    const setType = vi.fn()
    render(<AddAccountModal open binding={base({ setType })} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.add.type.poupanca') }))
    expect(setType).toHaveBeenCalledWith('Poupanca')
  })

  it('Cartão corporativo e Outro são tipos REAIS (#206) e disparam setType', () => {
    const setType = vi.fn()
    render(<AddAccountModal open binding={base({ setType })} onClose={vi.fn()} />)
    const cartao = screen.getByRole('button', {
      name: tr('financial.recon.add.type.cartao'),
    }) as HTMLButtonElement
    const outro = screen.getByRole('button', {
      name: tr('financial.recon.add.type.outro'),
    }) as HTMLButtonElement
    expect(cartao.disabled).toBe(false)
    expect(outro.disabled).toBe(false)
    fireEvent.click(cartao)
    expect(setType).toHaveBeenCalledWith('Cartao')
    fireEvent.click(outro)
    expect(setType).toHaveBeenCalledWith('Outro')
  })

  it('banco "Outro" (#206): campo de instituição aparece só quando needsBankName + dispara setCustomBankName', () => {
    const setCustomBankName = vi.fn()
    const { rerender } = render(
      <AddAccountModal open binding={base({ needsBankName: false })} onClose={vi.fn()} />,
    )
    expect(screen.queryByLabelText(tr('financial.recon.add.field.bankName'))).toBeNull()
    rerender(
      <AddAccountModal open binding={base({ needsBankName: true, setCustomBankName })} onClose={vi.fn()} />,
    )
    const field = screen.getByLabelText(tr('financial.recon.add.field.bankName'))
    fireEvent.change(field, { target: { value: 'Cooperativa XYZ' } })
    expect(setCustomBankName).toHaveBeenCalledWith('Cooperativa XYZ')
  })

  it('campo de identificação (typeLabel) aparece só quando needsTypeLabel + dispara setTypeLabel', () => {
    const setTypeLabel = vi.fn()
    const { rerender } = render(
      <AddAccountModal open binding={base({ needsTypeLabel: false })} onClose={vi.fn()} />,
    )
    expect(screen.queryByLabelText(tr('financial.recon.add.field.typeLabel'))).toBeNull()
    rerender(
      <AddAccountModal open binding={base({ needsTypeLabel: true, setTypeLabel })} onClose={vi.fn()} />,
    )
    const field = screen.getByLabelText(tr('financial.recon.add.field.typeLabel'))
    fireEvent.change(field, { target: { value: 'Cartão Visa' } })
    expect(setTypeLabel).toHaveBeenCalledWith('Cartão Visa')
  })

  // ── Agência-DV (decisão da P.O., 25/08) ──────────────────────────────────────
  //
  // O DV da agência passou a ser OBRIGATÓRIO no cadastro da conta-cedente: sem ele o cadastro fica
  // incompleto e o defeito só aparece na hora de pagar.

  it('agência é exibida MASCARADA (0000-0) a partir dos dígitos crus do binding', () => {
    render(<AddAccountModal open binding={base({ agency: '14872' })} onClose={vi.fn()} />)
    const field = screen.getByLabelText(tr('financial.recon.add.field.branch'))
    expect((field as HTMLInputElement).value).toBe('1487-2')
  })

  it('o hífen é DESENHADO, não digitado — o que sobe ao binding é o texto do campo', () => {
    const setAgency = vi.fn()
    render(<AddAccountModal open binding={base({ setAgency })} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(tr('financial.recon.add.field.branch')), {
      target: { value: '14872' },
    })
    expect(setAgency).toHaveBeenCalledWith('14872')
  })

  it('⚠️ agência sem DV acusa a falta e marca o campo como inválido', () => {
    render(
      <AddAccountModal open binding={base({ agency: '1487', agencyIncomplete: true })} onClose={vi.fn()} />,
    )
    expect(screen.getByText(tr('financial.recon.add.error.branchDigit'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.recon.add.field.branch')).getAttribute('aria-invalid')).toBe(
      'true',
    )
  })

  it('campo em branco é estado inicial, não erro: mostra o hint, não a cobrança', () => {
    render(<AddAccountModal open binding={base()} onClose={vi.fn()} />)
    expect(screen.queryByText(tr('financial.recon.add.error.branchDigit'))).toBeNull()
    expect(screen.getByText(tr('financial.recon.add.hint.branch'))).toBeTruthy()
  })
})
