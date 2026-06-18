import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { FinancierForm } from '#modules/partners/client/financier-create/components/financier-form.component.tsx'
import type { FinancierFormController } from '#modules/partners/client/financier-create/components/financier-form.controller.ts'

afterEach(() => {
  cleanup()
})

const stubController = (over: Partial<FinancierFormController> = {}): FinancierFormController => ({
  state: {
    name: '',
    corporateName: '',
    legalRepresentative: '',
    cnpj: '',
    telephone: '',
    address: '',
    bank: '',
    agency: '',
    accountNumber: '',
    checkDigit: '',
    pixKeyType: 'cpf',
    pixKey: '',
  },
  errors: {},
  setField: () => undefined,
  reset: () => undefined,
  submit: () => undefined,
  ...over,
})

describe('FinancierForm', () => {
  it('ao escolher o tipo de chave PIX, auto-preenche a chave com o dado do form (CNPJ/telefone)', () => {
    const setField = vi.fn()
    render(
      <FinancierForm
        controller={stubController({
          state: { ...stubController().state, cnpj: '12345678000190', telephone: '11988887777' },
          setField,
        })}
        running={false}
        errorTag={null}
        onCancel={() => undefined}
      />,
    )
    const pixType = screen.getByLabelText('Tipo de chave PIX')

    fireEvent.change(pixType, { target: { value: 'cnpj' } })
    expect(setField).toHaveBeenCalledWith('pixKeyType', 'cnpj')
    expect(setField).toHaveBeenCalledWith('pixKey', '12345678000190')

    fireEvent.change(pixType, { target: { value: 'phone' } })
    expect(setField).toHaveBeenCalledWith('pixKey', '11988887777')

    fireEvent.change(pixType, { target: { value: 'random-key' } })
    expect(setField).toHaveBeenCalledWith('pixKey', '')
  })
})
