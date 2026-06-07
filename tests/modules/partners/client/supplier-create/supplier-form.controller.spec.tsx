import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useSupplierFormController } from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'

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

  it('grupo bancário habilitado e incompleto bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('name', 'Acme')
      result.current.setField('corporateName', 'Acme LTDA')
      result.current.setField('fantasyName', 'Acme')
      result.current.setField('email', 'c@acme.dev')
      result.current.setField('cnpj', '12345678000190')
      result.current.setField('serviceCategory', 'Limpeza')
      result.current.setField('bankEnabled', true) // sem preencher os campos do grupo
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
