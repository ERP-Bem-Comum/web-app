/**
 * document-form.view (puro, node:test) — preview do líquido, gating de retenção, agregação CSRF, build do
 * input. Números do mock: NFS-e R$ 10.000 com ISS 350 / IRRF 150 / INSS 1.100 / PIS 65 / COFINS 300 /
 * CSLL 100 → líquido R$ 7.935,00; CSRF (PIS+COFINS+CSLL) = R$ 465,00.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  retentionsEnabledFor,
  reformaTributariaEnabledFor,
  issAllowedFor,
  allowedRetentionKeysFor,
  netPreviewCents,
  titulosPrevistos,
  canSubmit,
  canSaveDraft,
  buildCreateInput,
  buildDraftInput,
  buildRegisteredTaxInputs,
  retentionRatePct,
  DOCUMENT_TYPE_META,
  fiscalClassTag,
  docTypeDescriptionTag,
  PAYMENT_METHOD_META,
  paymentComplementaryOf,
  filterPartners,
  partnerKindTag,
  isPartnerPF,
  maskDocument,
  editLocksFor,
  isEditableStatus,
  hydrateFieldsFromDetail,
  canSaveEdit,
  buildAdjustInput,
  ocrToFormPatch,
  EMPTY_REFORMA_TRIBUTARIA,
  type DocumentFormFields,
  type PartnerOption,
} from '../../../../../src/modules/financial/client/document-create/document-form.view.ts'
import type { DocumentDetail } from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const partners: readonly PartnerOption[] = [
  { id: '1', name: 'Bambu Educação', subtitle: '37.364.305/0001-92', kind: 'supplier' },
  { id: '2', name: 'Fundo Verde', subtitle: '11.222.333/0001-44', kind: 'financier' },
  { id: '3', name: 'Acordo Regional', subtitle: 'OS-014/2026', kind: 'act' },
  { id: '4', name: 'Maria Souza', subtitle: '14396412002', kind: 'collaborator' },
]

const base: DocumentFormFields = {
  type: 'NFS-e',
  documentNumber: '0847',
  series: 'A1',
  supplierRef: 's-1',
  paymentMethod: 'PIX',
  grossValue: 'R$ 10.000,00',
  issueDate: '',
  dueDate: '2026-06-10',
  description: 'Consultoria',
  discounts: '',
  jurosMulta: '',
  accessKey: '',
  paymentComplement: '',
  contractRef: '',
  programRef: '',
  categoryRef: '',
  costCenterRef: '',
  approverRef: '',
  contaDebitoRef: '',
  centroCusto: '',
  categoria: '',
  subcategoria: '',
  planoOrcamentario: '',
  retentions: { iss: '350', irrf: '150', inss: '1100', pis: '65', cofins: '300', csll: '100' },
  reformaTributaria: EMPTY_REFORMA_TRIBUTARIA,
}

// NFS-e com Reforma Tributária preenchida (CBS/IBS) — só registro de valor.
const comReforma: DocumentFormFields = {
  ...base,
  reformaTributaria: { cbs: '100', ibsMunicipal: '50', ibsEstadual: '50' },
}

describe('retentionsEnabledFor', () => {
  it('só NFS-e e RPA', () => {
    assert.equal(retentionsEnabledFor('NFS-e'), true)
    assert.equal(retentionsEnabledFor('RPA'), true)
    assert.equal(retentionsEnabledFor('Boleto'), false)
    assert.equal(retentionsEnabledFor(''), false)
  })
})

describe('issAllowedFor / allowedRetentionKeysFor (ISS em NFS-e e RPA)', () => {
  it('ISS em NFS-e e RPA (a UI exibe; o backend ainda gateia RPA — ver issue)', () => {
    assert.equal(issAllowedFor('NFS-e'), true)
    assert.equal(issAllowedFor('RPA'), true)
    assert.equal(issAllowedFor('Boleto'), false)
  })
  it('NFS-e e RPA exibem as 6 chaves (com ISS); demais nenhuma', () => {
    assert.deepEqual(allowedRetentionKeysFor('NFS-e'), ['iss', 'irrf', 'inss', 'pis', 'cofins', 'csll'])
    assert.deepEqual(allowedRetentionKeysFor('RPA'), ['iss', 'irrf', 'inss', 'pis', 'cofins', 'csll'])
    assert.deepEqual(allowedRetentionKeysFor('Boleto'), [])
  })
})

describe('netPreviewCents', () => {
  it('líquido = bruto − Σretenções', () => {
    assert.equal(netPreviewCents(base), '793500')
  })
  it('tipo sem retenção: líquido = bruto (retenções ignoradas)', () => {
    assert.equal(netPreviewCents({ ...base, type: 'Boleto' }), '1000000')
  })
  it('RPA agora conta a ISS no líquido (mesmo cálculo da NFS-e)', () => {
    assert.equal(netPreviewCents({ ...base, type: 'RPA' }), '793500')
  })
  it('Descontos SUBTRAEM e Juros/Multa SOMAM ao líquido (espelha o core-api)', () => {
    // base = 793500 (bruto − retenções). − R$100,00 desconto + R$50,00 juros/multa = 793500 − 10000 + 5000.
    assert.equal(netPreviewCents({ ...base, discounts: 'R$ 100,00', jurosMulta: 'R$ 50,00' }), '788500')
  })
})

describe('buildCreateInput — RPA inclui ISS (a UI exibe; backend libera via issue)', () => {
  it('RPA com ISS preenchida: o input inclui ISS (ISS/IRRF/INSS/CSRF)', () => {
    const input = buildCreateInput({ ...base, type: 'RPA' })
    assert.notEqual(input, null)
    const tipos = input?.retentions.map((r) => r.type) ?? []
    assert.equal(tipos.includes('ISS'), true)
    assert.deepEqual([...tipos].sort(), ['CSRF', 'INSS', 'IRRF', 'ISS'])
  })
})

describe('buildCreateInput — Descontos / Juros·Multa', () => {
  it('emite discountsCents e interestCents (Juros/Multa → interestCents) quando > 0', () => {
    const input = buildCreateInput({ ...base, discounts: 'R$ 100,00', jurosMulta: 'R$ 50,00' })
    assert.equal(input?.discountsCents, '10000')
    assert.equal(input?.interestCents, '5000')
  })
  it('omite os campos quando zerados', () => {
    const input = buildCreateInput(base)
    assert.equal(input?.discountsCents, undefined)
    assert.equal(input?.interestCents, undefined)
  })
})

describe('buildCreateInput — Categorização (categoryRef/costCenterRef · 020/#200/#147)', () => {
  it('envia categoryRef e costCenterRef quando escolhidos; omite quando vazios', () => {
    const cat = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
    const cc = 'f1ca7e90-0000-4000-8000-000000000099'
    const withRefs = buildCreateInput({ ...base, categoryRef: cat, costCenterRef: cc })
    assert.equal(withRefs?.categoryRef, cat)
    assert.equal(withRefs?.costCenterRef, cc)
    const empty = buildCreateInput(base)
    assert.equal(empty?.categoryRef, undefined)
    assert.equal(empty?.costCenterRef, undefined)
  })
  it('envia approverRef quando escolhido; omite quando vazio (#148)', () => {
    const ap = 'a1b2c3d4-0000-4000-8000-000000000148'
    assert.equal(buildCreateInput({ ...base, approverRef: ap })?.approverRef, ap)
    assert.equal(buildCreateInput(base)?.approverRef, undefined)
  })
  it('envia contaDebitoRef (conta-débito) quando escolhido; omite quando vazio (#197)', () => {
    const acc = 'a1b2c3d4-0000-4000-8000-000000000197'
    assert.equal(buildCreateInput({ ...base, contaDebitoRef: acc })?.contaDebitoRef, acc)
    assert.equal(buildCreateInput(base)?.contaDebitoRef, undefined)
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
  it('#163: envia issueDate quando preenchida; undefined quando vazia', () => {
    const com = buildCreateInput({ ...base, issueDate: '2026-06-01' })
    assert.equal(com?.issueDate, '2026-06-01')
    const sem = buildCreateInput({ ...base, issueDate: '' })
    assert.equal(sem?.issueDate, undefined)
  })
})

// ── Reforma Tributária (CBS/IBS) — registro de valor apenas (sem filho, sem retenção, sem abater líquido) ──
describe('reformaTributariaEnabledFor', () => {
  it('só NFS-e e RPA', () => {
    assert.equal(reformaTributariaEnabledFor('NFS-e'), true)
    assert.equal(reformaTributariaEnabledFor('RPA'), true)
    assert.equal(reformaTributariaEnabledFor('Boleto'), false)
    assert.equal(reformaTributariaEnabledFor(''), false)
  })
})

describe('reforma tributária NÃO altera líquido nem gera filho', () => {
  it('líquido idêntico ao sem reforma (value-only)', () => {
    assert.equal(netPreviewCents(comReforma), netPreviewCents(base))
    assert.equal(netPreviewCents(comReforma), '793500')
  })
  it('títulos previstos não ganham filho de CBS/IBS', () => {
    const t = titulosPrevistos(comReforma)
    assert.equal(t.length, titulosPrevistos(base).length)
    assert.equal(
      t.some((x) => x.kind !== 'Pai' && !['ISS', 'IRRF', 'INSS', 'CSRF'].includes(x.kind)),
      false,
    )
  })
})

describe('buildRegisteredTaxInputs / buildCreateInput envia registeredTaxes', () => {
  it('mapeia CBS/IBS > 0 com base = bruto', () => {
    const rt = buildRegisteredTaxInputs(comReforma)
    assert.equal(rt.length, 3)
    const cbs = rt.find((r) => r.type === 'CBS')
    assert.equal(cbs?.valueCents, '10000')
    assert.equal(cbs?.baseCents, '1000000')
    assert.equal(rt.find((r) => r.type === 'IBS_Municipal')?.valueCents, '5000')
    assert.equal(rt.find((r) => r.type === 'IBS_Estadual')?.valueCents, '5000')
  })
  it('buildCreateInput inclui os registeredTaxes (e retenções inalteradas)', () => {
    const input = buildCreateInput(comReforma)
    assert.notEqual(input, null)
    if (input !== null) {
      assert.equal(input.registeredTaxes.length, 3)
      assert.equal(input.retentions.length, 4)
    }
  })
  it('tipo sem reforma tributária (Boleto): registeredTaxes vazio', () => {
    assert.equal(buildRegisteredTaxInputs({ ...comReforma, type: 'Boleto' }).length, 0)
  })
})

describe('retentionRatePct (alíquota derivada na Composição)', () => {
  it('valor ÷ bruto formatado em % pt-BR', () => {
    assert.equal(retentionRatePct(base, 'iss'), '3,5%') // 350 / 10.000
    assert.equal(retentionRatePct(base, 'inss'), '11%') // 1.100 / 10.000
    assert.equal(retentionRatePct(base, 'pis'), '0,65%') // 65 / 10.000
  })
  it("'' quando bruto ou valor ≤ 0", () => {
    assert.equal(retentionRatePct({ ...base, grossValue: '' }, 'iss'), '')
    assert.equal(retentionRatePct({ ...base, retentions: { ...base.retentions, iss: '' } }, 'iss'), '')
  })
})

describe('DOCUMENT_TYPE_META (modal de tipo)', () => {
  it('tem os 7 tipos do enum com classe fiscal correta', () => {
    assert.equal(DOCUMENT_TYPE_META.length, 7)
    const cls = (t: string): string => DOCUMENT_TYPE_META.find((m) => m.type === t)?.fiscalClass ?? '?'
    assert.equal(cls('NFS-e'), 'fiscal')
    assert.equal(cls('DANFE'), 'fiscal')
    assert.equal(cls('RPA'), 'fiscal')
    assert.equal(cls('Fatura'), 'partial')
    assert.equal(cls('Boleto'), 'non-fiscal')
    assert.equal(cls('Recibo'), 'non-fiscal')
    assert.equal(cls('Imposto'), 'non-fiscal')
  })
  it('iniciais (2 letras) derivadas do tipo', () => {
    const ini = (t: string): string => DOCUMENT_TYPE_META.find((m) => m.type === t)?.initials ?? '?'
    assert.equal(ini('NFS-e'), 'NF')
    assert.equal(ini('RPA'), 'RP')
    assert.equal(ini('Imposto'), 'IM')
  })
  it('tags i18n de classe e descrição', () => {
    assert.equal(fiscalClassTag('non-fiscal'), 'financial.create.docType.class.non-fiscal')
    assert.equal(docTypeDescriptionTag('NFS-e'), 'financial.create.docType.desc.NFS-e')
  })
})

describe('PAYMENT_METHOD_META / paymentComplementaryOf', () => {
  it('8 métodos do enum com o campo complementar correto', () => {
    assert.equal(PAYMENT_METHOD_META.length, 8)
    assert.equal(paymentComplementaryOf('PIX'), 'pix')
    assert.equal(paymentComplementaryOf('Boleto'), 'boleto')
    assert.equal(paymentComplementaryOf('CartaoCorporativo'), 'card')
    assert.equal(paymentComplementaryOf('TED'), 'bank')
    assert.equal(paymentComplementaryOf('TransferenciaBancaria'), 'bank')
    assert.equal(paymentComplementaryOf('GuiaRecolhimento'), 'none')
    assert.equal(paymentComplementaryOf('Cambio'), 'currency')
    assert.equal(paymentComplementaryOf('Outro'), 'free')
    assert.equal(paymentComplementaryOf(''), 'none')
  })
})

describe('filterPartners', () => {
  it('vazio → devolve todos', () => {
    assert.equal(filterPartners(partners, '   ').length, 4)
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
  it('casa colaborador (PF) por CPF no subtítulo (ignora pontuação)', () => {
    const r = filterPartners(partners, '143.964.120-02')
    assert.equal(r.length, 1)
    assert.equal(r[0]?.kind, 'collaborator')
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
    assert.equal(partnerKindTag('collaborator'), 'financial.create.partner.kind.collaborator')
  })
})

describe('isPartnerPF / maskDocument (favorecido PF=colaborador exibe CPF; PJ exibe CNPJ)', () => {
  it('colaborador é PF; demais tipos são PJ', () => {
    assert.equal(isPartnerPF('collaborator'), true)
    assert.equal(isPartnerPF('supplier'), false)
    assert.equal(isPartnerPF('financier'), false)
    assert.equal(isPartnerPF('act'), false)
  })
  it('mascara CPF (11) e CNPJ (14) conforme o conteúdo', () => {
    assert.equal(maskDocument('14396412002'), '143.964.120-02')
    assert.equal(maskDocument('37364305000192'), '37.364.305/0001-92')
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
  issueDate: '2026-06-01',
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
  it('#163: hidrata a emissão do detalhe (issueDate)', () => {
    assert.equal(hydrateFieldsFromDetail(detail).issueDate, '2026-06-01')
    assert.equal(hydrateFieldsFromDetail({ ...detail, issueDate: null }).issueDate, '')
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

describe('ocrToFormPatch (costura OCR → form)', () => {
  it('mapeia só os campos extraídos (cents→reais, dueDate ISO); patch parcial', () => {
    const patch = ocrToFormPatch({
      type: 'NFS-e',
      documentNumber: '0847',
      grossValueCents: '160000',
      dueDate: '2026-07-10',
    })
    assert.equal(patch.type, 'NFS-e')
    assert.equal(patch.documentNumber, '0847')
    assert.equal(patch.grossValue, '1.600,00')
    assert.equal(patch.dueDate, '2026-07-10')
    // #163 — não veio issueDate → não entra no patch
    assert.equal('issueDate' in patch, false)
    // não veio série/descrição/retenção → não entram no patch
    assert.equal('series' in patch, false)
    assert.equal('retentions' in patch, false)
  })

  it('retenções: CSRF agrega em pis (mesma convenção da hidratação)', () => {
    const patch = ocrToFormPatch({
      retentions: [
        { type: 'IRRF', valueCents: '15000' },
        { type: 'CSRF', valueCents: '4650' },
      ],
    })
    assert.equal(patch.retentions?.irrf, '150,00')
    assert.equal(patch.retentions?.pis, '46,50')
    assert.equal(patch.retentions?.iss, '')
  })

  it('#163: mapeia issueDate quando o OCR a extrai', () => {
    assert.equal(ocrToFormPatch({ issueDate: '2026-06-01' }).issueDate, '2026-06-01')
  })

  it('vazio → patch vazio', () => {
    assert.deepEqual(ocrToFormPatch({}), {})
  })
})
