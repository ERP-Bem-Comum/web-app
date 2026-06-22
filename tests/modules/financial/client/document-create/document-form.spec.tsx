/**
 * DocumentForm (Vitest/jsdom) — view burra do Lançar Documento: campos de identificação, gating de
 * retenção (bloco só p/ NFS-e/RPA), e callbacks de edição. Recebe tudo por props (sem hooks).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DocumentForm } from '#modules/financial/client/document-create/components/document-form.component.tsx'
import type { DocumentFormFields } from '#modules/financial/client/document-create/document-form.view.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

const fields = (over: Partial<DocumentFormFields> = {}): DocumentFormFields => ({
  type: 'NFS-e',
  documentNumber: '',
  series: '',
  supplierRef: '',
  paymentMethod: '',
  grossValue: '',
  issueDate: '',
  dueDate: '',
  description: '',
  discounts: '',
  jurosMulta: '',
  accessKey: '',
  paymentComplement: '',
  contractRef: '',
  programRef: '',
  categoryRef: '',
  costCenterRef: '',
  approverRef: '',
  centroCusto: '',
  categoria: '',
  subcategoria: '',
  planoOrcamentario: '',
  retentions: { iss: '', irrf: '', inss: '', pis: '', cofins: '', csll: '' },
  reformaTributaria: { cbs: '', ibsMunicipal: '', ibsEstadual: '' },
  ...over,
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  fields: fields(),
  hydration: { bank: null, contracts: [] },
  onType: vi.fn(),
  onPaymentMethod: vi.fn(),
  onText: vi.fn(),
  onRetention: vi.fn(),
  onReformaTributaria: vi.fn(),
  programOptions: [],
  programValue: '',
  onProgram: vi.fn(),
  categoryValue: '',
  onCategory: vi.fn(),
  costCenterValue: '',
  onCostCenter: vi.fn(),
  approverValue: '',
  onApprover: vi.fn(),
  approverOptions: [],
  centroCustoOptions: [],
  categoriaOptions: [],
  subcategoriaOptions: [],
  planoOptions: [],
  contract: null,
  contracts: [],
  contractPickerOpen: false,
  onToggleContractPicker: vi.fn(),
  onCloseContractPicker: vi.fn(),
  onSelectContract: vi.fn(),
  typeModalOpen: false,
  onOpenTypeModal: vi.fn(),
  onSelectType: vi.fn(),
  onCloseTypeModal: vi.fn(),
  payModalOpen: false,
  onOpenPayModal: vi.fn(),
  onSelectPayment: vi.fn(),
  onClosePayModal: vi.fn(),
  ...over,
})

describe('DocumentForm', () => {
  it('renderiza as seções e campos de identificação', () => {
    render(<DocumentForm {...baseProps()} />)
    expect(screen.getByText(tr('financial.create.section.identificacao'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.create.field.type'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.create.field.grossValue'))).toBeTruthy()
  })

  it('#163: campo Emissão é editável e dispara onText("issueDate")', () => {
    const onText = vi.fn()
    render(<DocumentForm {...baseProps({ onText })} />)
    const input = screen.getByLabelText(tr('financial.create.field.emissao'))
    expect((input as HTMLInputElement).disabled).toBe(false)
    fireEvent.change(input, { target: { value: '2026-06-01' } })
    expect(onText).toHaveBeenCalledWith('issueDate', '2026-06-01')
  })

  it('mostra o bloco de retenções (6 inputs) para NFS-e', () => {
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'NFS-e' }) })} />)
    for (const r of ['ISS', 'IRRF', 'INSS', 'PIS', 'COFINS', 'CSLL']) {
      expect(screen.getByLabelText(r)).toBeTruthy()
    }
  })

  it('oculta a seção Retenções inteira para tipo não-fiscal (Boleto)', () => {
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'Boleto' }) })} />)
    expect(screen.queryByLabelText('ISS')).toBe(null)
    // Seção some por completo — sem título de Retenções e sem dica.
    expect(screen.queryByText(tr('financial.create.section.retencoes'))).toBe(null)
    expect(screen.queryByText(tr('financial.create.retention.disabled'))).toBe(null)
    // As demais seções permanecem.
    expect(screen.getByText(tr('financial.create.section.identificacao'))).toBeTruthy()
    expect(screen.getByText(tr('financial.create.section.pagamento'))).toBeTruthy()
    expect(screen.getByText(tr('financial.create.section.categorizacao'))).toBeTruthy()
  })

  it('DANFE (fiscal, mas sem motor fiscal no regime do cliente) também oculta Retenções', () => {
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'DANFE' }) })} />)
    expect(screen.queryByText(tr('financial.create.section.retencoes'))).toBe(null)
    expect(screen.queryByLabelText('ISS')).toBe(null)
  })

  it('DANFE: Chave de acesso é editável (OCR/manual) e dispara onText(accessKey); demais tipos não exibem', () => {
    const onText = vi.fn()
    const { unmount } = render(<DocumentForm {...baseProps({ fields: fields({ type: 'DANFE' }), onText })} />)
    const chave = screen.getByLabelText(tr('financial.create.field.accessKey')) as HTMLInputElement
    expect(chave).toBeTruthy()
    expect(chave.disabled).toBe(false) // editável; persistência pendente em core-api#115
    fireEvent.change(chave, { target: { value: '3526' } })
    expect(onText).toHaveBeenCalledWith('accessKey', '3526')
    unmount()
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'NFS-e' }) })} />)
    expect(screen.queryByLabelText(tr('financial.create.field.accessKey'))).toBe(null)
  })

  it('mostra a Reforma Tributária (CBS/IBS) para NFS-e e oculta para Boleto', () => {
    const { unmount } = render(<DocumentForm {...baseProps({ fields: fields({ type: 'NFS-e' }) })} />)
    expect(screen.getByText(tr('financial.create.reformaTributaria.label'))).toBeTruthy()
    for (const r of ['CBS', 'IBS Municipal', 'IBS Estadual']) {
      expect(screen.getByLabelText(r)).toBeTruthy()
    }
    unmount()
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'Boleto' }) })} />)
    expect(screen.queryByText(tr('financial.create.reformaTributaria.label'))).toBe(null)
  })

  it('dispara onReformaTributaria ao digitar CBS', () => {
    const onReformaTributaria = vi.fn()
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'NFS-e' }), onReformaTributaria })} />)
    // Campo monetário (acumulador de centavos, sem R$): "100" digitado = 100 centavos → "1,00".
    fireEvent.change(screen.getByLabelText('CBS'), { target: { value: '100' } })
    expect(onReformaTributaria).toHaveBeenCalledWith('cbs', '1,00')
  })

  it('Programa é dropdown editável: lista pela SIGLA e dispara onProgram', () => {
    const onProgram = vi.fn()
    render(
      <DocumentForm
        {...baseProps({
          programOptions: [{ id: 'p1', name: 'Saúde Comunitária', sigla: 'SC' }],
          onProgram,
        })}
      />,
    )
    // Exibe a sigla (não o nome), igual aos outros módulos.
    expect(screen.getByRole('option', { name: 'SC' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText(tr('financial.create.field.programa')), {
      target: { value: 'p1' },
    })
    expect(onProgram).toHaveBeenCalledWith('p1')
  })

  it('chip da categorização: "Ordem de Serviço" p/ OS e "Contrato" p/ CT', () => {
    const contract = {
      ref: 'c1',
      number: '0002/2026',
      isServiceOrder: true,
      centroCusto: 'CC',
      categoria: 'Cat',
      programa: 'Prog',
      planoOrcamentario: '',
      programRef: null,
      budgetPlanRef: null,
    }
    render(<DocumentForm {...baseProps({ contract })} />)
    expect(screen.getByText('Ordem de Serviço')).toBeTruthy()
    cleanup()
    render(<DocumentForm {...baseProps({ contract: { ...contract, isServiceOrder: false } })} />)
    expect(screen.getByText('Contrato')).toBeTruthy()
  })

  it('"Alterar" abre o dropdown e seleciona outro contrato Em Andamento', () => {
    const onSelectContract = vi.fn()
    const contracts = [
      {
        ref: 'c1',
        number: '0001/2026',
        isServiceOrder: false,
        centroCusto: '',
        categoria: '',
        programa: '',
        planoOrcamentario: '',
        programRef: null,
        budgetPlanRef: null,
      },
      {
        ref: 'c2',
        number: 'OS-014/2026',
        isServiceOrder: true,
        centroCusto: '',
        categoria: '',
        programa: '',
        planoOrcamentario: '',
        programRef: null,
        budgetPlanRef: null,
      },
    ]
    render(
      <DocumentForm
        {...baseProps({ contract: contracts[0], contracts, contractPickerOpen: true, onSelectContract })}
      />,
    )
    // O dropdown lista os 2 contratos; clicar no segundo dispara onSelectContract com o ref.
    fireEvent.click(screen.getByText('OS-014/2026'))
    expect(onSelectContract).toHaveBeenCalledWith('c2')
  })

  it('Boleto: campo de código de barras é editável e dispara onText(paymentComplement)', () => {
    const onText = vi.fn()
    render(<DocumentForm {...baseProps({ fields: fields({ paymentMethod: 'Boleto' }), onText })} />)
    const campo = screen.getByLabelText(tr('financial.create.payMethod.boletoLabel'))
    expect((campo as HTMLInputElement).disabled).toBe(false)
    fireEvent.change(campo, { target: { value: '34191' } })
    expect(onText).toHaveBeenCalledWith('paymentComplement', '34191')
  })

  it('Categorização: Centro de Custo é um dropdown REAL (habilitado na criação) e dispara onCostCenter', () => {
    const onCostCenter = vi.fn()
    render(
      <DocumentForm
        {...baseProps({ onCostCenter, centroCustoOptions: [{ value: 'cc1', label: 'CC-002 · Programa' }] })}
      />,
    )
    const cc = screen.getByLabelText(tr('financial.create.field.centroCusto'))
    expect((cc as HTMLSelectElement).disabled).toBe(false)
    fireEvent.change(cc, { target: { value: 'cc1' } })
    expect(onCostCenter).toHaveBeenCalledWith('cc1')
  })

  it('Aprovador (#148) é um dropdown REAL (habilitado na criação) e dispara onApprover', () => {
    const onApprover = vi.fn()
    render(
      <DocumentForm
        {...baseProps({ onApprover, approverOptions: [{ value: 'u1', label: 'Ana Aprovadora' }] })}
      />,
    )
    const ap = screen.getByLabelText(tr('financial.create.pagamento.aprovador'))
    expect((ap as HTMLSelectElement).disabled).toBe(false)
    fireEvent.change(ap, { target: { value: 'u1' } })
    expect(onApprover).toHaveBeenCalledWith('u1')
  })

  it('dispara onText ao digitar o número', () => {
    const onText = vi.fn()
    render(<DocumentForm {...baseProps({ onText })} />)
    fireEvent.change(screen.getByLabelText(tr('financial.create.field.documentNumber')), {
      target: { value: '0847' },
    })
    expect(onText).toHaveBeenCalledWith('documentNumber', '0847')
  })

  it('abre o modal de tipo ao clicar no gatilho', () => {
    const onOpenTypeModal = vi.fn()
    render(<DocumentForm {...baseProps({ onOpenTypeModal })} />)
    fireEvent.click(screen.getByLabelText(tr('financial.create.field.type')))
    expect(onOpenTypeModal).toHaveBeenCalledTimes(1)
  })

  it('abre o modal de pagamento ao clicar no gatilho de forma', () => {
    const onOpenPayModal = vi.fn()
    render(<DocumentForm {...baseProps({ onOpenPayModal })} />)
    fireEvent.click(screen.getByLabelText(tr('financial.create.field.paymentMethod')))
    expect(onOpenPayModal).toHaveBeenCalledTimes(1)
  })

  it('modal de pagamento lista métodos e seleciona (onSelectPayment)', () => {
    const onSelectPayment = vi.fn()
    render(<DocumentForm {...baseProps({ payModalOpen: true, onSelectPayment })} />)
    expect(screen.getByText(tr('financial.create.payMethod.modalTitle'))).toBeTruthy()
    fireEvent.click(screen.getByText(tr('financial.create.payMethod.desc.PIX')))
    expect(onSelectPayment).toHaveBeenCalledWith('PIX')
  })

  it('campo complementar segue a forma: Boleto mostra linha digitável; PIX não', () => {
    const { unmount } = render(
      <DocumentForm {...baseProps({ fields: fields({ paymentMethod: 'Boleto' }) })} />,
    )
    expect(screen.getByLabelText(tr('financial.create.payMethod.boletoLabel'))).toBeTruthy()
    unmount()
    render(<DocumentForm {...baseProps({ fields: fields({ paymentMethod: 'PIX' }) })} />)
    expect(screen.queryByLabelText(tr('financial.create.payMethod.boletoLabel'))).toBe(null)
  })

  it('modal de tipo lista os 7 tipos e seleciona um (onSelectType)', () => {
    const onSelectType = vi.fn()
    // type='' p/ o gatilho mostrar o placeholder (não duplicar um nome de tipo no DOM).
    render(
      <DocumentForm {...baseProps({ fields: fields({ type: '' }), typeModalOpen: true, onSelectType })} />,
    )
    expect(screen.getByText(tr('financial.create.docType.modalTitle'))).toBeTruthy()
    // 6 tipos únicos (Boleto colide com a <option> de forma de pagamento → checado à parte).
    for (const dt of ['NFS-e', 'DANFE', 'RPA', 'Fatura', 'Recibo', 'Imposto']) {
      expect(screen.getByText(dt)).toBeTruthy()
    }
    expect(screen.getAllByText('Boleto').length).toBeGreaterThanOrEqual(2)
    fireEvent.click(screen.getByText('RPA'))
    expect(onSelectType).toHaveBeenCalledWith('RPA')
  })
})
