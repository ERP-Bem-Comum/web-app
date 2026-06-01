/**
 * Controller do form de login (Vitest/jsdom) — unitário: estado transiente + Zod local antes do submit.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useLoginFormController } from '#modules/auth/client/ui/login/components/forms/login-form.controller.ts'

describe('useLoginFormController', () => {
  it('submit com dados válidos entrega o input parseado', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useLoginFormController(onSubmit))

    act(() => {
      result.current.setEmail('a@b.com')
      result.current.setPassword('p')
      result.current.setRememberDevice(true)
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'p', rememberDevice: true })
  })

  it('submit com email inválido NÃO chama onSubmit (Zod local barra)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useLoginFormController(onSubmit))

    act(() => {
      result.current.setEmail('not-email')
      result.current.setPassword('p')
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
