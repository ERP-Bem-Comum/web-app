import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { Checkbox } from '#shared/ui/atoms/checkbox/checkbox.component.tsx'

afterEach(() => {
  cleanup()
})

const box = (): HTMLInputElement => screen.getByRole('checkbox') as HTMLInputElement

describe('Checkbox', () => {
  it('reflete checked=true', () => {
    render(<Checkbox id="t" checked onChange={vi.fn()} />)
    expect(box().checked).toBe(true)
  })

  it('reflete checked=false', () => {
    render(<Checkbox id="t" checked={false} onChange={vi.fn()} />)
    expect(box().checked).toBe(false)
  })

  it('onChange recebe e.target.checked (boolean), não o evento', () => {
    const onChange = vi.fn()
    render(<Checkbox id="t" checked={false} onChange={onChange} />)
    fireEvent.click(box())
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('respeita disabled: atributo disabled e não dispara onChange', () => {
    const onChange = vi.fn()
    render(<Checkbox id="t" checked={false} onChange={onChange} disabled />)
    expect(box().hasAttribute('disabled')).toBe(true)
    fireEvent.click(box())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('aplica o id (associável a um <label htmlFor>)', () => {
    render(<Checkbox id="aceito" checked={false} onChange={vi.fn()} />)
    expect(box().getAttribute('id')).toBe('aceito')
  })
})
