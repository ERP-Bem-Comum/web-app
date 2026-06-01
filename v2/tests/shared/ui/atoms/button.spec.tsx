import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { Button } from '#shared/ui/atoms/button/button.component.tsx'

afterEach(() => {
  cleanup()
})

describe('Button', () => {
  it('renderiza o conteúdo (children) como botão', () => {
    render(<Button>Entrar</Button>)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy()
  })

  it('type default é "button"', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('dispara onClick quando habilitado', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Ok</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled: atributo disabled e NÃO dispara onClick', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Ok
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading: atributo disabled, NÃO dispara onClick e mantém o texto (children)', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Entrar
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Entrar' })
    expect(btn.hasAttribute('disabled')).toBe(true)
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
