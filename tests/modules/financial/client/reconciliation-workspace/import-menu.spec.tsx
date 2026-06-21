/**
 * ImportMenu (Vitest/jsdom) — view burra (US2): botão Importar (OFX/CSV), PDF anunciado (#145), resumo
 * pós-import e erro (tag i18n). Recebe tudo por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ImportMenu } from '#modules/financial/client/reconciliation-workspace/components/import-menu.component.tsx'
import type { BankStatementImport } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const summary: BankStatementImport = {
  statementId: 's1',
  imported: 10,
  duplicatesDiscarded: 2,
  period: { start: '2026-06-01', end: '2026-06-30' },
}

afterEach(() => {
  cleanup()
})

describe('ImportMenu', () => {
  it('clicar em Importar abre o dropdown com OFX/CSV (reais) e PDF desabilitado (#145)', () => {
    render(<ImportMenu importing={false} summary={null} errorTag={null} onPickFile={vi.fn()} />)
    // Fechado: as opções não aparecem.
    expect(screen.queryByRole('menuitem', { name: (n) => n.includes('OFX') })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.import')) }))
    expect(screen.getByRole('menuitem', { name: (n) => n.includes('OFX') })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: (n) => n.includes('CSV') })).toBeTruthy()
    const pdf = screen.getByRole('menuitem', { name: (n) => n.includes('PDF') }) as HTMLButtonElement
    expect(pdf.disabled).toBe(true)
  })

  it('exibe o resumo pós-import (importadas/duplicadas/período)', () => {
    render(<ImportMenu importing={false} summary={summary} errorTag={null} onPickFile={vi.fn()} />)
    expect(screen.getByText(/10 importadas/)).toBeTruthy()
    expect(screen.getByText(/2 duplicadas/)).toBeTruthy()
  })

  it('exibe o erro como tag i18n', () => {
    render(
      <ImportMenu
        importing={false}
        summary={null}
        errorTag="financial.recon.error.import-unsupported-format"
        onPickFile={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.error.import-unsupported-format'))).toBeTruthy()
  })

  it('desabilita o botão enquanto importa', () => {
    render(<ImportMenu importing summary={null} errorTag={null} onPickFile={vi.fn()} />)
    expect(
      screen
        .getByRole('button', { name: (n) => n.includes(tr('financial.recon.import')) })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})
