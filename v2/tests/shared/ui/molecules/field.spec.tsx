import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { Field } from '#shared/ui/molecules/field/field.component.tsx'

afterEach(() => {
  cleanup()
})

describe('Field', () => {
  it('associa o label ao controle via htmlFor (getByLabelText)', () => {
    render(
      <Field htmlFor="email" label="E-mail">
        <input id="email" />
      </Field>,
    )
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
  })

  it('renderiza o children (o controle)', () => {
    render(
      <Field htmlFor="x" label="X">
        <input id="x" placeholder="digite" />
      </Field>,
    )
    expect(screen.getByPlaceholderText('digite')).toBeTruthy()
  })

  it('com error → mensagem com role="alert" e o texto do erro', () => {
    render(
      <Field htmlFor="x" label="X" error="obrigatório">
        <input id="x" />
      </Field>,
    )
    expect(screen.getByRole('alert').textContent).toBe('obrigatório')
  })

  it('sem error → não renderiza alerta', () => {
    render(
      <Field htmlFor="x" label="X">
        <input id="x" />
      </Field>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
