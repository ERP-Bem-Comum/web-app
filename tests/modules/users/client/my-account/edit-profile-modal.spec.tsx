/**
 * EditProfileModal (Vitest/jsdom) — view burra do "Minha Conta → Editar Perfil".
 * Cobre o destrave do e-mail editável no autosserviço (USR-ME-PROFILE-FIELDS / PUT /me):
 *  - o campo E-mail vem preenchido e é EDITÁVEL; o CPF segue read-only (regressão na direção oposta);
 *  - "Salvar" desabilita com e-mail de formato inválido (regra `isLikelyEmail`);
 *  - editar o e-mail e Salvar dispara onSave com { name, email, telephone } (o novo e-mail).
 *
 * A modal usa <dialog> + showModal()/close(), que o jsdom não implementa — polyfill local mínimo
 * (no-ops que refletem `.open`), o suficiente para o useEffect montar sem lançar.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { EditProfileModal } from '#modules/users/client/my-account/components/edit-profile-modal.component.tsx'
import type { UserDetail } from '#modules/users/client/data/model/user.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

beforeAll(() => {
  // jsdom não implementa <dialog>.showModal/close — no-ops que apenas refletem `.open`.
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

const mockMe = (over: Partial<UserDetail> = {}): UserDetail => ({
  id: 'u-1',
  name: 'Ana Lima',
  email: 'ana@bemcomum.org',
  cpf: '12345678901',
  telephone: '11999990000',
  imageUrl: null,
  active: true,
  massApprovalPermission: false,
  ...over,
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  open: true,
  me: mockMe(),
  running: false,
  errorTag: null,
  onSave: vi.fn(),
  onClose: vi.fn(),
  ...over,
})

describe('EditProfileModal — e-mail editável no autosserviço', () => {
  it('renderiza o e-mail preenchido e EDITÁVEL; o CPF segue read-only', () => {
    render(<EditProfileModal {...baseProps()} />)

    const email = screen.getByLabelText(tr('users.form.email')) as HTMLInputElement
    expect(email.value).toBe('ana@bemcomum.org')
    expect(email.disabled).toBe(false)

    const cpf = screen.getByLabelText(tr('users.form.cpf')) as HTMLInputElement
    expect(cpf.disabled).toBe(true)
  })

  it('desabilita "Salvar" quando o e-mail tem formato inválido', () => {
    render(<EditProfileModal {...baseProps()} />)
    const save = screen.getByRole('button', { name: tr('users.detail.save') }) as HTMLButtonElement
    expect(save.disabled).toBe(false) // estado inicial é válido

    fireEvent.change(screen.getByLabelText(tr('users.form.email')), { target: { value: 'abc' } })
    expect(save.disabled).toBe(true)
  })

  it('dispara onSave com o novo e-mail (name + email + telephone)', () => {
    const onSave = vi.fn()
    render(<EditProfileModal {...baseProps({ onSave })} />)

    fireEvent.change(screen.getByLabelText(tr('users.form.email')), {
      target: { value: 'nova@bemcomum.org' },
    })
    fireEvent.click(screen.getByRole('button', { name: tr('users.detail.save') }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0]?.[0]).toEqual({
      name: 'Ana Lima',
      email: 'nova@bemcomum.org',
      telephone: '11999990000',
    })
  })
})
