/**
 * ComposicaoSidebar (Vitest/jsdom) — view burra: Composição/Líquido/Títulos. Cobre os campos editáveis
 * de Descontos e Juros·Multa (só quando `editable`) e os callbacks onText. Recebe tudo por props.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { ComposicaoSidebar } from '#modules/financial/client/document-create/components/composicao-sidebar.component.tsx'
import type { DocumentFormFields } from '#modules/financial/client/document-create/document-form.view.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

const fields = (over: Partial<DocumentFormFields> = {}): DocumentFormFields => ({
  type: 'NFS-e',
  documentNumber: '0847',
  series: '',
  supplierRef: 's-1',
  paymentMethod: 'PIX',
  grossValue: 'R$ 1.000,00',
  issueDate: '',
  dueDate: '2026-06-10',
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

describe('ComposicaoSidebar — Descontos / Juros·Multa', () => {
  it('editable: Descontos e Juros/Multa são inputs e disparam onText (com máscara monetária)', () => {
    const onText = vi.fn()
    render(<ComposicaoSidebar fields={fields()} supplierName="ACME" editable onText={onText} />)
    const desc = screen.getByLabelText(tr('financial.create.sidebar.descontos')) as HTMLInputElement
    const juros = screen.getByLabelText(tr('financial.create.sidebar.jurosMulta')) as HTMLInputElement
    expect(desc.tagName).toBe('INPUT')
    expect(juros.tagName).toBe('INPUT')
    // "10000" digitado = 10000 centavos → "100,00" (acumulador sem R$).
    fireEvent.change(desc, { target: { value: '10000' } })
    expect(onText).toHaveBeenCalledWith('discounts', '100,00')
    fireEvent.change(juros, { target: { value: '5000' } })
    expect(onText).toHaveBeenCalledWith('jurosMulta', '50,00')
  })

  it('não-editable (consulta): Descontos/Juros viram texto, não inputs', () => {
    render(
      <ComposicaoSidebar
        fields={fields({ discounts: '100,00' })}
        supplierName="ACME"
        editable={false}
        onText={vi.fn()}
      />,
    )
    const desc = screen.getByText('R$ 100,00')
    expect(desc).toBeTruthy()
    expect(desc.tagName).not.toBe('INPUT')
  })
})
