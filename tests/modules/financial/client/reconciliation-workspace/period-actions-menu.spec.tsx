/**
 * PeriodActionsMenu (Vitest/jsdom) — dropdown do footer: Fechar período (gated) + Abrir período (chrome).
 * Recebe o binding de menus + ação de fechar por props (sem hooks).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { PeriodActionsMenu } from '#modules/financial/client/reconciliation-workspace/components/period-actions-menu.component.tsx'
import type { HeaderMenusBinding } from '#modules/financial/client/reconciliation-workspace/header-menus.binding.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const menus = (over: Partial<HeaderMenusBinding> = {}): HeaderMenusBinding => ({
  periodOpen: false,
  exportOpen: false,
  periodActionsOpen: true, // aberto p/ ver os itens
  period: 'last7',
  periodOptions: [],
  customStart: '',
  customEnd: '',
  customLabel: null,
  togglePeriod: vi.fn(),
  toggleExport: vi.fn(),
  togglePeriodActions: vi.fn(),
  closeAll: vi.fn(),
  selectPeriod: vi.fn(),
  setCustomStart: vi.fn(),
  setCustomEnd: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('PeriodActionsMenu', () => {
  it('mostra as duas opções: Fechar período e Abrir período', () => {
    render(<PeriodActionsMenu menus={menus()} canClose closeHint={null} onClosePeriod={vi.fn()} />)
    expect(screen.getByRole('menuitem', { name: tr('financial.recon.bottombar.close') })).toBeTruthy()
    expect(
      screen.getByRole('menuitem', { name: (n) => n.includes(tr('financial.recon.close.reopen')) }),
    ).toBeTruthy()
  })

  it('Abrir período é sempre desabilitado (chrome até backend)', () => {
    render(<PeriodActionsMenu menus={menus()} canClose closeHint={null} onClosePeriod={vi.fn()} />)
    const abrir = screen.getByRole('menuitem', {
      name: (n) => n.includes(tr('financial.recon.close.reopen')),
    }) as HTMLButtonElement
    expect(abrir.disabled).toBe(true)
  })

  it('Fechar período: desabilitado quando !canClose; dispara onClosePeriod quando habilitado', () => {
    const onClosePeriod = vi.fn()
    const { rerender } = render(
      <PeriodActionsMenu menus={menus()} canClose={false} closeHint="x" onClosePeriod={onClosePeriod} />,
    )
    const closeItem = () =>
      screen.getByRole('menuitem', { name: tr('financial.recon.bottombar.close') }) as HTMLButtonElement
    expect(closeItem().disabled).toBe(true)
    rerender(<PeriodActionsMenu menus={menus()} canClose closeHint={null} onClosePeriod={onClosePeriod} />)
    fireEvent.click(closeItem())
    expect(onClosePeriod).toHaveBeenCalled()
  })
})
