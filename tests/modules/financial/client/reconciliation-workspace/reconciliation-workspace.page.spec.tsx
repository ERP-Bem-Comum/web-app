/**
 * ReconciliationWorkspacePage (Vitest/jsdom) — shell do workspace: acc-header (chrome honesto #168), tabs
 * Extrato|Conciliação, toggle "Exibir palpites", Importar/Exportar/Fechar período desabilitados (US2/#173/
 * US7), estado vazio. Envolto em QueryClientProvider (a costura `getAccount` é pura → err('unavailable')).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ReconciliationWorkspacePage } from '#modules/financial/client/reconciliation-workspace/page/reconciliation-workspace.page.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k
// Matcher por substring (evita RegExp não-literal); o nome acessível pode incluir o ícone/switch.
const has = (k: string) => (name: string) => name.includes(tr(k))

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ReconciliationWorkspacePage accountRef="b1a7c0de-0000-4000-8000-000000000168" />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('ReconciliationWorkspacePage (shell)', () => {
  it('mostra a identidade da conta como chrome honesto (indisponível até #168)', () => {
    renderPage()
    expect(screen.getByText(tr('financial.recon.account.unavailable'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.account.metaPlaceholder'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.account.balanceLbl'))).toBeTruthy()
  })

  it('renderiza as abas Extrato e Conciliação (Conciliação ativa por padrão)', () => {
    renderPage()
    const conciliacao = screen.getByRole('tab', { name: tr('financial.recon.tab.conciliacao') })
    expect(conciliacao.getAttribute('aria-selected')).toBe('true')
    const extrato = screen.getByRole('tab', { name: tr('financial.recon.tab.extrato') })
    expect(extrato.getAttribute('aria-selected')).toBe('false')
  })

  it('trocar para a aba Extrato mostra o estado idle do extrato (sem extrato importado)', () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: tr('financial.recon.tab.extrato') }))
    expect(screen.getByText(tr('financial.recon.ext.idle'))).toBeTruthy()
  })

  it('toggle "Exibir palpites" alterna aria-pressed', () => {
    renderPage()
    const toggle = screen.getByRole('button', { name: has('financial.recon.guesses') })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('Importar (US2) habilitado; Exportar abre menu (#173); Fechar período (US7) desabilitado', () => {
    renderPage()
    expect(screen.getByRole('button', { name: has('financial.recon.import') }).hasAttribute('disabled')).toBe(
      false,
    )
    // Exportar é um dropdown: o gatilho abre o menu.
    const exportBtn = screen.getByRole('button', { name: has('financial.recon.bottombar.export') })
    fireEvent.click(exportBtn)
    // Sem período de conciliação (sem backend no teste), OFX/CSV ficam desabilitados com o motivo honesto;
    // PDF segue desabilitado (#145). Quando houver período, ligam (validado em tela).
    const ofx = screen.getByRole('menuitem', { name: has('financial.recon.export.ofx') })
    expect(ofx.hasAttribute('disabled')).toBe(true)
    expect(ofx.getAttribute('title')).toBe(tr('financial.recon.export.noPeriod'))
    expect(
      screen.getByRole('menuitem', { name: has('financial.recon.export.pdf') }).getAttribute('title'),
    ).toBe(tr('financial.recon.export.pdfUnavailable'))
    expect(
      screen.getByRole('button', { name: has('financial.recon.bottombar.close') }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('sem extrato importado, a lista mostra o estado idle honesto', () => {
    renderPage()
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText(tr('financial.recon.list.idle'))).toBeTruthy()
  })
})
