import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  useSupplierFormController,
  type SupplierFormValues,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'

describe('useSupplierFormController', () => {
  it('bloqueia submit inválido: não chama onSubmit e marca erros', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('submit válido: emite os valores com CNPJ normalizado e grupos opcionais nulos', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('name', 'Acme')
      result.current.setField('corporateName', 'Acme LTDA')
      result.current.setField('fantasyName', 'Acme')
      result.current.setField('email', 'c@acme.dev')
      result.current.setField('cnpj', '12.345.678/0001-90')
      result.current.setField('serviceCategory', 'Limpeza')
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { cnpj: string; bankAccount: unknown; pixKey: unknown }
    expect(values.cnpj).toBe('12345678000190')
    expect(values.bankAccount).toBeNull()
    expect(values.pixKey).toBeNull()
  })

  it('grupo bancário parcialmente preenchido (sem checkbox) bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('name', 'Acme')
      result.current.setField('corporateName', 'Acme LTDA')
      result.current.setField('fantasyName', 'Acme')
      result.current.setField('email', 'c@acme.dev')
      result.current.setField('cnpj', '12345678000190')
      result.current.setField('serviceCategory', 'Limpeza')
      result.current.setField('bank', '341') // só o banco → grupo bancário incompleto
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  // ── Banco: o campo virou CÓDIGO de compensação (era texto livre). Ao ABRIR um cadastro antigo, o
  // controller converte o que dá para reconhecer sem ambiguidade e PRESERVA o resto — nunca apaga.
  const withBank = (bank: string): SupplierFormValues => ({
    name: 'Acme',
    corporateName: 'Acme LTDA',
    fantasyName: 'Acme',
    email: 'c@acme.dev',
    cnpj: '12345678000190',
    serviceCategory: 'Limpeza',
    bankAccount: { bank, agency: '12345', accountNumber: '9876', checkDigit: '1' },
    pixKey: null,
    serviceRating: null,
    ratingComment: null,
  })

  it('cadastro legado: "0237" abre já normalizado para o código "237"', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('0237'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('237')
  })

  it('cadastro legado: "341 - Itaú" abre já normalizado para "341"', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('341 - Itaú'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('341')
  })

  it('cadastro legado irreconhecível é PRESERVADO, não apagado', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('Bradesco'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('Bradesco')
  })
})
