/**
 * PdfCanvasPreview (Vitest/jsdom) — view BURRA do preview de PDF em canvas. jsdom não tem canvas 2D nem
 * Web Worker, então o binding `usePdfCanvas` (que roda o pdf.js) é MOCKADO; aqui verificamos só a
 * apresentação: container `role="img"` + rótulo, estados loading/erro (com link de download) e a
 * PROPAGAÇÃO de url+zoom ao binding. O render real do canvas é coberto pelos helpers puros (node:test).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

const { mockUsePdfCanvas } = vi.hoisted(() => ({ mockUsePdfCanvas: vi.fn() }))
vi.mock('#shared/ui/organisms/pdf-preview/use-pdf-canvas.binding.ts', () => ({
  usePdfCanvas: mockUsePdfCanvas,
}))

import { PdfCanvasPreview } from '#shared/ui/organisms/pdf-preview/pdf-canvas-preview.component.tsx'

const labels = {
  label: 'Documento enviado',
  loadingLabel: 'Carregando…',
  errorLabel: 'Falhou',
  downloadLabel: 'Baixar',
}
const pdfFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'nota.pdf', {
  type: 'application/pdf',
})

afterEach(() => {
  cleanup()
  mockUsePdfCanvas.mockReset()
})

const withStatus = (status: string): void => {
  mockUsePdfCanvas.mockReturnValue({ containerRef: { current: null }, status })
}

describe('PdfCanvasPreview', () => {
  it('monta o container role="img" com o rótulo de acessibilidade', () => {
    withStatus('ready')
    render(<PdfCanvasPreview file={pdfFile} url="blob:pdf-1" zoom={100} {...labels} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')).toBe(labels.label)
  })

  it('status ready não mostra loading nem erro', () => {
    withStatus('ready')
    render(<PdfCanvasPreview file={pdfFile} url="blob:pdf-1" zoom={100} {...labels} />)
    expect(screen.queryByText(labels.loadingLabel)).toBeNull()
    expect(screen.queryByText(labels.errorLabel)).toBeNull()
  })

  it('status loading mostra a nota de carregamento', () => {
    withStatus('loading')
    render(<PdfCanvasPreview file={pdfFile} url="blob:pdf-1" zoom={100} {...labels} />)
    expect(screen.getByText(labels.loadingLabel)).toBeTruthy()
  })

  it('status error mostra a nota honesta + link de download do blob', () => {
    withStatus('error')
    render(<PdfCanvasPreview file={pdfFile} url="blob:pdf-1" zoom={100} {...labels} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(labels.errorLabel)).toBeTruthy()
    const link = screen.getByText(labels.downloadLabel)
    expect(link.getAttribute('href')).toBe('blob:pdf-1')
    expect(link.hasAttribute('download')).toBe(true)
  })

  it('no erro sem url não oferece link de download', () => {
    withStatus('error')
    render(<PdfCanvasPreview file={pdfFile} url={null} zoom={100} {...labels} />)
    expect(screen.queryByText(labels.downloadLabel)).toBeNull()
  })

  it('propaga o arquivo e o zoom ao binding', () => {
    withStatus('ready')
    render(<PdfCanvasPreview file={pdfFile} url="blob:pdf-9" zoom={150} {...labels} />)
    expect(mockUsePdfCanvas).toHaveBeenCalledWith(pdfFile, 150)
  })
})
