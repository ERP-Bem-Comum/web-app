/**
 * SavedViewsMenu (Vitest/jsdom) — view BURRA das visões salvas (#351). Cobre: salvar dispara onSaveView com
 * o nome digitado; a lista renderiza as visões e clicar APLICA (onApplyView com o id); excluir dispara
 * onDeleteView. Recebe tudo por props (sem hooks de dados / localStorage).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { SavedViewsMenu } from '#modules/financial/client/contas-a-pagar-list/components/saved-views-menu.component.tsx'
import type { SavedView } from '#modules/financial/client/contas-a-pagar-list/contas-a-pagar-saved-views.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const VIEWS: readonly SavedView[] = [
  { id: 'v1', name: 'RPA a vencer', status: 'Aprovado', dims: ['tipo'], filters: { tipo: 'RPA' } },
  { id: 'v2', name: 'Tudo aberto', status: 'Aberto', dims: [], filters: {} },
]

afterEach(() => {
  cleanup()
})

describe('SavedViewsMenu', () => {
  it('menu fechado não renderiza o input de salvar nem a lista', () => {
    render(
      <SavedViewsMenu
        menuOpen={false}
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        savedViews={VIEWS}
        onSaveView={vi.fn()}
        onApplyView={vi.fn()}
        onDeleteView={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(tr('financial.list.savedViews.nameLabel'))).toBeNull()
    expect(screen.queryByText('RPA a vencer')).toBeNull()
  })

  it('salvar dispara onSaveView com o nome digitado e limpa o input', () => {
    const onSaveView = vi.fn()
    const onCloseMenu = vi.fn()
    render(
      <SavedViewsMenu
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={onCloseMenu}
        savedViews={[]}
        onSaveView={onSaveView}
        onApplyView={vi.fn()}
        onDeleteView={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(tr('financial.list.savedViews.nameLabel')), {
      target: { value: 'Minha visão' },
    })
    fireEvent.click(screen.getByText(tr('financial.list.savedViews.save')))
    expect(onSaveView).toHaveBeenCalledWith('Minha visão')
    expect(onCloseMenu).toHaveBeenCalled()
  })

  it('nome vazio mantém o botão Salvar desabilitado (não dispara onSaveView)', () => {
    const onSaveView = vi.fn()
    render(
      <SavedViewsMenu
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        savedViews={[]}
        onSaveView={onSaveView}
        onApplyView={vi.fn()}
        onDeleteView={vi.fn()}
      />,
    )
    const btn = screen.getByText(tr('financial.list.savedViews.save'))
    expect(btn.hasAttribute('disabled')).toBe(true)
    fireEvent.click(btn)
    expect(onSaveView).not.toHaveBeenCalled()
  })

  it('lista as visões salvas; clicar numa APLICA (onApplyView com o id)', () => {
    const onApplyView = vi.fn()
    render(
      <SavedViewsMenu
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        savedViews={VIEWS}
        onSaveView={vi.fn()}
        onApplyView={onApplyView}
        onDeleteView={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'RPA a vencer' }))
    expect(onApplyView).toHaveBeenCalledWith('v1')
  })

  it('excluir uma visão dispara onDeleteView com o id', () => {
    const onDeleteView = vi.fn()
    render(
      <SavedViewsMenu
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        savedViews={VIEWS}
        onSaveView={vi.fn()}
        onApplyView={vi.fn()}
        onDeleteView={onDeleteView}
      />,
    )
    // dois botões "Excluir visão" — o segundo (índice 1) é da v2.
    const deletes = screen.getAllByLabelText(tr('financial.list.savedViews.delete'))
    const secondDelete = deletes[1]
    expect(secondDelete).toBeDefined()
    if (secondDelete !== undefined) fireEvent.click(secondDelete)
    expect(onDeleteView).toHaveBeenCalledWith('v2')
  })

  it('sem visões, mostra o estado vazio', () => {
    render(
      <SavedViewsMenu
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        savedViews={[]}
        onSaveView={vi.fn()}
        onApplyView={vi.fn()}
        onDeleteView={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.list.savedViews.empty'))).toBeTruthy()
  })
})
