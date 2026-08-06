/**
 * ExportMenu (Vitest/jsdom) — wiring do item PDF (#144) sem quebrar o CSV. Renderiza a view BURRA com props
 * FIXTURE (sem binding/rota): com `reportPdf.enabled` o item PDF HABILITA e o clique chama `print` (imprime o
 * relatório DIRETO, sem nova aba); o CSV segue chamando `exportAs`. Sem `!` non-null; sem RegExp dinâmico.
 *
 * Cobre também a saída do OFX da tela e a separação dos gates: o PDF não depende de período fechado (é o
 * único export sem impedimento), e o motivo de desabilitado é ESPECÍFICO de cada item.
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

  it('sem intervalo em tela (reportPdf.enabled false), o PDF desabilita com o motivo DELE', () => {
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
    expect(pdf.getAttribute('title')).toBe(tr('financial.recon.export.pdfNoRange'))
    fireEvent.click(pdf)
    expect(print).not.toHaveBeenCalled()
  })

  it('CSV segue intacto: clique chama exportAs com o formato Nibo (PDF não interfere)', () => {
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
    fireEvent.click(screen.getByRole('menuitem', { name: has('financial.recon.export.csv') }))
    expect(calls).toEqual(['csv-nibo'])
  })

  it('o OFX saiu da tela: o menu tem só CSV e PDF', () => {
    render(
      <ExportMenu
        menus={menus()}
        exportBinding={exportBinding()}
        reportPdf={{ enabled: true, print: vi.fn() }}
      />,
    )
    const labels = screen.getAllByRole('menuitem').map((el) => el.textContent ?? '')
    expect(labels.some((l) => l.includes('OFX'))).toBe(false)
    expect(labels).toHaveLength(2)
  })

  // O ponto da mudança (P.O., 06/08): sem período fechado o CSV cai (depende do `:id`), mas o PDF continua
  // exportável — antes o menu inteiro parecia bloqueado, com um "nenhum período" global no topo.
  it('sem período fechado, o CSV desabilita com motivo acionável e o PDF SEGUE habilitado', () => {
    const print = vi.fn()
    render(
      <ExportMenu
        menus={menus()}
        exportBinding={exportBinding({ canExport: false, periodLabel: null })}
        reportPdf={{ enabled: true, print }}
      />,
    )
    const csv = screen.getByRole('menuitem', { name: has('financial.recon.export.csv') })
    expect(csv.hasAttribute('disabled')).toBe(true)
    expect(csv.getAttribute('title')).toBe(tr('financial.recon.export.csvNeedsPeriod'))

    const pdf = screen.getByRole('menuitem', { name: has('financial.recon.export.pdf') })
    expect(pdf.hasAttribute('disabled')).toBe(false)
    fireEvent.click(pdf)
    expect(print).toHaveBeenCalledTimes(1)
  })
})
