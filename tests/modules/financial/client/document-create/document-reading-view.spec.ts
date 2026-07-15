/**
 * document-reading.view (Vitest) — mapa `DocumentReading`→patch do form, casamento de fornecedor por CNPJ e
 * precedência CLIENT-VENCE do `applyReadingPatch`. Fixtures SINTÉTICAS (LGPD).
 */
import { describe, it, expect } from 'vitest'

import {
  mapReadingToPatch,
  matchPartnerByTaxId,
} from '#modules/financial/client/document-create/document-reading.view.ts'
import {
  applyReadingPatch,
  type DocumentFormFields,
  type PartnerOption,
} from '#modules/financial/client/document-create/document-form.view.ts'
import type { DocumentReading } from '#modules/financial/client/document-create/reader/document-reading.model.ts'

const baseReading = (over: Partial<DocumentReading> = {}): DocumentReading => ({
  kind: 'NFS-e',
  category: 'service',
  number: '42',
  series: '1',
  competence: '07/2026',
  issueDate: '2026-07-15',
  grossValue: 4000,
  description: 'Servico ficticio',
  accessKey: null,
  supplier: { taxId: '11222333000181', name: 'Prestador Ficticio ME' },
  retentions: { iss: 0, irrf: 150, inss: 0, pis: 65, cofins: 300, csll: 100 },
  reformaTributaria: { cbs: 50, ibsMunicipal: 10, ibsEstadual: 20 },
  productTaxes: null,
  ...over,
})

const emptyFields = (over: Partial<DocumentFormFields> = {}): DocumentFormFields => ({
  type: '',
  documentNumber: '',
  series: '',
  supplierRef: '',
  paymentMethod: '',
  grossValue: '',
  issueDate: '',
  competencia: '',
  dueDate: '',
  description: '',
  discounts: '',
  jurosMulta: '',
  accessKey: '',
  paymentComplement: '',
  contractRef: '',
  programRef: '',
  categoryRef: '',
  subcategoryRef: '',
  costCenterRef: '',
  approverRef: '',
  contaDebitoRef: '',
  centroCusto: '',
  categoria: '',
  planoOrcamentario: '',
  retentions: { iss: '', irrf: '', inss: '', pis: '', cofins: '', csll: '' },
  reformaTributaria: { cbs: '', ibsMunicipal: '', ibsEstadual: '' },
  ...over,
})

describe('mapReadingToPatch', () => {
  it('mapeia identificação + valores em reais mascarados e sinaliza os campos lidos', () => {
    const { patch, ocrKeys } = mapReadingToPatch(baseReading())
    expect(patch.type).toBe('NFS-e')
    expect(patch.documentNumber).toBe('42')
    expect(patch.series).toBe('1')
    expect(patch.competencia).toBe('07/2026')
    expect(patch.issueDate).toBe('2026-07-15')
    expect(patch.grossValue).toBe('4.000,00')
    expect(patch.retentions).toEqual({ irrf: '150,00', pis: '65,00', cofins: '300,00', csll: '100,00' })
    expect(patch.reformaTributaria).toEqual({ cbs: '50,00', ibsMunicipal: '10,00', ibsEstadual: '20,00' })
    // ISS/INSS = 0 → não entram no patch nem acendem o destaque.
    expect(patch.retentions?.iss).toBeUndefined()
    expect(ocrKeys.has('grossValue')).toBe(true)
    expect(ocrKeys.has('irrf')).toBe(true)
    expect(ocrKeys.has('iss')).toBe(false)
  })

  it('NF-e (produto) → tipo DANFE', () => {
    const { patch } = mapReadingToPatch(baseReading({ kind: 'NF-e', category: 'product' }))
    expect(patch.type).toBe('DANFE')
  })
})

describe('matchPartnerByTaxId', () => {
  const partners: readonly PartnerOption[] = [
    { id: 'p-1', name: 'Prestador Ficticio ME', subtitle: '11.222.333/0001-81', kind: 'supplier' },
    { id: 'p-2', name: 'Outro Fornecedor', subtitle: '99.888.777/0001-00', kind: 'supplier' },
  ]

  it('casa o CNPJ ignorando pontuação', () => {
    expect(matchPartnerByTaxId(partners, '11222333000181')).toBe('p-1')
    expect(matchPartnerByTaxId(partners, '11.222.333/0001-81')).toBe('p-1')
  })
  it('sem correspondência → null (não inventa referência)', () => {
    expect(matchPartnerByTaxId(partners, '00000000000000')).toBeNull()
    expect(matchPartnerByTaxId(partners, null)).toBeNull()
  })
})

describe('applyReadingPatch — precedência client-vence', () => {
  it('sobrepõe o valor do backend onde ambos têm o campo, preservando os demais', () => {
    // Rascunho do backend com bruto impreciso + um campo que o leitor NÃO traz (paymentComplement).
    const draft = emptyFields({ grossValue: '1.000,00', documentNumber: '42', paymentComplement: 'boleto-x' })
    const { patch } = mapReadingToPatch(baseReading())
    const merged = applyReadingPatch(draft, patch)
    expect(merged.grossValue).toBe('4.000,00') // cliente vence
    expect(merged.documentNumber).toBe('42')
    expect(merged.paymentComplement).toBe('boleto-x') // preservado (leitor não mexe)
    expect(merged.retentions.irrf).toBe('150,00')
  })
})
