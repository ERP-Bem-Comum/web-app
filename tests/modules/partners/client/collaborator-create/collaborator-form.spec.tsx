import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { CollaboratorForm } from '#modules/partners/client/collaborator-create/components/collaborator-form.component.tsx'
import type { CollaboratorFormController } from '#modules/partners/client/collaborator-create/components/collaborator-form.controller.ts'

afterEach(() => {
  cleanup()
})

const stubController = (over: Partial<CollaboratorFormController> = {}): CollaboratorFormController => ({
  state: {
    name: '',
    email: '',
    cpf: '',
    occupationArea: '',
    role: '',
    startOfContract: '',
    employmentRelationship: '',
  },
  errors: {},
  setField: () => undefined,
  submit: () => undefined,
  ...over,
})

describe('CollaboratorForm', () => {
  it('renderiza os 7 campos do pré-cadastro', () => {
    render(<CollaboratorForm controller={stubController()} running={false} errorTag={null} onCancel={() => undefined} />)
    expect(screen.getByLabelText('Representante Legal')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('CPF')).toBeTruthy()
    expect(screen.getByLabelText('Função')).toBeTruthy()
    expect(screen.getByLabelText('Área de Atuação')).toBeTruthy()
    expect(screen.getByLabelText('Vínculo Empregatício')).toBeTruthy()
    expect(screen.getByLabelText('Início de Contrato')).toBeTruthy()
  })

  it('selects de área e vínculo trazem as opções dos enums', () => {
    render(<CollaboratorForm controller={stubController()} running={false} errorTag={null} onCancel={() => undefined} />)
    // Área: PARC/DDI/DCE/EPV (+ placeholder) ; Vínculo: CLT/PJ (+ placeholder)
    expect(screen.getByRole('option', { name: 'Parcerias' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'CLT' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'PJ' })).toBeTruthy()
  })

  it('dispara controller.submit ao enviar o formulário', () => {
    const submit = vi.fn()
    render(<CollaboratorForm controller={stubController({ submit })} running={false} errorTag={null} onCancel={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('exibe o banner de erro quando errorTag é passado', () => {
    render(<CollaboratorForm controller={stubController()} running={false} errorTag={'partners.error.server'} onCancel={() => undefined} />)
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
