/**
 * CancelContractModal (§1.7) — vitest/jsdom. A modal de cancelar contrato Pendente:
 *  - renderiza habilitada (botão Confirmar clicável quando não está `running`);
 *  - dispara `onConfirm` ao confirmar;
 *  - exibe a tag de erro (ex.: 409 contract-not-pending) quando fornecida;
 *  - não renderiza nada quando `open={false}`.
 *
 * A modal usa render condicional (`if (!open) return null`) + overlay — NÃO usa <dialog>/showModal,
 * então é estável no jsdom (sem a fragilidade que motivou diferir specs em fatias anteriores).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DeleteContractModal } from '#modules/contracts/client/contract-list/components/delete-contract-modal.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

// Helper: o catálogo é um Record (string | undefined no índice) — aqui as chaves existem.
const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const noop = (): void => undefined

describe('CancelContractModal — cancelar contrato Pendente', () => {
  it('renderiza o título de cancelamento e o botão Confirmar habilitado', () => {
    render(
      <DeleteContractModal open contractLabel="CT 001/2026" onClose={noop} onConfirm={noop} />,
    )
    expect(screen.getByText(tr('contracts.cancel.title'))).toBeTruthy()
    const confirm = screen.getByRole('button', { name: tr('contracts.cancel.confirm') })
    expect((confirm as HTMLButtonElement).disabled).toBe(false)
  })

  it('dispara onConfirm ao clicar em Confirmar', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteContractModal open contractLabel="CT 001/2026" onClose={noop} onConfirm={onConfirm} />,
    )
    fireEvent.click(screen.getByRole('button', { name: tr('contracts.cancel.confirm') }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('desabilita os botões enquanto running', () => {
    render(
      <DeleteContractModal open contractLabel="CT 001/2026" onClose={noop} onConfirm={noop} running />,
    )
    const confirm = screen.getByRole('button', { name: tr('contracts.cancel.confirm') })
    expect((confirm as HTMLButtonElement).disabled).toBe(true)
  })

  it('exibe a mensagem amigável do erro 409 (contract-not-pending)', () => {
    render(
      <DeleteContractModal
        open
        contractLabel="CT 001/2026"
        onClose={noop}
        onConfirm={noop}
        errorTag="contracts.error.contract-not-pending"
      />,
    )
    expect(screen.getByText(tr('contracts.error.contract-not-pending'))).toBeTruthy()
  })

  it('não renderiza quando fechada', () => {
    const { container } = render(
      <DeleteContractModal open={false} contractLabel="CT 001/2026" onClose={noop} onConfirm={noop} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
