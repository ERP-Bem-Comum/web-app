import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { Card } from '#shared/ui/atoms/card/card.component.tsx'

afterEach(() => {
  cleanup()
})

describe('Card', () => {
  it('renderiza os children', () => {
    render(<Card>conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toBeTruthy()
  })

  it('elemento default é <div>', () => {
    const { container } = render(<Card>x</Card>)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('as="section" renderiza <section>', () => {
    const { container } = render(<Card as="section">x</Card>)
    expect(container.firstChild?.nodeName).toBe('SECTION')
  })
})
