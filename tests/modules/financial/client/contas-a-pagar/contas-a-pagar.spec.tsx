/**
 * DocumentGrid (Vitest/jsdom) — view burra do grid de Contas a Pagar: cabeçalho + estados
 * (loading/empty/error/linhas). Recebe `ListState` por prop (sem hooks). Lista REAL da Fatia 2.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { DocumentGrid } from '#modules/financial/client/contas-a-pagar-list/components/document-grid.component.tsx'
import type { ListState } from '#modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

const readyState: ListState = {
  tag: 'ready',
  rows: [
    {
      id: 'd1',
      type: 'NFS-e',
      documentNumber: '0847',
      supplier: 'Bambu Educação',
      due: '10/07/2026',
      net: 'R$ 1.500,00',
      status: 'Aberto',
    },
  ],
  page: { page: 1, pageSize: 12, total: 1, rangeLabel: '1–1 de 1', hasPrev: false, hasNext: false },
}

describe('DocumentGrid', () => {
  it('renderiza os cabeçalhos de coluna (DTO fino)', () => {
    render(<DocumentGrid state={readyState} />)
    expect(screen.getByText(tr('financial.list.col.type'))).toBeTruthy()
    expect(screen.getByText(tr('financial.list.col.supplier'))).toBeTruthy()
    expect(screen.getByText(tr('financial.list.col.net'))).toBeTruthy()
  })

  it('lista as linhas reais (fornecedor resolvido, número, status)', () => {
    render(<DocumentGrid state={readyState} />)
    expect(screen.getByText('Bambu Educação')).toBeTruthy()
    expect(screen.getByText('0847')).toBeTruthy()
    expect(screen.getByText('R$ 1.500,00')).toBeTruthy()
    expect(screen.getByText('Aberto')).toBeTruthy()
  })

  it('mostra o estado vazio (não erro) quando a lista vem vazia', () => {
    render(<DocumentGrid state={{ tag: 'empty' }} />)
    expect(screen.getByText(tr('financial.list.empty.title'))).toBeTruthy()
    expect(screen.queryByRole('alert')).toBe(null)
  })

  it('mostra o banner de erro com a tag i18n quando o estado é error', () => {
    render(<DocumentGrid state={{ tag: 'error', errorTag: 'financial.error.server' }} />)
    expect(screen.getByRole('alert').textContent).toBe(tr('financial.error.server'))
  })

  it('mostra o carregando quando loading', () => {
    render(<DocumentGrid state={{ tag: 'loading' }} />)
    expect(screen.getByText(tr('financial.list.loading'))).toBeTruthy()
  })
})
