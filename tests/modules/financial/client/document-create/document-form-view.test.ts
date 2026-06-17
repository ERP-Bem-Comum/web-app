/**
 * document-form.view (puro, node:test) — preview do líquido, gating de retenção, agregação CSRF, build do
 * input. Números do mock: NFS-e R$ 10.000 com ISS 350 / IRRF 150 / INSS 1.100 / PIS 65 / COFINS 300 /
 * CSLL 100 → líquido R$ 7.935,00; CSRF (PIS+COFINS+CSLL) = R$ 465,00.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  retentionsEnabledFor,
  netPreviewCents,
  titulosPrevistos,
  canSubmit,
  canSaveDraft,
  buildCreateInput,
  buildDraftInput,
  filterPartners,
  partnerKindTag,
  editLocksFor,
  isEditableStatus,
  hydrateFieldsFromDetail,
  canSaveEdit,
  buildAdjustInput,
  type DocumentFormFields,
  type PartnerOption,
} from '../../../../../src/modules/financial/client/document-create/document-form.view.ts'
import type { DocumentDetail } from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const partners: readonly PartnerOption[] = [
  { id: '1', name: 'Bambu Educação', subtitle: '37.364.305/0001-92', kind: 'supplier' },
  { id: '2', name: 'Fundo Verde', subtitle: '11.222.333/0001-44', kind: 'financier' },
  { id: '3', name: 'Acordo Regional', subtitle: 'OS-014/2026', kind: 'act' },
]

const base: DocumentFormFields = {
  type: 'NFS-e',
  documentNumber: '0847',
  series: 'A1',
  supplierRef: 's-1',
  paymentMethod: 'PIX',
  grossValue: 'R$ 10.000,00',
  dueDate: '2026-06-10',
  description: 'Consultoria',
  retentions: { iss: '350', irrf: '150', inss: '1100', pis: '65', cofins: '300', csll: '100' },
}

describe('retentionsEnabledFor', () => {
  it('só NFS-e e RPA', () => {
    assert.equal(retentionsEnabledFor('NFS-e'), true)
    assert.equal(retentionsEnabledFor('RPA'), true)
    assert.equal(retentionsEnabledFor('Boleto'), false)
    assert.equal(retentionsEnabledFor(''), false)
  })
})

describe('netPreviewCents', () => {
  it('líquido = bruto − Σretenções', () => {
    assert.equal(netPreviewCents(base), '793500')
  })
  it('tipo sem retenção: líquido = bruto (retenções ignoradas)', () => {
    assert.equal(netPreviewCents({ ...base, type: 'Boleto' }), '1000000')
  })
})

describe('titulosPrevistos', () => {
  it('pai + filhos com CSRF agregado', () => {
    const t = titulosPrevistos(base)
    assert.equal(t.length, 5)
    assert.deepEqual(t[0], { kind: 'Pai', valueCents: '793500' })
    const csrf = t.find((x) => x.kind === 'CSRF')
    assert.equal(csrf?.valueCents, '46500') // 6500 + 30000 + 10000
  })
  it('tipo sem retenção: só o pai', () => {
    const t = titulosPrevistos({ ...base, type: 'Boleto' })
    assert.equal(t.length, 1)
    assert.equal(t[0]?.kind, 'Pai')
  })
})

describe('canSubmit', () => {
  it('válido com os obrigatórios + líquido > 0', () => {
    assert.equal(canSubmit(base), true)
  })
  it('falha sem tipo / sem fornecedor / líquido ≤ 0', () => {
    assert.equal(canSubmit({ ...base, type: '' }), false)
    assert.equal(canSubmit({ ...base, supplierRef: '' }), false)
    // retenções > bruto → líquido negativo
    assert.equal(canSubmit({ ...base, grossValue: '100' }), false)
  })
})

describe('buildCreateInput', () => {
  it('agrega CSRF e converte para centavos', () => {
    const input = buildCreateInput(base)
    assert.notEqual(input, null)
    if (input !== null) {
      assert.equal(input.grossValueCents, '1000000')
      assert.equal(input.retentions.length, 4) // ISS, IRRF, INSS, CSRF
      const csrf = input.retentions.find((r) => r.type === 'CSRF')
      assert.equal(csrf?.valueCents, '46500')
      assert.equal(input.registeredTaxes.length, 0)
      assert.equal(input.type, 'NFS-e')
    }
  })
  it('null quando não pode submeter', () => {
    assert.equal(buildCreateInput({ ...base, documentNumber: '' }), null)
  })
})

describe('filterPartners', () => {
  it('vazio → devolve todos', () => {
    assert.equal(filterPartners(partners, '   ').length, 3)
  })
  it('casa por nome (case-insensitive)', () => {
    const r = filterPartners(partners, 'bambu')
    assert.equal(r.length, 1)
    assert.equal(r[0]?.id, '1')
  })
  it('casa por CNPJ ignorando pontuação', () => {
    const r = filterPartners(partners, '11222333')
    assert.equal(r.length, 1)
    assert.equal(r[0]?.kind, 'financier')
  })
  it('casa por nº do ato (subtitle textual)', () => {
    const r = filterPartners(partners, 'OS-014')
    assert.equal(r.length, 1)
    assert.equal(r[0]?.kind, 'act')
  })
  it('casa por CNPJ alfanumérico parcial ignorando pontuação/caixa (Serpro/2026)', () => {
    const alnum: readonly PartnerOption[] = [
      { id: '9', name: 'Empresa Nova', subtitle: '12.ABC.345/01DE-35', kind: 'supplier' },
    ]
    assert.equal(filterPartners(alnum, 'abc345').length, 1)
    assert.equal(filterPartners(alnum, 'ABC345').length, 1)
  })
  it('sem match → vazio', () => {
    assert.equal(filterPartners(partners, 'inexistente').length, 0)
  })
})

describe('canSaveDraft / buildDraftInput', () => {
  it('rascunho NÃO exige vencimento (diferente do submit)', () => {
    const semVenc = { ...base, dueDate: '' }
    assert.equal(canSubmit(semVenc), false)
    assert.equal(canSaveDraft(semVenc), true)
  })
  it('rascunho exige o mínimo: tipo, número, fornecedor, forma, bruto', () => {
    assert.equal(canSaveDraft({ ...base, supplierRef: '' }), false)
    assert.equal(canSaveDraft({ ...base, grossValue: '' }), false)
  })
  it('buildDraftInput marca asDraft e omite dueDate vazio', () => {
    const input = buildDraftInput({ ...base, dueDate: '' })
    assert.notEqual(input, null)
    if (input !== null) {
      assert.equal(input.asDraft, true)
      assert.equal(input.dueDate, undefined)
    }
  })
})

describe('partnerKindTag', () => {
  it('mapeia o tipo para a chave i18n', () => {
    assert.equal(partnerKindTag('supplier'), 'financial.create.partner.kind.supplier')
    assert.equal(partnerKindTag('act'), 'financial.create.partner.kind.act')
  })
})

// ── Modo edição ("Editar pagamento") ──────────────────────────────────────────
const detail: DocumentDetail = {
  id: 'doc-1',
  status: 'Aberto',
  type: 'NFS-e',
  documentNumber: '0847',
  supplierRef: 's-1',
  paymentMethod: 'PIX',
  grossValueCents: '1000000',
  netValueCents: '793500',
  dueDate: '2026-06-10',
  description: 'Consultoria',
  version: 3,
  payables: [
    { id: 'p0', kind: 'Parent', retentionType: null, valueCents: '793500', status: 'Aberto' },
    { id: 'p1', kind: 'Child', retentionType: 'ISS', valueCents: '35000', status: 'Aberto' },
    { id: 'p2', kind: 'Child', retentionType: 'IRRF', valueCents: '15000', status: 'Aberto' },
    { id: 'p3', kind: 'Child', retentionType: 'CSRF', valueCents: '25500', status: 'Aberto' },
  ],
}

describe('editLocksFor / isEditableStatus', () => {
  it('Aberto: imutáveis travados; ajustáveis liberados', () => {
    const l = editLocksFor('Aberto')
    assert.equal(l.type, true)
    assert.equal(l.supplier, true)
    assert.equal(l.paymentMethod, true)
    assert.equal(l.retentions, true)
    assert.equal(l.grossValue, false)
    assert.equal(l.dueDate, false)
    assert.equal(l.description, false)
    assert.equal(isEditableStatus('Aberto'), true)
  })
  it('≠ Aberto: tudo travado (somente-consulta)', () => {
    const l = editLocksFor('Pago')
    assert.equal(l.grossValue, true)
    assert.equal(l.dueDate, true)
    assert.equal(l.description, true)
    assert.equal(isEditableStatus('Pago'), false)
    assert.equal(isEditableStatus('Aprovado'), false)
  })
})

describe('hydrateFieldsFromDetail', () => {
  it('mapeia detalhe → campos (bruto formatado, ISS/IRRF dos filhos; série vazia)', () => {
    const f = hydrateFieldsFromDetail(detail)
    assert.equal(f.type, 'NFS-e')
    assert.equal(f.documentNumber, '0847')
    assert.equal(f.series, '')
    assert.equal(f.supplierRef, 's-1')
    assert.equal(f.paymentMethod, 'PIX')
    assert.equal(f.dueDate, '2026-06-10')
    assert.equal(f.description, 'Consultoria')
    assert.match(f.grossValue, /10\.000,00/)
    assert.match(f.retentions.iss, /350,00/)
    assert.match(f.retentions.irrf, /150,00/)
    assert.equal(f.retentions.inss, '')
    // CSRF (agregado) é hidratado em `pis` p/ o líquido/títulos baterem (read-only na edição).
    assert.match(f.retentions.pis, /255,00/)
  })
})

describe('canSaveEdit / buildAdjustInput', () => {
  const fields = hydrateFieldsFromDetail(detail)

  it('canSaveEdit: bruto > 0, vencimento set e líquido (bruto − retenções) > 0', () => {
    assert.equal(canSaveEdit(fields, detail), true)
    assert.equal(canSaveEdit({ ...fields, dueDate: '' }, detail), false)
    assert.equal(canSaveEdit({ ...fields, grossValue: '' }, detail), false)
    // bruto menor que as retenções (350+150=500 → 400 reais) → líquido ≤ 0
    assert.equal(canSaveEdit({ ...fields, grossValue: 'R$ 400,00' }, detail), false)
  })

  it('buildAdjustInput: só campos ajustáveis + version; OMITE retentions', () => {
    const input = buildAdjustInput(fields, detail)
    assert.notEqual(input, null)
    assert.equal(input?.id, 'doc-1')
    assert.equal(input?.version, 3)
    assert.equal(input?.grossValueCents, '1000000')
    assert.equal(input?.dueDate, '2026-06-10')
    assert.equal(input?.description, 'Consultoria')
    assert.equal('retentions' in (input ?? {}), false)
  })

  it('buildAdjustInput: null quando não pode salvar', () => {
    assert.equal(buildAdjustInput({ ...fields, dueDate: '' }, detail), null)
  })
})
