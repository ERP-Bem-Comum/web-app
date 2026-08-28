/**
 * SearchCreatePane (Vitest/jsdom) — view burra (US3): seleção de títulos, soma/diferença, classificação
 * e gating do Conciliar. Recebe um binding mock por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { SearchCreatePane } from '#modules/financial/client/reconciliation-workspace/components/search-create-pane.component.tsx'
import type { SearchCreateBinding } from '#modules/financial/client/reconciliation-workspace/search-create.binding.ts'
import type { PaidPayable } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const payables: readonly PaidPayable[] = [
  {
    id: 'p1',
    documentId: 'd1',
    valueCents: '100000',
    dueDate: '2026-06-10',
    issueDate: '2026-06-01',
    paidAt: null,
    paymentMethod: 'PIX',
    supplierName: 'Fornecedor Um',
    documentNumber: '001',
    category: 'Serviços / Consultoria',
    documentType: 'NFS-e',
  },
  {
    id: 'p2',
    documentId: 'd2',
    valueCents: '50000',
    dueDate: '2026-06-11',
    issueDate: null,
    paidAt: null,
    paymentMethod: 'TED',
    supplierName: 'Fornecedor Dois',
    documentNumber: '002',
    category: 'Imposto / ISS',
    documentType: 'ISS',
  },
]

const baseBinding = (over: Partial<SearchCreateBinding> = {}): SearchCreateBinding => {
  const merged: SearchCreateBinding = {
    selectedIds: new Set(),
    treatment: null,
    selectedSumCents: 0,
    residualCents: 0,
    canReconcile: false,
    canConfirm: false,
    reclassify: {
      canEdit: false,
      editing: false,
      cascade: {
        refs: {
          programRef: '',
          budgetPlanRef: '',
          costCenterRef: '',
          categoryRef: '',
          subcategoryRef: '',
        },
        programOptions: [],
        planoOptions: [],
        costCenterOptions: [],
        categoryOptions: [],
        subcategoryOptions: [],
        setLevel: vi.fn(),
        reset: vi.fn(),
        isValid: true,
        hasSelection: false,
      },
      toggle: vi.fn(),
    },
    showTreatment: false,
    reconType: 'Individual',
    submitting: false,
    errorTag: null,
    costCenterRef: '',
    observation: '',
    costCenterOptions: [],
    setCostCenterRef: vi.fn(),
    setObservation: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    documentType: 'all',
    typeOptions: [
      'NFS-e',
      'DANFE',
      'RPA',
      'Fatura',
      'Boleto',
      'Recibo',
      'Imposto',
      'IRRF',
      'ISS',
      'INSS',
      'CSRF',
    ],
    setDocumentType: vi.fn(),
    periodOpen: false,
    togglePeriod: vi.fn(),
    closePeriod: vi.fn(),
    periodField: 'due',
    periodFrom: '',
    periodTo: '',
    typeActive: false,
    periodActive: false,
    periodFieldDraft: 'due',
    periodFromDraft: '',
    periodToDraft: '',
    setPeriodFieldDraft: vi.fn(),
    setPeriodFromDraft: vi.fn(),
    setPeriodToDraft: vi.fn(),
    applyPeriod: vi.fn(),
    clearPeriod: vi.fn(),
    valueOpen: false,
    toggleValue: vi.fn(),
    closeValue: vi.fn(),
    valueActive: false,
    valueMinDraft: '',
    valueMaxDraft: '',
    setValueMinDraft: vi.fn(),
    setValueMaxDraft: vi.fn(),
    applyValue: vi.fn(),
    clearValue: vi.fn(),
    filtered: payables,
    pageRows: payables,
    filteredCount: payables.length,
    page: 1,
    pageCount: 1,
    prevPage: vi.fn(),
    nextPage: vi.fn(),
    totalCount: payables.length,
    toggle: vi.fn(),
    setTreatment: vi.fn(),
    clear: vi.fn(),
    confirm: vi.fn(),
    ...over,
  }
  // Espelha `filtered` → `pageRows`/`filteredCount` quando o teste sobrescreve só `filtered`.
  return {
    ...merged,
    pageRows: over.pageRows ?? merged.filtered,
    filteredCount: over.filteredCount ?? merged.filtered.length,
  }
}

afterEach(() => {
  cleanup()
})

describe('SearchCreatePane', () => {
  it('lista os títulos Pago e dispara toggle ao clicar', () => {
    const toggle = vi.fn()
    render(
      <SearchCreatePane binding={baseBinding({ toggle })} payables={payables} extratoValueCents="150000" />,
    )
    expect(screen.getByText('001')).toBeTruthy()
    fireEvent.click(screen.getByText('001'))
    expect(toggle).toHaveBeenCalledWith('p1')
  })

  it('#192: título de imposto retido mostra o ÓRGÃO (SEFIN/Receita Federal), não o fornecedor-pai', () => {
    const taxBase = {
      documentId: 'd9',
      valueCents: '10000',
      dueDate: '2026-06-10',
      issueDate: null,
      paidAt: null,
      paymentMethod: 'PIX',
      supplierName: 'Fornecedor Pai',
      category: 'Imposto',
      documentType: null,
    } as const
    const tax: readonly PaidPayable[] = [
      { ...taxBase, id: 'iss', retentionType: 'ISS', documentNumber: 'i1' },
      { ...taxBase, id: 'irrf', retentionType: 'IRRF', documentNumber: 'i2' },
    ]
    render(<SearchCreatePane binding={baseBinding({ filtered: tax })} payables={tax} extratoValueCents="0" />)
    // ISS → SEFIN; IRRF → Receita Federal (o helper #192). O fornecedor-pai NÃO vira o nome do título.
    expect(screen.getByText(tr('financial.recon.pending.agency.iss'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.pending.agency.federal'))).toBeTruthy()
    expect(screen.queryByText('Fornecedor Pai')).toBeNull()
  })

  it('#9.4.6: com diferença mas SEM revelar, o painel de tratamento NÃO aparece', () => {
    render(
      <SearchCreatePane
        binding={baseBinding({
          selectedIds: new Set(['p1']),
          selectedSumCents: 100000,
          residualCents: 50000,
          showTreatment: false, // ainda não clicou Conciliar
        })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(screen.queryByText(tr('financial.recon.multi.diffTreat'))).toBeNull()
    expect(screen.queryByRole('button', { name: tr('financial.recon.treatment.Interest') })).toBeNull()
  })

  it('#9.4.6: com showTreatment, mostra as opções; setTreatment ao clicar', () => {
    const setTreatment = vi.fn()
    render(
      <SearchCreatePane
        binding={baseBinding({
          selectedIds: new Set(['p1']),
          selectedSumCents: 100000,
          residualCents: 50000,
          showTreatment: true,
          setTreatment,
        })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    const juros = screen.getByRole('button', { name: tr('financial.recon.treatment.Interest') })
    fireEvent.click(juros)
    expect(setTreatment).toHaveBeenCalledWith('Interest')
  })

  it('Conciliar bloqueado quando !canConfirm; habilitado dispara confirm', () => {
    const confirm = vi.fn()
    const { rerender } = render(
      <SearchCreatePane
        binding={baseBinding({ canConfirm: false })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(
      screen
        .getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.confirm')) })
        .hasAttribute('disabled'),
    ).toBe(true)
    rerender(
      <SearchCreatePane
        binding={baseBinding({ canConfirm: true, selectedIds: new Set(['p1', 'p2']), confirm })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.confirm')) }),
    )
    expect(confirm).toHaveBeenCalled()
  })

  it('056: renderiza os 3 controles ricos (Período, Tipo, Valor) e o Tipo lista a canônica com imposto retido', () => {
    render(<SearchCreatePane binding={baseBinding()} payables={payables} extratoValueCents="150000" />)
    // Período e Valor = botões de popover (aria-haspopup=dialog)
    expect(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.flt.period')) }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.flt.value')) }),
    ).toBeTruthy()
    // Tipo = select com a lista canônica (inclui IRRF — imposto retido — e Boleto — documento)
    const typeSel = screen.getByLabelText(tr('financial.recon.multi.flt.type'))
    expect(typeSel).toBeTruthy()
    expect(screen.getByRole('option', { name: 'IRRF' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Boleto' })).toBeTruthy()
    fireEvent.change(typeSel, { target: { value: 'IRRF' } })
    // popovers fechados por padrão → sem toggle/date inputs ainda
    expect(screen.queryByRole('button', { name: tr('financial.recon.multi.flt.periodField.due') })).toBeNull()
  })

  it('056: abrir o popover de Período mostra o toggle Vencimento/Emissão + 2 date inputs', () => {
    render(
      <SearchCreatePane
        binding={baseBinding({ periodOpen: true })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(screen.getByRole('button', { name: tr('financial.recon.multi.flt.periodField.due') })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: tr('financial.recon.multi.flt.periodField.issue') }),
    ).toBeTruthy()
    // 2 date inputs (De / Até) via aria-label
    expect(screen.getByLabelText(tr('financial.recon.multi.flt.from'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.recon.multi.flt.to'))).toBeTruthy()
    // toggle p/ Emissão chama o setter do rascunho
    const setPeriodFieldDraft = vi.fn()
    cleanup()
    render(
      <SearchCreatePane
        binding={baseBinding({ periodOpen: true, setPeriodFieldDraft })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.multi.flt.periodField.issue') }))
    expect(setPeriodFieldDraft).toHaveBeenCalledWith('issue')
  })

  it('056: abrir o popover de Valor mostra Mínimo/Máximo; Aplicar dispara applyValue', () => {
    const applyValue = vi.fn()
    render(
      <SearchCreatePane
        binding={baseBinding({ valueOpen: true, applyValue })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(screen.getByLabelText(tr('financial.recon.multi.flt.min'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.recon.multi.flt.max'))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.multi.flt.apply') }))
    expect(applyValue).toHaveBeenCalled()
  })
})

// ── M2 (specs/110): "Editar" ao lado de "+ Lançamento Manual" ──────────────────
describe('M2 · "Editar" no Buscar/Criar vários', () => {
  const withReclassify = (over: Partial<{ canEdit: boolean; editing: boolean; isValid: boolean }>) =>
    baseBinding({
      reclassify: {
        canEdit: over.canEdit ?? false,
        editing: over.editing ?? false,
        cascade: {
          refs: {
            programRef: '',
            budgetPlanRef: '',
            costCenterRef: '',
            categoryRef: '',
            subcategoryRef: '',
          },
          programOptions: [],
          planoOptions: [],
          costCenterOptions: [],
          categoryOptions: [],
          subcategoryOptions: [],
          setLevel: vi.fn(),
          reset: vi.fn(),
          isValid: over.isValid ?? true,
          hasSelection: false,
        },
        toggle: vi.fn(),
      },
    } as never)

  const renderPane = (binding: ReturnType<typeof baseBinding>) =>
    render(<SearchCreatePane binding={binding} payables={payables} extratoValueCents="150000" />)

  const editBtn = () => screen.getByRole('button', { name: tr('financial.recon.reclass.edit') })

  it('seleção SÓ de impostos NÃO habilita o "Editar" (M2-7 / RN-M2-11)', () => {
    renderPane(withReclassify({ canEdit: false }))
    expect((editBtn() as HTMLButtonElement).disabled).toBe(true)
  })

  it('seleção com título NORMAL habilita (M2-8)', () => {
    renderPane(withReclassify({ canEdit: true }))
    expect((editBtn() as HTMLButtonElement).disabled).toBe(false)
  })

  it('barrado explica o porquê (não fica só cinza sem motivo)', () => {
    renderPane(withReclassify({ canEdit: false }))
    expect(editBtn().getAttribute('title')).toBe(tr('financial.recon.reclass.onlyNormal'))
  })

  it('em edição mostra os 5 selects em cascata', () => {
    renderPane(withReclassify({ canEdit: true, editing: true }))
    expect(screen.getByLabelText(tr('financial.detail.label.programa'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.detail.label.subcategoria'))).toBeTruthy()
  })
})
