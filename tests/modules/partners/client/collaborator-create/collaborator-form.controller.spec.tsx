import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useCollaboratorFormController } from '#modules/partners/client/collaborator-create/components/collaborator-form.controller.ts'

const fill = (result: { current: ReturnType<typeof useCollaboratorFormController> }): void => {
  act(() => {
    result.current.setField('name', 'Maria Lima')
    result.current.setField('email', 'maria@org.dev')
    result.current.setField('cpf', '123.456.789-09')
    result.current.setField('occupationArea', 'PARC')
    result.current.setField('role', 'Coordenadora')
    result.current.setField('startOfContract', '2026-02-01')
    result.current.setField('employmentRelationship', 'CLT')
  })
}

describe('useCollaboratorFormController', () => {
  it('bloqueia submit inválido (vazio): não chama onSubmit e marca erros', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useCollaboratorFormController({ onSubmit }))
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('submit válido: emite os 7 campos com CPF normalizado e enums', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useCollaboratorFormController({ onSubmit }))
    fill(result)
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { cpf: string; occupationArea: string; employmentRelationship: string }
    expect(values.cpf).toBe('12345678909')
    expect(values.occupationArea).toBe('PARC')
    expect(values.employmentRelationship).toBe('CLT')
  })

  it('enum não selecionado bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useCollaboratorFormController({ onSubmit }))
    fill(result)
    act(() => {
      result.current.setField('employmentRelationship', '')
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.employmentRelationship).toBe(true)
  })

  it('e-mail inválido bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useCollaboratorFormController({ onSubmit }))
    fill(result)
    act(() => {
      result.current.setField('email', 'invalido')
    })
    act(() => {
      result.current.submit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.email).toBe(true)
  })
})
