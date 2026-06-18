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
  dueDate: '',
  description: '',
  retentions: { iss: '', irrf: '', inss: '', pis: '', cofins: '', csll: '' },
  reformaTributaria: { cbs: '', ibsMunicipal: '', ibsEstadual: '' },
  ...over,
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  fields: fields(),
  hydration: { bank: null, contract: null },
  onType: vi.fn(),
  onPaymentMethod: vi.fn(),
  onText: vi.fn(),
  onRetention: vi.fn(),
  onReformaTributaria: vi.fn(),
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

  it('DANFE mostra o campo Chave de acesso (chrome) e os demais tipos não', () => {
    const { unmount } = render(<DocumentForm {...baseProps({ fields: fields({ type: 'DANFE' }) })} />)
    const chave = screen.getByLabelText(tr('financial.create.field.accessKey'))
    expect(chave).toBeTruthy()
    expect((chave as HTMLInputElement).disabled).toBe(true) // chrome até core-api#115
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
