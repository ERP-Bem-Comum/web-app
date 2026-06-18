/**
 * DocumentPreview (Vitest/jsdom) — drop-zone do OCR (view burra). Cobre: seleção de arquivo dispara
 * onSelectFile; o estado `unavailable` mostra a nota honesta (backend de OCR ausente, core-api#62).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DocumentPreview } from '#modules/financial/client/document-create/components/document-preview.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

describe('DocumentPreview (OCR)', () => {
  it('selecionar um arquivo dispara onSelectFile', () => {
    const onSelectFile = vi.fn()
    const { container } = render(
      <DocumentPreview status="idle" fileName={null} onSelectFile={onSelectFile} />,
    )
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    const file = new File(['x'], 'nota.pdf', { type: 'application/pdf' })
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } })
    expect(onSelectFile).toHaveBeenCalledTimes(1)
    expect(onSelectFile).toHaveBeenCalledWith(file)
  })

  it('status unavailable mostra a nota honesta (OCR em breve)', () => {
    render(<DocumentPreview status="unavailable" fileName="nota.pdf" onSelectFile={vi.fn()} />)
    expect(screen.getByText(tr('financial.create.preview.unavailable'))).toBeTruthy()
    // o nome do arquivo selecionado substitui a dica
    expect(screen.getByText('nota.pdf')).toBeTruthy()
  })

  it('status idle não mostra nota de estado', () => {
    render(<DocumentPreview status="idle" fileName={null} onSelectFile={vi.fn()} />)
    expect(screen.queryByText(tr('financial.create.preview.unavailable'))).toBeNull()
    expect(screen.queryByText(tr('financial.create.preview.reading'))).toBeNull()
  })
})
