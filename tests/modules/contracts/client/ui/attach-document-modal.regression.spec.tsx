/**
 * REGRESSÃO — code-review (TICKET-001): achado A4 (a11y dos modais de contrato).
 *
 * ⚠️ FALHA DE PROPÓSITO até a correção. Ticket:
 * handbook/reviews/TICKET-001-contracts-detail-and-partners-correcoes.md
 *
 * Os modais (attach/amendment/preview) usam `<div role="dialog">` + clique no overlay: NÃO fecham com
 * ESC, não têm focus-trap nem foco inicial. O padrão correto (já no repo) é o ConfirmDialog, que usa
 * `<dialog>` nativo + showModal() — entrega ESC, focus-trap, inert e restauração de foco de graça.
 *
 * Validamos a CORREÇÃO de forma robusta no jsdom (que não simula o ESC nativo do <dialog>):
 *  1. o modal renderiza um elemento <dialog> nativo (a migração que dá ESC/trap);
 *  2. o dialog tem aria-labelledby apontando para o título.
 * O mesmo padrão deve ser aplicado a amendment-modal e document-preview-modal.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

import { AttachDocumentModal } from '#modules/contracts/client/contract-attach-document/components/attach-document-modal.component.tsx'
import { mockContract } from '../../fixtures/contract.fixture.ts'

afterEach(() => {
  cleanup()
})

const noop = (): void => undefined

describe('A4 — AttachDocumentModal usa <dialog> nativo + aria-labelledby', () => {
  it('a4-modal-dialog-nativo: renderiza um <dialog> (ESC/focus-trap/inert de graça)', () => {
    const { container } = render(
      <AttachDocumentModal open contract={mockContract()} onClose={noop} onSubmit={noop} submitting={false} errorTag={null} />,
    )
    expect(
      container.querySelector('dialog'),
      'Migre o modal para <dialog>+showModal() (padrão do ConfirmDialog) — entrega ESC e focus-trap (A4).',
    ).not.toBeNull()
  })

  it('a4-modal-aria-labelledby: o dialog associa o título via aria-labelledby', () => {
    const { container } = render(
      <AttachDocumentModal open contract={mockContract()} onClose={noop} onSubmit={noop} submitting={false} errorTag={null} />,
    )
    const dialogEl = container.querySelector('dialog, [role="dialog"]')
    expect(dialogEl?.getAttribute('aria-labelledby'), 'Associe o título ao dialog via aria-labelledby (A4).').toBeTruthy()
  })
})
