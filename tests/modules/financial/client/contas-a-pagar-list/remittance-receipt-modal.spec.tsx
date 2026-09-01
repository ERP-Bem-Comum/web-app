/**
 * O COMPROVANTE na tela (Vitest/jsdom) — view burra do modal de conferência da remessa.
 *
 * Este arquivo existe por um episódio, não por completude. Em 01/09/2026 o core-api#929 mudou a
 * resposta da geração de um arquivo para `{ files: [...] }`; o front seguia validando a forma antiga,
 * e a tela exibia "Algo deu errado" DEPOIS de o backend ter alocado o NSA e transmitido o título.
 * Três NSA queimados, um por clique, cada um irrecuperável — e nenhum teste renderizava o modal para
 * dizer se o comprovante aparecia.
 *
 * O critério que a P.O. escreveu, e que estes casos prendem: *"preciso que o modal de confirmação
 * apareça em tela e confirme o processamento que de fato ocorre corretamente"*. Ou seja, não basta
 * não quebrar — o comprovante tem de DESCREVER o que foi enfileirado, inteiro.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { RemittancePreviewModal } from '#modules/financial/client/contas-a-pagar-list/components/remittance-preview-modal.component.tsx'

afterEach(() => {
  cleanup()
})

const file = (
  over: Partial<{ remittanceId: string; nsa: string; fileName: string; total: string }> = {},
) => ({
  remittanceId: 'r1',
  nsa: '7',
  fileName: 'PAG_435366.01092026204605_000007.REM',
  total: 'R$ 3,00',
  ...over,
})

const base = {
  open: true,
  running: false,
  view: null,
  errorTag: null,
  notApprovedCount: 0,
  onToggle: vi.fn(),
  onClose: vi.fn(),
  awaitingAccount: false,
  accounts: [],
  cedenteAccountId: 'acc-1',
  onCedenteAccount: vi.fn(),
  confirming: false,
  onArm: vi.fn(),
  onDisarm: vi.fn(),
  generating: false,
  generateErrorTag: null,
  generateErrorMessage: null,
  onGenerate: vi.fn(),
  downloading: false,
  downloadErrorTag: null,
  downloadErrorMessage: null,
  downloadedFromFailures: false,
  onDownload: vi.fn(),
}

describe('comprovante da remessa — o modal de confirmação', () => {
  it('APARECE e descreve o que foi enfileirado: NSA, arquivo, data e total', () => {
    render(<RemittancePreviewModal {...base} generated={{ files: [file()], paymentDate: '01/09/2026' }} />)
    expect(screen.getByText('Remessa gerada')).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('PAG_435366.01092026204605_000007.REM')).toBeTruthy()
    expect(screen.getByText('01/09/2026')).toBeTruthy()
    expect(screen.getByText('R$ 3,00')).toBeTruthy()
  })

  it('⚠️ seleção MISTA: lista os DOIS arquivos — comprovante pela metade é pior que erro', () => {
    // Boleto e transferência não cabem no mesmo lote (core-api#929). Exibir só o primeiro faria o
    // operador confirmar acreditando ter conferido o que na verdade não viu.
    render(
      <RemittancePreviewModal
        {...base}
        generated={{
          files: [
            file(),
            file({ remittanceId: 'r2', nsa: '8', fileName: 'PAG_...008.REM', total: 'R$ 1.500,00' }),
          ],
          paymentDate: '01/09/2026',
        }}
      />,
    )
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('8')).toBeTruthy()
    expect(screen.getByText('R$ 3,00')).toBeTruthy()
    expect(screen.getByText('R$ 1.500,00')).toBeTruthy()
  })

  it('cada arquivo tem o SEU download, e o clique manda o id certo', () => {
    // Um botão só, baixando o primeiro, entregaria metade da evidência a quem vai conferir bytes com
    // o banco — e sem dizer que faltava metade.
    const onDownload = vi.fn()
    render(
      <RemittancePreviewModal
        {...base}
        onDownload={onDownload}
        generated={{
          files: [file(), file({ remittanceId: 'r2', nsa: '8' })],
          paymentDate: '01/09/2026',
        }}
      />,
    )
    const botoes = screen.getAllByRole('button', { name: /Baixar arquivo/ })
    expect(botoes.length).toBe(2)
    const segundo = botoes[1]
    if (segundo === undefined) throw new Error('esperava um botão por arquivo do lote')
    fireEvent.click(segundo)
    expect(onDownload).toHaveBeenCalledWith('r2')
  })

  it('sem comprovante o modal NÃO inventa a tela de sucesso', () => {
    render(<RemittancePreviewModal {...base} generated={null} />)
    expect(screen.queryByText('Remessa gerada')).toBeNull()
  })
})
