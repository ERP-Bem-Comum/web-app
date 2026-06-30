/**
 * DocumentPreviewModal (Vitest/jsdom) — view burra da prévia: estados loading/erro/iframe.
 * Os bytes (blobUrl) são buscados pela ViewModel/binding (CTR-HTTP-DOCUMENT-CONTENT); aqui só
 * validamos a renderização por estado.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { DocumentPreviewModal } from '#modules/contracts/client/contract-detail/components/document-preview-modal.component.tsx'

afterEach(() => {
  cleanup()
})

const base = {
  open: true,
  name: 'Contrato CT 0001/2026',
  blobUrl: null as string | null,
  loading: false,
  errorTag: null as string | null,
  onClose: vi.fn(),
}

describe('DocumentPreviewModal', () => {
  it('não renderiza quando open=false', () => {
    const { container } = render(<DocumentPreviewModal {...base} open={false} />)
    expect(container.firstChild).toBe(null)
  })

  it('mostra carregando enquanto busca os bytes', () => {
    render(<DocumentPreviewModal {...base} loading />)
    expect(screen.getByText('Carregando…')).toBeTruthy()
  })

  it('mostra a mensagem de erro traduzida', () => {
    render(<DocumentPreviewModal {...base} errorTag="contracts.detail.document.error" />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Não foi possível carregar o documento.')).toBeTruthy()
  })

  it('renderiza o iframe com a blobUrl quando disponível', () => {
    const { container } = render(<DocumentPreviewModal {...base} blobUrl="blob:fake-url" />)
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('src')).toBe('blob:fake-url')
  })

  it('expõe o link de baixar quando há blobUrl', () => {
    render(<DocumentPreviewModal {...base} blobUrl="blob:fake-url" />)
    const link = screen.getByText('Download') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('blob:fake-url')
    expect(link.getAttribute('download')).toBe('Contrato CT 0001/2026')
  })
})
