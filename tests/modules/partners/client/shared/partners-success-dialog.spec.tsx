/**
 * PartnersSuccessDialog (Vitest/jsdom) — modal informativo de 1 botão usado no sucesso do
 * pré-cadastro de Colaborador. View burra: recebe `open`/`onConfirm` por props.
 *  - aberto: renderiza título + mensagem; "Entendi" dispara onConfirm;
 *  - fechado: não exibe o conteúdo.
 *
 * Usa <dialog> + showModal()/close(), que o jsdom não implementa — polyfill local mínimo
 * (no-ops que refletem `.open`), o suficiente para o useEffect montar sem lançar.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { PartnersSuccessDialog } from '#modules/partners/client/shared/partners-success-dialog.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

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

const noop = (): void => undefined

describe('PartnersSuccessDialog — modal de sucesso do pré-cadastro', () => {
  it('aberto: renderiza título e mensagem de sucesso', () => {
    render(
      <PartnersSuccessDialog
        open
        title={tr('partners.collaborators.create.success.title')}
        message={tr('partners.collaborators.create.success.body')}
        okLabel={tr('partners.collaborators.create.success.ok')}
        onConfirm={noop}
      />,
    )
    expect(screen.getByText(tr('partners.collaborators.create.success.title'))).toBeTruthy()
    expect(screen.getByText(tr('partners.collaborators.create.success.body'))).toBeTruthy()
  })

  it('"Entendi" dispara onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <PartnersSuccessDialog
        open
        title={tr('partners.collaborators.create.success.title')}
        message={tr('partners.collaborators.create.success.body')}
        okLabel={tr('partners.collaborators.create.success.ok')}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: tr('partners.collaborators.create.success.ok') }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('fechado: o <dialog> não está aberto', () => {
    render(
      <PartnersSuccessDialog
        open={false}
        title={tr('partners.collaborators.create.success.title')}
        message={tr('partners.collaborators.create.success.body')}
        okLabel={tr('partners.collaborators.create.success.ok')}
        onConfirm={noop}
      />,
    )
    const dialog = document.querySelector('dialog')
    expect(dialog?.open ?? false).toBe(false)
  })
})
