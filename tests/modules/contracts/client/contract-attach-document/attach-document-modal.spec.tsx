/**
 * AttachDocumentModal (Vitest/jsdom) — view burra: exige PDF + data para habilitar o submit,
 * dispara onSubmit com (file, signedAt) e exibe a tag de erro.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AttachDocumentModal } from '#modules/contracts/client/contract-attach-document/components/attach-document-modal.component.tsx'
import { mockContract } from '../../fixtures/contract.fixture.ts'

afterEach(() => {
  cleanup()
})

const pdf = (): File => new File(['%PDF-1.4 teste'], 'contrato.pdf', { type: 'application/pdf' })
// Modo editável do modal = contrato Pendente sem documento.
const pendingContract = () => ({ ...mockContract(), status: 'Pendente' as const, files: [] })

const baseProps = (over: Record<string, unknown> = {}) => ({
  open: true,
  contract: pendingContract(),
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  submitting: false,
  errorTag: null,
  ...over,
})

describe('AttachDocumentModal', () => {
  it('não renderiza quando open=false', () => {
    const { container } = render(<AttachDocumentModal {...baseProps({ open: false })} />)
    expect(container.firstChild).toBe(null)
  })

  it('renderiza título quando open', () => {
    render(<AttachDocumentModal {...baseProps()} />)
    expect(screen.getByText('Incluir documento assinado')).toBeTruthy()
  })

  it('submit desabilitado sem arquivo/data; habilita com PDF + data', () => {
    const { container } = render(<AttachDocumentModal {...baseProps()} />)
    const submit = screen.getByRole('button', { name: 'Confirmar e efetivar' }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)

    const fileInput = container.querySelector('input[type="file"]')
    const dateInput = container.querySelector('input[type="date"]')
    expect(fileInput).not.toBe(null)
    expect(dateInput).not.toBe(null)

    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [pdf()] } })
    expect(submit.disabled).toBe(true) // ainda falta a data
    fireEvent.change(dateInput as HTMLInputElement, { target: { value: '2026-06-01' } })
    expect(submit.disabled).toBe(false)
  })

  it('dispara onSubmit com file + signedAt', () => {
    const onSubmit = vi.fn()
    const { container } = render(<AttachDocumentModal {...baseProps({ onSubmit })} />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]')
    if (fileInput === null || dateInput === null) throw new Error('inputs ausentes')
    fireEvent.change(fileInput, { target: { files: [pdf()] } })
    fireEvent.change(dateInput, { target: { value: '2026-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e efetivar' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const arg = onSubmit.mock.calls[0]?.[0] as { file: File; signedAt: string }
    expect(arg.signedAt).toBe('2026-06-01')
    expect(arg.file.name).toBe('contrato.pdf')
  })

  it('exibe a tag de erro traduzida', () => {
    render(<AttachDocumentModal {...baseProps({ errorTag: 'contracts.attach.error.invalid-pdf' })} />)
    expect(screen.getByRole('alert').textContent).toContain('PDF')
  })
})
