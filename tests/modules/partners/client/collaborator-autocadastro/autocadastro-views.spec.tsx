/**
 * Views BURRAS do Autocadastro (#040) — Vitest/jsdom. Renderiza as views isoladas (sem provider
 * router/query, como os specs de auth) com as strings do CATÁLOGO REAL. Cobre:
 * - AutocadastroForm: cabeçalho "Olá, {name}!" + CPF mascarado; gate do botão por canSubmit; alerta de
 *   erro (400 cpf-mismatch vs rede) em role="alert".
 * - AutocadastroInvalid: 404/token ausente → mensagem de convite inválido, SEM form.
 * - AutocadastroSuccessModal: sucesso → "Cadastro concluído com sucesso!" (polyfill do <dialog>).
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  AutocadastroForm,
  type AutocadastroFormProps,
} from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-form.component.tsx'
import { AutocadastroInvalid } from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-invalid.component.tsx'
import { AutocadastroSuccessModal } from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-success.component.tsx'
import {
  emptyCompleteFieldsState,
  type CollaboratorCompleteFieldsState,
} from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import type { AutocadastroFormController } from '#modules/partners/client/collaborator-autocadastro/components/autocadastro-form.controller.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

// <dialog> + showModal()/close() não existem no jsdom — polyfill local (reflete `.open`). Mesmo padrão
// dos specs de reset-password/forgot-password.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement): void {
      this.open = true
    }
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement): void {
      this.open = false
    }
  }
})

afterEach(() => {
  cleanup()
})

// Usa o translator real (retorna string, nunca undefined) em vez de indexar o catálogo direto.
const t = createTranslator(ptBR)

// Controller falso (view burra não faz fetch/estado de negócio): estado estático + callbacks espionáveis.
const fakeController = (
  over: Partial<{ state: CollaboratorCompleteFieldsState; cpfPrefix: string }> = {},
): AutocadastroFormController => ({
  state: over.state ?? emptyCompleteFieldsState,
  cpfPrefix: over.cpfPrefix ?? '',
  setField: vi.fn(),
  setCpfPrefix: vi.fn(),
  buildSubmit: vi.fn<(token: string) => AutocadastroSubmitInput>(),
})

const formProps = (over: Partial<AutocadastroFormProps> = {}): AutocadastroFormProps => ({
  controller: fakeController(),
  name: 'Maria',
  cpfMasked: '***.***.789-**',
  canSubmit: false,
  submitting: false,
  errorMessage: null,
  onSubmit: vi.fn(),
  ...over,
})

describe('AutocadastroForm (view burra)', () => {
  it('mostra "Olá, {name}!" e o CPF mascarado', () => {
    render(<AutocadastroForm {...formProps({ name: 'Maria', cpfMasked: '***.***.789-**' })} />)
    expect(screen.getByRole('heading', { name: 'Olá, Maria!' })).toBeTruthy()
    expect(screen.getByText('***.***.789-**')).toBeTruthy()
  })

  it('renderiza o campo de confirmação dos primeiros dígitos do CPF', () => {
    render(<AutocadastroForm {...formProps()} />)
    expect(screen.getByLabelText(t('partners.autocadastro.field.cpfPrefix'))).toBeTruthy()
  })

  it('botão "Concluir cadastro" DESABILITADO quando canSubmit=false', () => {
    render(<AutocadastroForm {...formProps({ canSubmit: false })} />)
    const btn = screen.getByRole('button', { name: 'Concluir cadastro' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('botão HABILITADO e onSubmit disparado quando canSubmit=true', () => {
    const onSubmit = vi.fn()
    render(<AutocadastroForm {...formProps({ canSubmit: true, onSubmit })} />)
    const btn = screen.getByRole('button', { name: 'Concluir cadastro' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalled()
  })

  it('encaminha a digitação do cpfPrefix ao controller (setCpfPrefix)', () => {
    const controller = fakeController()
    render(<AutocadastroForm {...formProps({ controller })} />)
    fireEvent.change(screen.getByLabelText(t('partners.autocadastro.field.cpfPrefix')), {
      target: { value: '123' },
    })
    expect(controller.setCpfPrefix).toHaveBeenCalledWith('123')
  })

  it('erro 400 (cpf-mismatch) → mensagem própria em role="alert" (mantém o form)', () => {
    render(
      <AutocadastroForm {...formProps({ errorMessage: t('partners.error.autocadastro-cpf-mismatch') })} />,
    )
    // o form continua na tela (campo do CPF presente) + alerta com a mensagem específica
    expect(screen.getByLabelText(t('partners.autocadastro.field.cpfPrefix'))).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('CPF informado não confere')
  })

  it('erro de rede/servidor → mensagem genérica em role="alert"', () => {
    render(<AutocadastroForm {...formProps({ errorMessage: t('partners.error.server') })} />)
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

describe('AutocadastroInvalid (404 / token ausente → sem form)', () => {
  it('mostra a mensagem de convite inválido e NÃO renderiza o campo de CPF', () => {
    render(
      <AutocadastroInvalid
        title={t('partners.autocadastro.invalid.title')}
        message={t('partners.autocadastro.invalid.body')}
      />,
    )
    expect(screen.getByRole('heading', { name: t('partners.autocadastro.invalid.title') })).toBeTruthy()
    expect(screen.getByText(/Entre em contato com a ABC/i)).toBeTruthy()
    expect(screen.queryByLabelText(t('partners.autocadastro.field.cpfPrefix'))).toBeNull()
  })
})

describe('AutocadastroSuccessModal (sucesso 2xx, sem login)', () => {
  it('open=false → o <dialog> não está aberto', () => {
    render(
      <AutocadastroSuccessModal
        open={false}
        title={t('partners.autocadastro.success.title')}
        message={t('partners.autocadastro.success.body')}
        confirmLabel={t('partners.autocadastro.success.confirm')}
        onConfirm={vi.fn()}
      />,
    )
    const dialog = document.querySelector('dialog')
    expect(dialog?.open ?? false).toBe(false)
  })

  it('open=true → "Cadastro concluído com sucesso!" e confirmar dispara onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <AutocadastroSuccessModal
        open={true}
        title={t('partners.autocadastro.success.title')}
        message={t('partners.autocadastro.success.body')}
        confirmLabel={t('partners.autocadastro.success.confirm')}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText(/Cadastro concluído com sucesso/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: t('partners.autocadastro.success.confirm') }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
