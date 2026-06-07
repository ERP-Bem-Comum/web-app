import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { PageHeader } from '#shared/ui/organisms/page-header/page-header.component.tsx'

afterEach(() => {
  cleanup()
})

describe('PageHeader', () => {
  it('renderiza o título como heading', () => {
    render(<PageHeader title="Fornecedores" />)
    expect(screen.getByRole('heading', { name: 'Fornecedores' })).toBeTruthy()
  })

  it('renderiza o subtítulo quando fornecido', () => {
    render(<PageHeader title="Fornecedores" subtitle="Gestão de parceiros" />)
    expect(screen.getByText('Gestão de parceiros')).toBeTruthy()
  })

  it('renderiza o slot de ações (composição)', () => {
    render(
      <PageHeader
        title="Fornecedores"
        actions={<button type="button">Novo</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Novo' })).toBeTruthy()
  })

  it('sem subtítulo e sem ações: título presente e nenhuma ação', () => {
    render(<PageHeader title="Fornecedores" />)
    expect(screen.getByRole('heading', { name: 'Fornecedores' })).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
