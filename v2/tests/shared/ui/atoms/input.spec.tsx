import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'

import { Input } from '#shared/ui/atoms/input/input.component.tsx'

afterEach(() => {
  cleanup()
})

// password não tem role acessível ('textbox' só vale p/ text/email) → query estável por elemento.
const getInput = (container: HTMLElement): HTMLInputElement => {
  const el = container.querySelector('input')
  if (el === null) throw new Error('input não encontrado')
  return el
}

describe('Input', () => {
  it('exibe o value recebido', () => {
    const { container } = render(<Input id="email" value="ana@bem.dev" onChange={vi.fn()} />)
    expect(getInput(container).value).toBe('ana@bem.dev')
  })

  it('onChange recebe o valor digitado (string), não o evento', () => {
    const onChange = vi.fn()
    const { container } = render(<Input id="email" value="" onChange={onChange} />)
    fireEvent.change(getInput(container), { target: { value: 'novo' } })
    expect(onChange).toHaveBeenCalledWith('novo')
  })

  it('type default é "text"', () => {
    const { container } = render(<Input id="x" value="" onChange={vi.fn()} />)
    expect(getInput(container).getAttribute('type')).toBe('text')
  })

  it('aceita type "email" e "password"', () => {
    const email = render(<Input id="e" type="email" value="" onChange={vi.fn()} />)
    expect(getInput(email.container).getAttribute('type')).toBe('email')
    const pwd = render(<Input id="p" type="password" value="" onChange={vi.fn()} />)
    expect(getInput(pwd.container).getAttribute('type')).toBe('password')
  })

  it('aplica o id (associável a um <label htmlFor> pela Field)', () => {
    const { container } = render(<Input id="cpf" value="" onChange={vi.fn()} />)
    expect(getInput(container).getAttribute('id')).toBe('cpf')
  })

  it('invalid: expõe aria-invalid="true" (gancho a11y do estado visual de erro)', () => {
    const { container } = render(<Input id="x" value="" onChange={vi.fn()} invalid />)
    expect(getInput(container).getAttribute('aria-invalid')).toBe('true')
  })

  it('sem invalid: não marca aria-invalid', () => {
    const { container } = render(<Input id="x" value="" onChange={vi.fn()} />)
    expect(getInput(container).getAttribute('aria-invalid')).toBeNull()
  })
})
