/**
 * ExportMenu (Vitest/jsdom) — wiring do item PDF (#144) sem quebrar OFX/CSV. Renderiza a view BURRA com props
 * FIXTURE (sem binding/rota): com `reportPdf.enabled` o item PDF HABILITA e o clique chama `print` (imprime o
 * relatório DIRETO, sem nova aba); OFX/CSV seguem chamando `exportAs`. Sem `!` non-null; sem RegExp dinâmico.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ExportMenu } from '#modules/financial/client/reconciliation-workspace/components/export-menu.component.tsx'
import type { HeaderMenusBinding } from '#modules/financial/client/reconciliation-workspace/header-menus.binding.ts'
import type { ExportBinding } from '#modules/financial/client/reconciliation-workspace/export-conciliacao.binding.ts'
import type { ExportFormat } from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k
const has = (k: string) => (name: string) => name.includes(tr(k))

const menus = (over: Partial<HeaderMenusBinding> = {}): HeaderMenusBinding => ({
  periodOpen: false,
  exportOpen: true,
  periodActionsOpen: false,
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
  applyImportedPeriod: vi.fn(),
  ...over,
})

const exportBinding = (over: Partial<ExportBinding> = {}): ExportBinding => ({
  canExport: true,
  periodLabel: '18 mai 2026 – 17 jun 2026',
  exporting: false,
  errorTag: null,
  exportAs: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('ExportMenu — PDF wiring (#144)', () => {
  it('com período (reportPdf.enabled), o item PDF HABILITA e o clique imprime (chama print)', () => {
    const print = vi.fn()
    render(
      <ExportMenu menus={menus()} exportBinding={exportBinding()} reportPdf={{ enabled: true, print }} />,
    )
    const pdf = screen.getByRole('menuitem', { name: has('financial.recon.export.pdf') })
    expect(pdf.hasAttribute('disabled')).toBe(false)
    fireEvent.click(pdf)
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('sem período (reportPdf.enabled false), o item PDF fica desabilitado com motivo honesto', () => {
    const print = vi.fn()
    render(
      <ExportMenu
        menus={menus()}
        exportBinding={exportBinding({ canExport: false, periodLabel: null })}
        reportPdf={{ enabled: false, print }}
      />,
    )
    const pdf = screen.getByRole('menuitem', { name: has('financial.recon.export.pdf') })
    expect(pdf.hasAttribute('disabled')).toBe(true)
    expect(pdf.getAttribute('title')).toBe(tr('financial.recon.export.noPeriod'))
    fireEvent.click(pdf)
    expect(print).not.toHaveBeenCalled()
  })

  it('OFX/CSV seguem intactos: clique chama exportAs com o formato (PDF não interfere)', () => {
    const calls: ExportFormat[] = []
    render(
      <ExportMenu
        menus={menus()}
        exportBinding={exportBinding({
          exportAs: (f: ExportFormat) => {
            calls.push(f)
          },
        })}
        reportPdf={{ enabled: true, print: vi.fn() }}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: has('financial.recon.export.ofx') }))
    fireEvent.click(screen.getByRole('menuitem', { name: has('financial.recon.export.csv') }))
    expect(calls).toEqual(['ofx', 'csv-nibo'])
  })
})
