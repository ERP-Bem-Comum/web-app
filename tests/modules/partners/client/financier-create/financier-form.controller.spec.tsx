import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useFinancierFormController } from '#modules/partners/client/financier-create/components/financier-form.controller.ts'

const fill = (result: { current: ReturnType<typeof useFinancierFormController> }): void => {
  act(() => {
    result.current.setField('name', 'Fundo XPTO')
    result.current.setField('corporateName', 'Fundo XPTO LTDA')
    result.current.setField('legalRepresentative', 'Maria Silva')
    result.current.setField('cnpj', '12.345.678/0001-90')
    result.current.setField('telephone', '(11) 4000-0000')
    result.current.setField('address', 'Av. Paulista, 1000')
  })
}

describe('useFinancierFormController', () => {
  it('bloqueia submit inválido: não chama onSubmit e marca erros', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useFinancierFormController({ onSubmit }))

    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('submit válido: emite os 6 campos com CNPJ normalizado', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useFinancierFormController({ onSubmit }))

    fill(result)
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { cnpj: string; name: string }
    expect(values.cnpj).toBe('12345678000190')
    expect(values.name).toBe('Fundo XPTO')
  })

  it('campo obrigatório vazio bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useFinancierFormController({ onSubmit }))

    fill(result)
    act(() => {
      result.current.setField('address', '')
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.address).toBe(true)
  })
})
