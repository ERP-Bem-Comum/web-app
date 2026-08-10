/**
 * useOcrExtraction (Vitest/jsdom) — binding da ingestão por OCR. Cobre o FLUXO alvo (core-api#62):
 *   1. no sucesso, a server fn (via gateway mockado) cria um RASCUNHO e o binding NAVEGA p/ o modo edição
 *      (`/financeiro/contas-a-pagar/lancar?id=<documentId>`) — nunca cria um 2º documento;
 *   2. no erro real (mime/tamanho/servidor), expõe a tag i18n específica e NÃO navega.
 * Gateway e useNavigate são mockados (sem RPC/rota real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { extractDocumentOcr } from '#modules/financial/client/data/ocr.gateway.ts'
import { useOcrExtraction } from '#modules/financial/client/document-create/ocr.binding.ts'

const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('#modules/financial/client/data/ocr.gateway.ts', () => ({
  extractDocumentOcr: vi.fn(),
}))

const mockedIngest = vi.mocked(extractDocumentOcr)

function Harness(): ReactNode {
  const ocr = useOcrExtraction()
  const file = new File(['%PDF-1.4'], 'nota.pdf', { type: 'application/pdf' })
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          ocr.extract(file)
        }}
      >
        enviar
      </button>
      <span data-testid="status">{ocr.status}</span>
      {ocr.errorTag !== null ? <p role="alert">{ocr.errorTag}</p> : null}
    </div>
  )
}

const renderHarness = (): void => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useOcrExtraction (ingestão OCR)', () => {
  it('sucesso: navega p/ o modo edição do rascunho (?id) e NÃO cria 2º documento', async () => {
    mockedIngest.mockResolvedValue({
      ok: true,
      value: { documentId: 'draft-123', resolvedVia: 'xml' },
    })
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'enviar' }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/financeiro/contas-a-pagar/lancar',
        search: { id: 'draft-123' },
      })
    })
    expect(screen.getByTestId('status').textContent).toBe('done')
  })

  it('erro: expõe a tag i18n específica e NÃO navega', async () => {
    mockedIngest.mockResolvedValue({ ok: false, error: 'invalid-mime' })
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'enviar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('financial.create.ocr.error.invalidMime')
    })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('status').textContent).toBe('error')
  })
})
