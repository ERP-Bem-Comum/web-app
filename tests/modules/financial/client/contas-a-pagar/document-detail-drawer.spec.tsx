import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// O drawer usa <Link> do TanStack Router (footer "Editar pagamento"), que exige RouterProvider.
// Como o teste foca no conteúdo (descrição/favorecido), trocamos o Link por uma âncora simples.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

import { DocumentDetailDrawer } from '#modules/financial/client/contas-a-pagar-list/components/document-detail-drawer.component.tsx'
import type { DocumentDetailView } from '#modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'

afterEach(() => {
  cleanup()
})

const baseView: DocumentDetailView = {
  id: 'doc-1',
  type: 'RPA',
  documentNumber: '123',
  status: 'Aberto',
  supplier: 'Alexandre Novaes',
  supplierDoc: '143.964.120-02',
  emissao: '—',
  due: '06/07/2026',
  gross: 'R$ 540,00',
  net: 'R$ 540,00',
  paymentMethod: 'PIX',
  description: 'teste rpa',
  retentions: [],
  retentionsTotal: null,
  payables: [],
}

describe('DocumentDetailDrawer', () => {
  it('renderiza a descrição do documento quando há texto', () => {
    render(<DocumentDetailDrawer view={baseView} onClose={() => undefined} />)
    expect(screen.getByText('Descrição')).toBeTruthy()
    expect(screen.getByText('teste rpa')).toBeTruthy()
  })

  it('omite a seção de descrição quando vazia', () => {
    render(<DocumentDetailDrawer view={{ ...baseView, description: '' }} onClose={() => undefined} />)
    expect(screen.queryByText('Descrição')).toBeNull()
  })

  it('exibe o favorecido (real) na Forma de Pagamento', () => {
    render(<DocumentDetailDrawer view={baseView} onClose={() => undefined} />)
    // "Alexandre Novaes" aparece no cabeçalho do fornecedor e como Favorecido no pagamento.
    expect(screen.getAllByText(/Alexandre Novaes/).length).toBeGreaterThanOrEqual(2)
  })

  it('Composição: retenções aparecem somadas numa linha única (tipos no rótulo + total em parênteses)', () => {
    render(
      <DocumentDetailDrawer
        view={{
          ...baseView,
          retentions: [
            { type: 'IRRF', value: 'R$ 150,00' },
            { type: 'INSS', value: 'R$ 400,00' },
          ],
          retentionsTotal: 'R$ 550,00',
        }}
        onClose={() => undefined}
      />,
    )
    expect(screen.getByText('− Retenções (IRRF, INSS)')).toBeTruthy()
    expect(screen.getByText('(R$ 550,00)')).toBeTruthy()
  })

  it('Composição: sem retenções, a linha de Retenções não aparece', () => {
    render(<DocumentDetailDrawer view={baseView} onClose={() => undefined} />)
    expect(screen.queryByText(/− Retenções/)).toBeNull()
  })
})
