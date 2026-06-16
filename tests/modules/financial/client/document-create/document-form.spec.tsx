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
  ...over,
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  fields: fields(),
  onType: vi.fn(),
  onPaymentMethod: vi.fn(),
  onText: vi.fn(),
  onRetention: vi.fn(),
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

  it('esconde retenções e mostra a dica para tipo sem retenção (Boleto)', () => {
    render(<DocumentForm {...baseProps({ fields: fields({ type: 'Boleto' }) })} />)
    expect(screen.queryByLabelText('ISS')).toBe(null)
    expect(screen.getByText(tr('financial.create.retention.disabled'))).toBeTruthy()
  })

  it('dispara onText ao digitar o número e onType ao trocar o tipo', () => {
    const onText = vi.fn()
    const onType = vi.fn()
    render(<DocumentForm {...baseProps({ onText, onType })} />)
    fireEvent.change(screen.getByLabelText(tr('financial.create.field.documentNumber')), {
      target: { value: '0847' },
    })
    expect(onText).toHaveBeenCalledWith('documentNumber', '0847')
    fireEvent.change(screen.getByLabelText(tr('financial.create.field.type')), { target: { value: 'RPA' } })
    expect(onType).toHaveBeenCalledWith('RPA')
  })
})
