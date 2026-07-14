/**
 * DocumentPreview (Vitest/jsdom) — view burra da coluna OCR. Duas faces:
 *  - SEM arquivo (`preview={null}`) = drop-zone: seleção dispara onSelectFile (PDF e XML); `done`/`error`/`idle`
 *    mostram (ou não) a nota; o accept aceita PDF/XML (core-api#62).
 *  - COM arquivo (`preview`) = web view: PDF vira <iframe blob:>, XML vira texto; a strip mostra o nome + nota.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DocumentPreview } from '#modules/financial/client/document-create/components/document-preview.component.tsx'
import type { DocumentPreviewData } from '#modules/financial/client/document-create/document-form.view.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

describe('DocumentPreview — drop-zone (sem arquivo)', () => {
  it('selecionar um PDF dispara onSelectFile', () => {
    const onSelectFile = vi.fn()
    const { container } = render(
      <DocumentPreview
        status="idle"
        fileName={null}
        errorTag={null}
        preview={null}
        allowReplace
        onSelectFile={onSelectFile}
      />,
    )
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    const file = new File(['x'], 'nota.pdf', { type: 'application/pdf' })
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } })
    expect(onSelectFile).toHaveBeenCalledTimes(1)
    expect(onSelectFile).toHaveBeenCalledWith(file)
  })

  it('selecionar um XML também dispara onSelectFile (aceito por MIME/extensão)', () => {
    const onSelectFile = vi.fn()
    const { container } = render(
      <DocumentPreview
        status="idle"
        fileName={null}
        errorTag={null}
        preview={null}
        allowReplace
        onSelectFile={onSelectFile}
      />,
    )
    const input = container.querySelector('input[type="file"]')
    const file = new File(['<xml/>'], 'nota.xml', { type: 'application/xml' })
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } })
    expect(onSelectFile).toHaveBeenCalledWith(file)
  })

  it('o accept da drop-zone contempla .pdf e .xml', () => {
    const { container } = render(
      <DocumentPreview
        status="idle"
        fileName={null}
        errorTag={null}
        preview={null}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    const input = container.querySelector('input[type="file"]')
    const accept = (input as HTMLInputElement).getAttribute('accept') ?? ''
    expect(accept.includes('.pdf')).toBe(true)
    expect(accept.includes('.xml')).toBe(true)
  })

  it('status error mostra a mensagem específica do errorTag', () => {
    render(
      <DocumentPreview
        status="error"
        fileName="nota.png"
        errorTag="financial.create.ocr.error.invalidMime"
        preview={null}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.create.ocr.error.invalidMime'))).toBeTruthy()
  })

  it('status idle não mostra nota de estado', () => {
    render(
      <DocumentPreview
        status="idle"
        fileName={null}
        errorTag={null}
        preview={null}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    expect(screen.queryByText(tr('financial.create.preview.done'))).toBeNull()
    expect(screen.queryByText(tr('financial.create.preview.reading'))).toBeNull()
  })
})

describe('DocumentPreview — web view (com arquivo)', () => {
  const pdf: DocumentPreviewData = { kind: 'pdf', url: 'blob:pdf-123', fileName: 'nota.pdf' }
  const xml: DocumentPreviewData = {
    kind: 'xml',
    text: '<nfse><numero>42</numero></nfse>',
    fileName: 'nota.xml',
  }

  it('PDF renderiza um <iframe> com a blob URL + fragmento de zoom (100% inicial)', () => {
    const { container } = render(
      <DocumentPreview
        status="done"
        fileName="nota.pdf"
        errorTag={null}
        preview={pdf}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    const frame = container.querySelector('iframe')
    expect(frame).toBeTruthy()
    // A blob URL esconde a barra + o painel de miniaturas (só conteúdo) e leva o `#zoom=`; começa 100%.
    expect(frame?.getAttribute('src')).toBe('blob:pdf-123#toolbar=0&navpanes=0&zoom=100')
  })

  it('zoom: + aumenta o #zoom do PDF; − diminui; respeita os limites (50–200%)', () => {
    const { container } = render(
      <DocumentPreview
        status="done"
        fileName="nota.pdf"
        errorTag={null}
        preview={pdf}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    const src = (): string => container.querySelector('iframe')?.getAttribute('src') ?? ''
    const zoomIn = screen.getByLabelText(tr('financial.create.preview.zoomIn'))
    const zoomOut = screen.getByLabelText(tr('financial.create.preview.zoomOut'))
    expect(src()).toBe('blob:pdf-123#toolbar=0&navpanes=0&zoom=100')
    fireEvent.click(zoomIn)
    expect(src()).toBe('blob:pdf-123#toolbar=0&navpanes=0&zoom=125')
    fireEvent.click(zoomOut)
    fireEvent.click(zoomOut)
    expect(src()).toBe('blob:pdf-123#toolbar=0&navpanes=0&zoom=75')
    // limite inferior: 75 → 50 e trava (não passa de 50)
    fireEvent.click(zoomOut)
    fireEvent.click(zoomOut)
    expect(src()).toBe('blob:pdf-123#toolbar=0&navpanes=0&zoom=50')
    expect((zoomOut as HTMLButtonElement).disabled).toBe(true)
  })

  it('zoom: no XML escala a fonte via --ocr-zoom (não usa #zoom)', () => {
    const { container } = render(
      <DocumentPreview
        status="done"
        fileName="nota.xml"
        errorTag={null}
        preview={xml}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    const pre = container.querySelector('pre')
    expect(pre?.style.getPropertyValue('--ocr-zoom')).toBe('1')
    fireEvent.click(screen.getByLabelText(tr('financial.create.preview.zoomIn')))
    expect(pre?.style.getPropertyValue('--ocr-zoom')).toBe('1.25')
  })

  it('XML renderiza o texto do documento (sem iframe)', () => {
    const { container } = render(
      <DocumentPreview
        status="done"
        fileName="nota.xml"
        errorTag={null}
        preview={xml}
        allowReplace
        onSelectFile={vi.fn()}
      />,
    )
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getByText(/<numero>42<\/numero>/)).toBeTruthy()
  })

  it('em modo consulta (allowReplace=false) não oferece "trocar arquivo"', () => {
    render(
      <DocumentPreview
        status="done"
        fileName="nota.pdf"
        errorTag={null}
        preview={pdf}
        allowReplace={false}
        onSelectFile={vi.fn()}
      />,
    )
    expect(screen.queryByText(tr('financial.create.preview.replace'))).toBeNull()
  })
})
