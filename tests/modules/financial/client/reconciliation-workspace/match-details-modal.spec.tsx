/**
 * MatchDetailsModal (Vitest/jsdom) — modal "Detalhes da conciliação". Foco: conciliação 1 saída → N
 * títulos mostra a contagem, os valores por título e o total (antes só aparecia "—" sem indicar múltiplos).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { MatchDetailsModal } from '#modules/financial/client/reconciliation-workspace/components/match-details-modal.component.tsx'
import type { MatchDetailsView } from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const view = (over: Partial<MatchDetailsView> = {}): MatchDetailsView => ({
  isManualEntry: false,
  ext: {
    name: 'Fornecedor Persist A',
    date: '5 out 2026',
    kind: 'OTHER',
    id: 'PERSIST-001',
    valueBRL: 'R$ 742,00',
  },
  doc: { name: '—', documento: '—', vencimento: '—', categoria: '—', valueBRL: '—' },
  audit: { when: '21 jun 2026', who: 'c562bc57' },
  multi: null,
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('MatchDetailsModal — 1 saída → N títulos', () => {
  it('com multi: mostra contagem, valor por título e total conciliado', () => {
    render(
      <MatchDetailsModal
        open
        view={view({
          multi: {
            count: 3,
            lines: [{ valueBRL: 'R$ 300,00' }, { valueBRL: 'R$ 200,00' }, { valueBRL: 'R$ 242,00' }],
            totalBRL: 'R$ 742,00',
          },
        })}
        canUndo
        undoing={false}
        onUndo={vi.fn()}
        onViewTitle={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Rótulo "Títulos no sistema (3)" + cabeçalho "3 títulos conciliados"
    expect(screen.getByText(`${tr('financial.recon.match.titlesLbl')} (3)`)).toBeTruthy()
    expect(screen.getByText(`3 ${tr('financial.recon.match.titlesWord')}`)).toBeTruthy()
    // Total + ao menos um valor por título
    expect(screen.getByText(tr('financial.recon.match.totalConciliado'))).toBeTruthy()
    expect(screen.getAllByText('R$ 742,00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('R$ 300,00')).toBeTruthy()
  })

  it('sem multi (individual): mantém o bloco único "Título no sistema"', () => {
    render(
      <MatchDetailsModal
        open
        view={view()}
        canUndo
        undoing={false}
        onUndo={vi.fn()}
        onViewTitle={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.match.docLbl'))).toBeTruthy()
    expect(screen.queryByText(tr('financial.recon.match.totalConciliado'))).toBeNull()
  })
})
