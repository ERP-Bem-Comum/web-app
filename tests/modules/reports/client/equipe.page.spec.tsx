/**
 * EquipePage + EquipeTable + EquipeDetailModal (Vitest/jsdom) — comportamento das 3 melhorias novas:
 *   1. paginação: BrandPaginator presente; a tabela mostra só a fatia da página (perPage=10 → 10 de 36).
 *   2. linha clicável abre o modal de detalhe.
 *   3. o modal mostra os 9 campos enxutos (LGPD) e o botão "Editar" navega ao módulo Colaboradores.
 * `useNavigate` é mockado (a page usa router; o teste foca no comportamento de UI, não na rota real).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'

const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateSpy,
}))

import { EquipePage } from '#modules/reports/client/page/equipe.page.tsx'

/** Primeira linha clicável da tabela (aria-label "Ver detalhes de …"). Falha o teste se não houver. */
function firstRow(): HTMLElement {
  const rows = screen.getAllByRole('button', { name: /Ver detalhes de/ })
  const row = rows[0]
  if (row === undefined) throw new Error('nenhuma linha clicável encontrada')
  return row
}

beforeEach(() => {
  navigateSpy.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('EquipePage — paginação', () => {
  it('renderiza o BrandPaginator (Anterior / Página 1 de 4 / Próxima)', () => {
    render(<EquipePage />)
    expect(screen.getByText('Anterior')).toBeTruthy()
    expect(screen.getByText('Próxima')).toBeTruthy()
    // 36 colaboradores / 10 por página = 4 páginas. O label do pager é "Página 1 de 4".
    expect(screen.getByText(/Página\s*1\s*de\s*4/)).toBeTruthy()
  })

  it('mostra só a fatia da página (10 linhas de colaborador na 1ª página)', () => {
    render(<EquipePage />)
    // As linhas clicáveis têm aria-label "Ver detalhes de {nome}".
    const rows = screen.getAllByRole('button', { name: /Ver detalhes de/ })
    expect(rows.length).toBe(10)
  })

  it('"Anterior" começa desabilitado na 1ª página; "Próxima" avança a fatia', () => {
    render(<EquipePage />)
    const prev = screen.getByText('Anterior')
    expect(prev.hasAttribute('disabled')).toBe(true)

    const firstNameBefore = screen
      .getAllByRole('button', { name: /Ver detalhes de/ })[0]
      ?.getAttribute('aria-label')
    fireEvent.click(screen.getByText('Próxima'))
    const firstNameAfter = screen
      .getAllByRole('button', { name: /Ver detalhes de/ })[0]
      ?.getAttribute('aria-label')
    expect(firstNameAfter).not.toBe(firstNameBefore)
  })

  it('trocar "itens por página" volta para a 1ª página e reslice', () => {
    render(<EquipePage />)
    fireEvent.click(screen.getByText('Próxima')) // vai p/ página 2
    const select = screen.getByLabelText('Itens por página')
    fireEvent.change(select, { target: { value: '25' } })
    // 25 por página → 25 linhas na 1ª página (reset).
    expect(screen.getAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(25)
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
  })
})

describe('EquipePage — modal de detalhe (linha clicável)', () => {
  it('clicar numa linha abre o modal com os 9 campos enxutos', () => {
    render(<EquipePage />)
    fireEvent.click(firstRow())

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    const scope = within(dialog)
    // Título + os 9 rótulos de campo (só os enxutos — LGPD).
    expect(scope.getByText('Detalhes do colaborador')).toBeTruthy()
    for (const label of [
      'Nome',
      'Idade',
      'Área de atuação',
      'Função',
      'Vínculo',
      'Identidade de gênero',
      'Raça/cor',
      'Escolaridade',
      'Ano de contrato',
    ]) {
      expect(scope.getByText(label)).toBeTruthy()
    }
    // Botões do rodapé.
    expect(scope.getByText('Fechar')).toBeTruthy()
    expect(scope.getByText('Editar')).toBeTruthy()
  })

  it('NÃO vaza campo sensível (LGPD) no modal', () => {
    render(<EquipePage />)
    fireEvent.click(firstRow())
    const html = screen.getByRole('dialog').textContent?.toLowerCase() ?? ''
    for (const forbidden of [
      'cpf',
      'remunera',
      'salário',
      'salario',
      'telefone',
      'e-mail',
      'endereço',
      'alergia',
      'biografia',
    ]) {
      expect(html.includes(forbidden)).toBe(false)
    }
  })

  it('"Fechar" fecha o modal', () => {
    render(<EquipePage />)
    fireEvent.click(firstRow())
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Fechar'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Editar" navega ao módulo Colaboradores (não edita inline)', () => {
    render(<EquipePage />)
    fireEvent.click(firstRow())
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Editar'))
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/parceiros/colaboradores' })
  })
})
