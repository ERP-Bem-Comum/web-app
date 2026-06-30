import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useActFormController } from '#modules/partners/client/act-create/components/act-form.controller.ts'

type Controller = ReturnType<typeof useActFormController>

const fillBase = (result: { current: Controller }): void => {
  act(() => {
    result.current.setField('actNumber', 'ACT-2026-001')
    result.current.setField('name', 'Acordo X')
    result.current.setField('email', 'contato@org.dev')
    result.current.setField('cnpj', '11.222.333/0001-81')
    result.current.setField('corporateName', 'Instituição LTDA')
    result.current.setField('fantasyName', 'IP')
    result.current.setField('occupationArea', 'PARC')
    result.current.setField('legalRepresentative', 'João Diretor')
    result.current.setField('startDate', '2026-01-01')
    result.current.setField('endDate', '2026-12-31')
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

  it('submit válido sem repasse: emite o input com cnpj normalizado, área, datas e conta/PIX nulos', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fillBase(result)
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const v = onSubmit.mock.calls[0]?.[0] as {
      cnpj: string
      occupationArea: string
      startDate: string
      endDate: string
      hasFinancialTransfer: boolean
      bankAccount: unknown
      pixKey: unknown
    }
    expect(v.cnpj).toBe('11222333000181')
    expect(v.occupationArea).toBe('PARC')
    expect(v.startDate).toBe('2026-01-01')
    expect(v.endDate).toBe('2026-12-31')
    expect(v.hasFinancialTransfer).toBe(false)
    expect(v.bankAccount).toBeNull()
    expect(v.pixKey).toBeNull()
  })

  it('repasse ligado sem conta nem PIX bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fillBase(result)
    act(() => {
      result.current.setField('hasFinancialTransfer', true)
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.hasFinancialTransfer).toBe(true)
  })

  it('repasse ligado com PIX passa e emite pixKey', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fillBase(result)
    act(() => {
      result.current.setField('hasFinancialTransfer', true)
      result.current.setField('pixKeyType', 'email')
      result.current.setField('pixKey', 'pix@org.dev')
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const v = onSubmit.mock.calls[0]?.[0] as { pixKey: { keyType: string; key: string } | null }
    expect(v.pixKey).toEqual({ keyType: 'email', key: 'pix@org.dev' })
  })

  it('vigência fim <= início bloqueia o submit (endDate)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fillBase(result)
    act(() => {
      result.current.setField('endDate', '2026-01-01')
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.endDate).toBe(true)
  })

  it('enum de área não selecionado bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useActFormController({ onSubmit }))
    fillBase(result)
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
