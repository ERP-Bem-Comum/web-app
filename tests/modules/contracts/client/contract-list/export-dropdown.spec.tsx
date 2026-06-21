/**
 * ExportDropdown (Vitest/jsdom) — view burra: CSV chama onExportCsv; estado "exportando" desabilita e
 * troca o rótulo; errorTag exibe a tag traduzida. PDF usa window.print.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ExportDropdown } from '#modules/contracts/client/contract-list/components/export-dropdown.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

afterEach(() => {
  cleanup()
})

describe('ExportDropdown', () => {
  it('clicar em CSV dispara onExportCsv', () => {
    const onExportCsv = vi.fn()
    render(<ExportDropdown onExportCsv={onExportCsv} exporting={false} errorTag={null} />)
    fireEvent.click(screen.getByRole('button', { name: /CSV/ }))
    expect(onExportCsv).toHaveBeenCalledTimes(1)
  })

  it('exportando: rótulo vira "Exportando…" e botão fica desabilitado', () => {
    render(<ExportDropdown onExportCsv={vi.fn()} exporting errorTag={null} />)
    const btn = screen.getByRole('button', { name: ptBR['contracts.list.exporting'] }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('errorTag exibe a mensagem traduzida', () => {
    render(<ExportDropdown onExportCsv={vi.fn()} exporting={false} errorTag="contracts.list.exportError" />)
    expect(screen.getByRole('alert').textContent).toBe(ptBR['contracts.list.exportError'])
  })
})
