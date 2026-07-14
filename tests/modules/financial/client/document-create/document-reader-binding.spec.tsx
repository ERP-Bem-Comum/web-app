/**
 * useDocumentReader (Vitest/jsdom) — binding client-only do leitor. O pdf.js é MOCKADO (jsdom não tem worker):
 * o mock devolve itens de texto sintéticos de uma DANFSe v1. Cobre o caminho XML (parse direto) e o caminho PDF
 * (camada de texto → gabarito), além de `file === null` → idle. Fixtures SINTÉTICAS (LGPD).
 */
/* eslint-disable no-secrets/no-secrets -- fixture XML SINTÉTICA (LGPD): CNPJ 11222333000181 e nome fictício, sem segredo real */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'

// Itens de texto de uma DANFSe v1 mínima (transform[4]=x, transform[5]=y).
const danfseItems = [
  { str: 'DANFSe v1.0', transform: [1, 0, 0, 1, 0, 1000], width: 10 },
  { str: 'Número da NFS-e', transform: [1, 0, 0, 1, 0, 980], width: 10 },
  { str: '42', transform: [1, 0, 0, 1, 0, 960], width: 10 },
]

const { getDocumentMock } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: () =>
        Promise.resolve({
          getTextContent: () => Promise.resolve({ items: danfseItems }),
        }),
    }),
    destroy: () => undefined,
  })),
}))

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: getDocumentMock,
}))

import { useDocumentReader } from '#modules/financial/client/document-create/reader/document-reader.binding.ts'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useDocumentReader', () => {
  it('file === null → status idle, sem leitura', () => {
    const { result } = renderHook(() => useDocumentReader(null))
    expect(result.current.status).toBe('idle')
    expect(result.current.reading).toBeNull()
  })

  it('XML: parseia o leiaute e devolve o DocumentReading', async () => {
    const xml =
      '<Nfse><InfNfse><Numero>1001</Numero><CodigoVerificacao>XYZ9</CodigoVerificacao>' +
      '<Valores><ValorServicos>2500.00</ValorServicos></Valores>' +
      '<PrestadorServico><RazaoSocial>Prestador ABRASF ME</RazaoSocial><Cnpj>11222333000181</Cnpj></PrestadorServico>' +
      '</InfNfse></Nfse>'
    const file = new File([xml], 'nota.xml', { type: 'text/xml' })
    const { result } = renderHook(() => useDocumentReader(file))
    await waitFor(() => {
      expect(result.current.status).toBe('done')
    })
    expect(result.current.reading?.number).toBe('1001')
    expect(result.current.reading?.grossValue).toBe(2500)
  })

  it('PDF: lê a camada de texto (pdf.js mockado) e detecta o gabarito DANFSe', async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'nota.pdf', { type: 'application/pdf' })
    const { result } = renderHook(() => useDocumentReader(file))
    await waitFor(() => {
      expect(result.current.status).toBe('done')
    })
    expect(getDocumentMock).toHaveBeenCalled()
    expect(result.current.reading?.kind).toBe('NFS-e')
    expect(result.current.reading?.number).toBe('42')
  })
})
