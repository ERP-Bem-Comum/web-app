import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// O drawer usa <Link> do TanStack Router (footer "Editar pagamento"), que exige RouterProvider.
// Como o teste foca no conteúdo (descrição/favorecido), trocamos o Link por uma âncora simples.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

import { DocumentDetailDrawer } from '#modules/financial/client/contas-a-pagar-list/components/document-detail-drawer.component.tsx'
import type { PayeeBankView } from '#modules/financial/client/contas-a-pagar-list/payee-bank.binding.ts'
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
  paymentDetail: null,
  description: 'teste rpa',
  retentions: [],
  retentionsTotal: null,
  payables: [],
}

describe('DocumentDetailDrawer', () => {
  it('renderiza a descrição do documento quando há texto', () => {
    render(<DocumentDetailDrawer view={baseView} payeeBank={null} onClose={() => undefined} />)
    expect(screen.getByText('Descrição')).toBeTruthy()
    expect(screen.getByText('teste rpa')).toBeTruthy()
  })

  it('omite a seção de descrição quando vazia', () => {
    render(
      <DocumentDetailDrawer
        view={{ ...baseView, description: '' }}
        payeeBank={null}
        onClose={() => undefined}
      />,
    )
    expect(screen.queryByText('Descrição')).toBeNull()
  })

  it('exibe o favorecido (real) na Forma de Pagamento', () => {
    render(<DocumentDetailDrawer view={baseView} payeeBank={null} onClose={() => undefined} />)
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
        payeeBank={null}
        onClose={() => undefined}
      />,
    )
    expect(screen.getByText('− Retenções (IRRF, INSS)')).toBeTruthy()
    expect(screen.getByText('(R$ 550,00)')).toBeTruthy()
  })

  it('Composição: sem retenções, a linha de Retenções não aparece', () => {
    render(<DocumentDetailDrawer view={baseView} payeeBank={null} onClose={() => undefined} />)
    expect(screen.queryByText(/− Retenções/)).toBeNull()
  })

  it('#273: Boleto com paymentDetail mostra o complemento (linha digitável) no lugar dos dados bancários gated', () => {
    render(
      <DocumentDetailDrawer
        view={{ ...baseView, paymentMethod: 'Boleto', paymentDetail: '12345.67890 12345.678901' }}
        payeeBank={null}
        onClose={() => undefined}
      />,
    )
    expect(screen.getByText('Linha digitável (47-48 dígitos)')).toBeTruthy()
    expect(screen.getByText('12345.67890 12345.678901')).toBeTruthy()
    // Sem dados bancários gated quando há complemento tipado.
    expect(screen.queryByText('Tipo de Chave')).toBeNull()
  })

  it('#273: Boleto SEM paymentDetail mostra "—" no complemento — NUNCA os dados bancários do favorecido', () => {
    const payeeBank: PayeeBankView = {
      bankLine: 'Itaú · Ag 1234 · CC 56789-0',
      pixType: 'email',
      pixKey: 'pagamentos@exemplo.com',
    }
    render(
      <DocumentDetailDrawer
        view={{ ...baseView, paymentMethod: 'Boleto', paymentDetail: null }}
        payeeBank={payeeBank}
        onClose={() => undefined}
      />,
    )
    // O Boleto mostra SEMPRE o rótulo do código de barras (vazio → "—"), nunca cai nos dados bancários.
    expect(screen.getByText('Linha digitável (47-48 dígitos)')).toBeTruthy()
    expect(screen.queryByText('Tipo de Chave')).toBeNull()
    expect(screen.queryByText('pagamentos@exemplo.com')).toBeNull()
    expect(screen.queryByText('Itaú · Ag 1234 · CC 56789-0')).toBeNull()
  })

  it('#273: PIX (sem complemento tipado) mantém os dados bancários gated', () => {
    render(<DocumentDetailDrawer view={baseView} payeeBank={null} onClose={() => undefined} />)
    expect(screen.getByText('Tipo de Chave')).toBeTruthy()
  })

  it('resolve banco/chave reais do favorecido (client-side) quando há payeeBank — não "—"', () => {
    const payeeBank: PayeeBankView = {
      bankLine: 'Itaú · Ag 1234 · CC 56789-0',
      pixType: 'email',
      pixKey: 'pagamentos@exemplo.com',
    }
    render(<DocumentDetailDrawer view={baseView} payeeBank={payeeBank} onClose={() => undefined} />)
    // Tipo de chave = rótulo do catálogo Partners (email → "E-mail"); chave e banco reais.
    expect(screen.getByText('E-mail')).toBeTruthy()
    expect(screen.getByText('pagamentos@exemplo.com')).toBeTruthy()
    expect(screen.getByText('Itaú · Ag 1234 · CC 56789-0')).toBeTruthy()
    // A seção de pagamento segue ativa (o método PIX continua no card).
    expect(screen.getByText('Tipo de Chave')).toBeTruthy()
  })
})
