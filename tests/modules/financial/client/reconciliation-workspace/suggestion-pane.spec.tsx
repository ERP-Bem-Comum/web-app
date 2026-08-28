/**
 * SuggestionPane (Vitest/jsdom) — view burra: match card (extrato × título), critérios, Conciliar/
 * Rejeitar e alternativas. Recebe o estado derivado por props (sem hooks).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { SuggestionPane } from '#modules/financial/client/reconciliation-workspace/components/suggestion-pane.component.tsx'
import type { SuggestionState } from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.binding.ts'
import type { StatementTransaction } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const selectedTx: StatementTransaction = {
  id: 't1',
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Debit',
  entryType: 'PIX',
  payeeName: 'Fornecedor X',
  memo: 'pix enviado',
  valueCents: '150000',
  balanceAfterCents: '0',
  reconciliationStatus: 'Pending',
}

const ready: SuggestionState = {
  tag: 'ready',
  top: {
    payableId: 'p1',
    score: 87,
    band: 'alta',
    criteria: { payeeMatch: true, exactValue: true, dateD0: true, memoRef: false, supplierOpenCount: 1 },
    criteriaBreakdown: [
      { criterion: 'exactValue', weight: 40, result: 'ok', detail: '' },
      { criterion: 'memoRef', weight: 10, result: 'falha', detail: '' },
      { criterion: 'supplierOpen', weight: 5, result: 'parcial', detail: '2' },
    ],
    payable: {
      id: 'p1',
      documentId: 'DOC-1',
      valueCents: '150000',
      dueDate: '2026-06-10',
      issueDate: '2026-06-01',
      paidAt: '2026-06-19',
      paymentMethod: 'PIX',
      supplierName: null,
      documentNumber: '0847',
      category: null,
      documentType: null,
    },
  },
  alternatives: [],
}

const base = {
  selectedTx,
  reconciling: false,
  rejecting: false,
  errorTag: null,
  onReconcile: vi.fn(),
  onReject: vi.fn(),
}

afterEach(() => {
  cleanup()
})

describe('SuggestionPane', () => {
  it('idle: pede para selecionar uma movimentação', () => {
    render(<SuggestionPane {...base} state={{ tag: 'idle' }} selectedTx={null} />)
    expect(screen.getByText(tr('financial.recon.sugg.idle'))).toBeTruthy()
  })

  it('none: anuncia que não há palpite', () => {
    render(<SuggestionPane {...base} state={{ tag: 'none' }} />)
    expect(screen.getByText(tr('financial.recon.sugg.none'))).toBeTruthy()
  })

  it('ready: mostra o match card de alta confiança + valor do título', () => {
    render(<SuggestionPane {...base} state={ready} />)
    expect(screen.getByText(tr('financial.recon.sugg.high'))).toBeTruthy()
    expect(screen.getByText('87%')).toBeTruthy()
    expect(screen.getByText('0847')).toBeTruthy() // documentNumber (mínimo #172)
  })

  it('#172: com o BFF enriquecendo, o título vira o nome do favorecido + nº do documento como ref', () => {
    const enriched: SuggestionState = {
      ...ready,
      top: {
        ...ready.top,
        payable:
          ready.top.payable === null
            ? null
            : { ...ready.top.payable, supplierName: 'TS Da Silva Serviços Ltda' },
      },
    }
    render(<SuggestionPane {...base} state={enriched} />)
    // Nome do favorecido no título (#172) + nº do documento continua visível como referência.
    expect(screen.getByText('TS Da Silva Serviços Ltda')).toBeTruthy()
    expect(screen.getByText('0847')).toBeTruthy()
  })

  it('datas: extrato mostra a data da TRANSAÇÃO; título mostra a data de PAGAMENTO (baixa), não o vencimento', () => {
    render(<SuggestionPane {...base} state={ready} />)
    // Extrato: rótulo "Transação" + data da movimentação (selectedTx.date).
    expect(screen.getByText(tr('financial.recon.sugg.txDate'))).toBeTruthy()
    expect(screen.getByText('2026-06-01')).toBeTruthy()
    // Título: rótulo "Pagamento" + paidAt (baixa = saída bancária); o vencimento (2026-06-10) NÃO aparece.
    expect(screen.getByText(tr('financial.recon.sugg.paidAt'))).toBeTruthy()
    expect(screen.getByText('2026-06-19')).toBeTruthy()
    expect(screen.queryByText('2026-06-10')).toBeNull()
  })

  it('#140: renderiza chips do breakdown com peso e count do supplierOpen', () => {
    render(<SuggestionPane {...base} state={ready} />)
    // rótulo do critério novo + count do supplierOpen (parcial) no mesmo span
    expect(screen.getByText(`${tr('financial.recon.crit.supplierOpen')} (2)`)).toBeTruthy()
    expect(screen.getByText('40')).toBeTruthy() // peso (badge) do exactValue
    expect(screen.getByText('5')).toBeTruthy() // peso do supplierOpen
  })

  it('#140: breakdown vazio cai no fallback dos chips booleanos', () => {
    const noBreakdown: SuggestionState = {
      ...ready,
      top: { ...ready.top, criteriaBreakdown: [] },
    }
    render(<SuggestionPane {...base} state={noBreakdown} />)
    expect(screen.getByText(tr('financial.recon.crit.payeeMatch'))).toBeTruthy()
    // sem breakdown não há badge de peso
    expect(screen.queryByText('40')).toBeNull()
  })

  it('Conciliar dispara onReconcile com o payableId', () => {
    const onReconcile = vi.fn()
    render(<SuggestionPane {...base} state={ready} onReconcile={onReconcile} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.sugg.confirm')) }),
    )
    expect(onReconcile).toHaveBeenCalledWith('p1')
  })

  it('Rejeitar dispara onReject com o payableId', () => {
    const onReject = vi.fn()
    render(<SuggestionPane {...base} state={ready} onReject={onReject} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.sugg.reject')) }),
    )
    expect(onReject).toHaveBeenCalledWith('p1')
  })
})

// ── M2 (specs/110): "Editar" a taxonomia no bloco CATEGORIZAÇÃO ────────────────
const cascadeStub = (
  over: Partial<{
    refs: Record<string, string>
    isValid: boolean
    hasSelection: boolean
    setLevel: ReturnType<typeof vi.fn>
  }> = {},
) => ({
  refs: {
    programRef: '',
    budgetPlanRef: '',
    costCenterRef: '',
    categoryRef: '',
    subcategoryRef: '',
    ...(over.refs ?? {}),
  },
  programOptions: [{ value: 'prog-1', label: 'GOD — Grande Obra' }],
  planoOptions: [{ value: 'plan-1', label: '2026 GOD 1.0' }],
  costCenterOptions: [],
  categoryOptions: [],
  subcategoryOptions: [],
  setLevel: over.setLevel ?? vi.fn(),
  reset: vi.fn(),
  isValid: over.isValid ?? true,
  hasSelection: over.hasSelection ?? false,
})

const reclassifyStub = (
  over: Partial<{ canEdit: boolean; editing: boolean; start: ReturnType<typeof vi.fn> }> = {},
  cascadeOver: Parameters<typeof cascadeStub>[0] = {},
) =>
  ({
    canEdit: over.canEdit ?? true,
    editing: over.editing ?? false,
    cascade: cascadeStub(cascadeOver),
    start: over.start ?? vi.fn(),
    cancel: vi.fn(),
  }) as never

const renderPane = (reclassify: unknown, taxonomy?: unknown) =>
  render(
    <SuggestionPane
      state={ready}
      selectedTx={selectedTx}
      reclassify={reclassify as never}
      taxonomy={taxonomy as never}
      reconciling={false}
      rejecting={false}
      errorTag={null}
      onReconcile={vi.fn()}
      onReject={vi.fn()}
    />,
  )

describe('M2 · "Editar" a taxonomia na Sugestão', () => {
  it('oferece "Editar" quando o título é NORMAL (RN-M2-11)', () => {
    renderPane(reclassifyStub({ canEdit: true }))
    expect(screen.getByRole('button', { name: tr('financial.recon.reclass.edit') })).toBeTruthy()
  })

  it('NÃO oferece "Editar" em título de retenção — imposto é alvo da cascata, não fonte', () => {
    renderPane(reclassifyStub({ canEdit: false }))
    expect(screen.queryByRole('button', { name: tr('financial.recon.reclass.edit') })).toBeNull()
  })

  it('clicar em "Editar" abre o editor', () => {
    const start = vi.fn()
    renderPane(reclassifyStub({ canEdit: true, start }))
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.reclass.edit') }))
    expect(start).toHaveBeenCalled()
  })

  it('em edição mostra os 5 selects em cascata (Programa → Subcategoria)', () => {
    renderPane(reclassifyStub({ editing: true }))
    for (const label of [
      'financial.detail.label.programa',
      'financial.detail.label.planoOrcamentario',
      'financial.detail.label.centroCusto',
      'financial.detail.label.categoria',
      'financial.detail.label.subcategoria',
    ]) {
      expect(screen.getByLabelText(tr(label))).toBeTruthy()
    }
  })

  it('níveis sem ancestral escolhido ficam DESABILITADOS (não é lista vazia clicável)', () => {
    renderPane(reclassifyStub({ editing: true }))
    const centro = screen.getByLabelText(tr('financial.detail.label.centroCusto'))
    expect((centro as HTMLSelectElement).disabled).toBe(true)
    const programa = screen.getByLabelText(tr('financial.detail.label.programa'))
    expect((programa as HTMLSelectElement).disabled).toBe(false)
  })

  it('caminho INVÁLIDO barra o Conciliar e explica o motivo (RN-M2-09)', () => {
    renderPane(reclassifyStub({ editing: true }, { isValid: false }))
    const confirmar = screen.getByRole('button', { name: tr('financial.recon.sugg.confirm') })
    expect((confirmar as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(tr('financial.recon.reclass.invalidPath'))).toBeTruthy()
  })

  it('caminho válido libera o Conciliar e avisa da cascata aos impostos (RN-M2-04)', () => {
    renderPane(reclassifyStub({ editing: true }, { isValid: true }))
    const confirmar = screen.getByRole('button', { name: tr('financial.recon.sugg.confirm') })
    expect((confirmar as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText(tr('financial.recon.reclass.cascadeHint'))).toBeTruthy()
  })
})
