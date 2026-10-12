/**
 * Spec 122 — "Identidade de Gênero" substitui o antigo "Sexo (F/M)" (vitest/jsdom), no Cadastro
 * Completo do detalhe e no Autocadastro:
 *  - o seletor traz as 7 opções do cliente, na ordem e na redação dele;
 *  - TRAVESTI fica fora do seletor (decisão da P.O., 12/10) e "Sexo" sai da tela;
 *  - escolher uma opção vai para `genderIdentity` no complete-registration.
 */
import { useEffect, type ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import {
  useCollaboratorDetailFormController,
  type CollaboratorDetailFormController,
} from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import {
  AutocadastroForm,
  type AutocadastroFormProps,
} from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-form.component.tsx'
import type { AutocadastroFormController } from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-form.controller.ts'
import { emptyCompleteFieldsState } from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

afterEach(() => {
  cleanup()
})

// Redação e ordem do cliente (P.O., 09/08 e 12/10). O "______" de "Outra" depende do core-api#1054.
const CLIENT_OPTIONS = [
  'Mulher cisgênero',
  'Homem cisgênero',
  'Mulher transgênero',
  'Homem transgênero',
  'Pessoa não binária',
  'Outra identidade de gênero',
  'Prefiro não responder',
]

const optionLabels = (select: HTMLSelectElement): string[] =>
  Array.from(select.options)
    .filter((o) => o.value !== '')
    .map((o) => o.textContent)

const detail: CollaboratorDetail = {
  id: 'c-1',
  name: 'Fulana',
  email: 'f@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  registration: 'pre-registration',
  activation: 'active',
  contractCount: 0,
  cpf: '52998224725',
  startOfContract: '2024-01-01T00:00:00.000Z',
  employmentRelationship: 'CLT',
  territory: null,
  bankAccount: null,
  pixKey: null,
}

const sink: { current: CollaboratorDetailFormController | null } = { current: null }

function DetailHarness(): ReactNode {
  const controller = useCollaboratorDetailFormController(detail)
  useEffect(() => {
    sink.current = controller
  })
  return <CollaboratorDetailContent controller={controller} editing showComplete preTitle="" />
}

describe('Cadastro completo (detalhe) — Identidade de Gênero (spec 122)', () => {
  it('mostra o seletor com as 7 opções do cliente, sem Travesti', () => {
    render(<DetailHarness />)
    const select = screen.getByLabelText('Identidade de Gênero', { selector: 'select' }) as HTMLSelectElement
    expect(optionLabels(select)).toEqual(CLIENT_OPTIONS)
    expect(optionLabels(select)).not.toContain('Travesti')
  })

  it('"Sexo" (Feminino/Masculino) saiu da tela', () => {
    render(<DetailHarness />)
    expect(screen.queryByLabelText('Sexo')).toBeNull()
    expect(screen.queryByRole('option', { name: 'Feminino' })).toBeNull()
  })

  it('a escolha vai para genderIdentity no complete-registration', () => {
    render(<DetailHarness />)
    const select = screen.getByLabelText('Identidade de Gênero', { selector: 'select' })
    fireEvent.change(select, { target: { value: 'NAO_BINARIO' } })
    expect(sink.current?.buildComplete('c-1').genderIdentity).toBe('NAO_BINARIO')
  })
})

const fakeController = (): AutocadastroFormController => ({
  state: emptyCompleteFieldsState,
  cpfPrefix: '',
  setField: vi.fn(),
  setCpfPrefix: vi.fn(),
  buildSubmit: vi.fn<(token: string) => AutocadastroSubmitInput>(),
})

const formProps = (controller: AutocadastroFormController): AutocadastroFormProps => ({
  controller,
  name: 'Maria',
  cpfMasked: '***.***.789-**',
  canSubmit: false,
  submitting: false,
  errorMessage: null,
  onSubmit: vi.fn(),
})

describe('Autocadastro — Identidade de Gênero (spec 122)', () => {
  it('mostra o seletor com as 7 opções do cliente, sem Travesti nem "Sexo"', () => {
    render(<AutocadastroForm {...formProps(fakeController())} />)
    const select = document.getElementById('ac-genderIdentity') as HTMLSelectElement
    expect(select).not.toBeNull()
    expect(optionLabels(select)).toEqual(CLIENT_OPTIONS)
    expect(document.getElementById('ac-sex')).toBeNull()
  })

  it('a escolha chega ao controller como genderIdentity', () => {
    const controller = fakeController()
    render(<AutocadastroForm {...formProps(controller)} />)
    fireEvent.change(document.getElementById('ac-genderIdentity') as HTMLSelectElement, {
      target: { value: 'MULHER_TRANS' },
    })
    expect(controller.setField).toHaveBeenCalledWith('genderIdentity', 'MULHER_TRANS')
  })
})
