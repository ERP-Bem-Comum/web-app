import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useActFormController } from '#modules/partners/client/act-create/components/act-form.controller.ts'

const fill = (result: { current: ReturnType<typeof useActFormController> }): void => {
  act(() => {
    result.current.setField('name', 'João Souza')
    result.current.setField('email', 'joao@org.dev')
    result.current.setField('cpf', '123.456.789-09')
    result.current.setField('occupationArea', 'PARC')
    result.current.setField('role', 'Analista')
    result.current.setField('startOfContract', '2026-01-15')
    result.current.setField('employmentRelationship', 'CLT')
  })
}

describe('useActFormController', () => {
  it('bloqueia submit inválido (vazio): não chama onSubmit e marca erros', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('submit válido: emite os 7 campos com CPF normalizado e enums', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fill(result)
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { cpf: string; occupationArea: string }
    expect(values.cpf).toBe('12345678909')
    expect(values.occupationArea).toBe('PARC')
  })

  it('enum não selecionado bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fill(result)
    act(() => {
      result.current.setField('occupationArea', '')
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.occupationArea).toBe(true)
  })
})
