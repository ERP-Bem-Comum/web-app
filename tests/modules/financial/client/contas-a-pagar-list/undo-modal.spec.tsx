/**
 * Spec 119 — UndoModal (view burra) e ReopenWarningModal — vitest/jsdom.
 *  - o modal lista os títulos (com a data de pagamento na baixa) e só habilita com motivo;
 *  - o alerta do "Voltar para edição" mostra o risco e os documentos.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { UndoModal } from '#modules/financial/client/contas-a-pagar-list/components/undo-modal.component.tsx'
import { ReopenWarningModal } from '#modules/financial/client/contas-a-pagar-list/components/reopen-warning-modal.component.tsx'
import type { UndoTarget } from '#modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const target: UndoTarget = {
  documentId: 'd1',
  payableId: 'p1',
  version: 1,
  documentNumber: 'NF 0847',
  supplier: 'Fornecedor X',
  pagamento: '10/09/2026',
}

const renderModal = (reason: string, kind: 'payment' = 'payment') => {
  const onApply = vi.fn()
  render(
    <UndoModal
      kind={kind}
      targets={[target]}
      reason={reason}
      running={false}
      onReasonChange={vi.fn()}
      onApply={onApply}
      onCancel={vi.fn()}
    />,
  )
  const apply = screen.getByRole('button', { name: tr(`financial.list.undo.${kind}.apply`) })
  return { apply, onApply }
}

describe('UndoModal (spec 119)', () => {
  it('fechado (kind null) → não renderiza nada', () => {
    const { container } = render(
      <UndoModal
        kind={null}
        targets={[target]}
        reason=""
        running={false}
        onReasonChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('desfazer baixa lista o título com a data de pagamento', () => {
    renderModal('')
    expect(screen.getByText('NF 0847 · Fornecedor X · pago em 10/09/2026')).toBeTruthy()
  })

  it('motivo vazio ou só espaços → botão desativado', () => {
    expect((renderModal('').apply as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    expect((renderModal('   ').apply as HTMLButtonElement).disabled).toBe(true)
  })

  it('com motivo → habilita e aplica', () => {
    const { apply, onApply } = renderModal('Data digitada errada')
    expect((apply as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(apply)
    expect(onApply).toHaveBeenCalledOnce()
  })
})

describe('ReopenWarningModal (spec 119)', () => {
  it('mostra o risco e os documentos; confirma', () => {
    const onConfirm = vi.fn()
    render(
      <ReopenWarningModal
        targets={[{ id: 'd1', version: 1, documentNumber: 'NF 0847' }]}
        running={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.list.reopenWarning.risk'))).toBeTruthy()
    expect(screen.getByText('NF 0847')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: tr('financial.list.reopenWarning.confirm') }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('sem documentos pendentes (null) → fechado', () => {
    const { container } = render(
      <ReopenWarningModal targets={null} running={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(container.innerHTML).toBe('')
  })
})
