import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { Logo } from '#shared/ui/atoms/logo/logo.component.tsx'

afterEach(() => {
  cleanup()
})

describe('Logo', () => {
  it('renderiza <img> com src e alt (a11y) recebidos', () => {
    render(<Logo src="/images/logo-bem-comum.png" alt="Bem Comum" />)
    const img = screen.getByRole('img', { name: 'Bem Comum' })
    expect(img.getAttribute('src')).toBe('/images/logo-bem-comum.png')
  })

  it('size default (48) aplicado em width e height', () => {
    render(<Logo src="/x.png" alt="X" />)
    const img = screen.getByRole('img', { name: 'X' })
    expect(img.getAttribute('width')).toBe('48')
    expect(img.getAttribute('height')).toBe('48')
  })

  it('size custom reflete em width e height', () => {
    render(<Logo src="/x.png" alt="X" size={72} />)
    const img = screen.getByRole('img', { name: 'X' })
    expect(img.getAttribute('width')).toBe('72')
    expect(img.getAttribute('height')).toBe('72')
  })
})
