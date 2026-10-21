/**
 * ColumnsMenu (Vitest/jsdom) — view BURRA do seletor de colunas (spec 129). Cobre: menu fechado não lista;
 * aberto lista as 11 colunas com as escondidas desmarcadas; Documento/Status marcadas e travadas; marcar
 * dispara onToggleColumn; "Mostrar todas" só habilita com algo escondido; clicar fora fecha.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { ColumnsMenu } from '#modules/financial/client/contas-a-pagar-list/components/columns-menu.component.tsx'
import type { HiddenColumns } from '#modules/financial/client/contas-a-pagar-list/column-visibility.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

const renderMenu = (hidden: HiddenColumns, open = true) => {
  const handlers = {
    onToggleMenu: vi.fn(),
    onCloseMenu: vi.fn(),
    onToggleColumn: vi.fn(),
    onShowAllColumns: vi.fn(),
  }
  render(<ColumnsMenu menuOpen={open} hiddenColumns={hidden} {...handlers} />)
  return handlers
}

describe('ColumnsMenu', () => {
  it('fechado: só o botão Colunas', () => {
    renderMenu(new Set(), false)
    expect(screen.getByRole('button', { name: tr('financial.list.columns.button') })).toBeTruthy()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('aberto: 11 colunas; escondida desmarcada; Documento e Status marcadas e travadas', () => {
    renderMenu(new Set(['supplier']))
    expect(screen.getAllByRole('checkbox')).toHaveLength(11)
    const supplier = screen.getByRole('checkbox', {
      name: tr('financial.list.col.supplier'),
    }) as HTMLInputElement
    expect(supplier.checked).toBe(false)
    // travadas = exatamente as fixas, e marcadas (o rótulo traz o aviso "fixa")
    const locked = (screen.getAllByRole('checkbox') as HTMLInputElement[]).filter((cb) => cb.disabled)
    expect(locked.map((cb) => cb.closest('label')?.textContent)).toEqual([
      `${tr('financial.list.col.documentNumber')}${tr('financial.list.columns.locked')}`,
      `${tr('financial.list.col.status')}${tr('financial.list.columns.locked')}`,
    ])
    expect(locked.every((cb) => cb.checked)).toBe(true)
  })

  it('marcar uma coluna dispara onToggleColumn com a chave', () => {
    const h = renderMenu(new Set())
    fireEvent.click(screen.getByRole('checkbox', { name: tr('financial.list.col.contract') }))
    expect(h.onToggleColumn).toHaveBeenCalledWith('contract')
  })

  it('"Mostrar todas" desabilitado sem nada escondido; habilitado e dispara com algo escondido', () => {
    renderMenu(new Set())
    expect(
      (screen.getByRole('button', { name: tr('financial.list.columns.showAll') }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    cleanup()
    const h = renderMenu(new Set(['net']))
    fireEvent.click(screen.getByRole('button', { name: tr('financial.list.columns.showAll') }))
    expect(h.onShowAllColumns).toHaveBeenCalledOnce()
  })

  it('clicar fora (backdrop) fecha o menu', () => {
    const h = renderMenu(new Set())
    fireEvent.click(screen.getByRole('button', { name: tr('financial.list.columns.close') }))
    expect(h.onCloseMenu).toHaveBeenCalledOnce()
  })
})
