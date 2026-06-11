/**
 * AmendmentModal (distrato #32) — gating do submit (F3) e payload do anexo.
 * Distrato exige descrição + data efetiva + documento + data de assinatura para concluir (encerrar).
 * Regressão: aditivo de VALOR segue submetendo sem documento (não-distrato inalterado).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'

import { AmendmentModal } from '#modules/contracts/client/amendment-create/components/amendment-modal.component.tsx'

afterEach(() => { cleanup() })

const pdf = (): File => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'distrato.pdf', { type: 'application/pdf' })

// Garante presença (noUncheckedIndexedAccess) — o teste falha claramente se o elemento sumir.
const must = <T,>(v: T | null | undefined): T => {
  if (v == null) throw new Error('elemento esperado não encontrado')
  return v
}

const setup = () => {
  const onCreate = vi.fn()
  render(
    <AmendmentModal
      open
      mode="create"
      contractNumber="CT 0001/2026"
      onClose={vi.fn()}
      onCreate={onCreate}
      onAttach={vi.fn()}
      submitting={false}
      errorTag={null}
    />,
  )
  const dialog = screen.getByRole('dialog')
  const submitBtn = (): HTMLButtonElement => within(dialog).getByRole('button', { name: /Salvar/ })
  // querySelectorAll devolve Element; o cast p/ HTMLInputElement é seguro (são <input>/<textarea>).
  const dateInput = (n: number): HTMLInputElement => must(dialog.querySelectorAll('input[type="date"]')[n]) as HTMLInputElement
  const fileInput = (): HTMLInputElement => must(dialog.querySelector('input[type="file"]')) as HTMLInputElement
  const textarea = (): HTMLTextAreaElement => must(dialog.querySelector('textarea')) as HTMLTextAreaElement
  const textInput = (): HTMLInputElement => must(dialog.querySelector('input[type="text"]')) as HTMLInputElement
  return { onCreate, dialog, submitBtn, dateInput, fileInput, textarea, textInput }
}

describe('AmendmentModal — distrato', () => {
  it('distrato sem documento/data efetiva → submit desabilitado (F3)', () => {
    const { dialog, submitBtn, textarea, dateInput } = setup()
    fireEvent.click(within(dialog).getByRole('button', { name: /Distrato/ }))
    expect(submitBtn().disabled).toBe(true)
    // só descrição + data efetiva, sem documento → ainda bloqueado (precisa do signed_termination)
    fireEvent.change(textarea(), { target: { value: 'Rescisão amigável' } })
    fireEvent.change(dateInput(0), { target: { value: '2026-06-01' } }) // Data do Distrato
    expect(submitBtn().disabled).toBe(true)
  })

  it('distrato completo → submit habilita e onCreate recebe attach com terminatedAt', () => {
    const { onCreate, dialog, submitBtn, textarea, dateInput, fileInput } = setup()
    fireEvent.click(within(dialog).getByRole('button', { name: /Distrato/ }))
    fireEvent.change(textarea(), { target: { value: 'Rescisão amigável' } })
    fireEvent.change(dateInput(0), { target: { value: '2026-06-01' } }) // Data do Distrato (terminatedAt)
    fireEvent.change(fileInput(), { target: { files: [pdf()] } })
    fireEvent.change(dateInput(1), { target: { value: '2026-05-30' } }) // Data da Assinatura (signedAt)
    expect(submitBtn().disabled).toBe(false)
    fireEvent.click(submitBtn())
    expect(onCreate).toHaveBeenCalledTimes(1)
    const call = must(onCreate.mock.calls[0])
    const input = call[0] as { type: string; description?: string }
    const attach = call[1] as { file: File; signedAt: string; terminatedAt: string }
    expect(input.type).toBe('distrato')
    expect(input.description).toBe('Rescisão amigável')
    expect(attach).toMatchObject({ signedAt: '2026-05-30', terminatedAt: '2026-06-01' })
    expect(attach.file).toBeInstanceOf(File)
  })

  it('regressão: aditivo de VALOR submete sem documento (não-distrato inalterado)', () => {
    const { onCreate, dialog, submitBtn, textarea, textInput } = setup()
    fireEvent.click(within(dialog).getByRole('button', { name: /Valor/ }))
    fireEvent.change(textarea(), { target: { value: 'Acréscimo de escopo' } })
    fireEvent.change(textInput(), { target: { value: '100000' } }) // campo de valor (moeda)
    expect(submitBtn().disabled).toBe(false)
    fireEvent.click(submitBtn())
    expect(onCreate).toHaveBeenCalledTimes(1)
    const call = must(onCreate.mock.calls[0])
    expect(call[1]).toBeUndefined() // sem documento → aditivo Pendente, sem efeito
  })
})
