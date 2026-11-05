/**
 * spec 125 / core-api#1057 — editar documento APROVADO: travas por forma, formas bloqueadas, quando o modo
 * abre (só com títulos em Aprovado), o que muda e o que vai no PATCH. Também a hidratação da categorização
 * no modo edição/consulta.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  approvedBlockedMethods,
  approvedEditChanges,
  approvedEditLocksFor,
  approvedLockReasonTag,
  buildApprovedAdjustInput,
  editLocksFor,
  hydrateFieldsFromDetail,
  isApprovedEditable,
  isApprovedEditableStatus,
  methodChangedAfterApproval,
  type ApprovedEditContext,
} from '../../../../../src/modules/financial/client/document-create/document-form.view.ts'
import type { DocumentDetail } from '../../../../../src/modules/financial/client/data/model/document.model.ts'

const BARCODE = '34191.79001 01043.510047 91020.150008 5 95860000010000'

const approved: DocumentDetail = {
  id: 'doc-9',
  status: 'Aprovado',
  type: 'Fatura',
  documentNumber: '77',
  supplierRef: 's-1',
  paymentMethod: 'Boleto',
  paymentDetail: BARCODE,
  competencia: '2026-09',
  grossValueCents: '500000',
  netValueCents: '500000',
  issueDate: '2026-09-01',
  dueDate: '2026-10-20',
  description: 'Fatura de setembro',
  budgetPlanRef: 'plan-1',
  categoryRef: 'cat-1',
  subcategoryRef: 'sub-1',
  costCenterRef: 'cc-1',
  programRef: 'prog-1',
  version: 7,
  payables: [
    {
      id: 'p0',
      kind: 'Parent',
      retentionType: null,
      valueCents: '500000',
      status: 'Aprovado',
      paymentMethodChangedAt: null,
    },
  ],
  attachment: null,
}

const ctxOf = (d: DocumentDetail, methodAlreadyChanged = false): ApprovedEditContext => ({
  originalMethod: d.paymentMethod,
  originalDetail: d.paymentDetail,
  methodAlreadyChanged,
})

describe('spec 125 · hydrateFieldsFromDetail — categorização', () => {
  it('edição/consulta abrem com a categorização GRAVADA (o GET /:id já a devolve)', () => {
    const f = hydrateFieldsFromDetail(approved)
    assert.equal(f.programRef, 'prog-1')
    assert.equal(f.planoOrcamentario, 'plan-1')
    assert.equal(f.costCenterRef, 'cc-1')
    assert.equal(f.categoryRef, 'cat-1')
    assert.equal(f.subcategoryRef, 'sub-1')
  })
  it('Rascunho segue vazio (a herança do contrato preenche a cascata lá)', () => {
    const f = hydrateFieldsFromDetail({ ...approved, status: 'Rascunho' })
    assert.equal(f.programRef, '')
    assert.equal(f.planoOrcamentario, '')
    assert.equal(f.categoryRef, '')
  })
})

describe('spec 125 · travas', () => {
  it('só o Aprovado entra no modo', () => {
    assert.equal(isApprovedEditableStatus('Aprovado'), true)
    assert.equal(isApprovedEditableStatus('Aberto'), false)
    assert.equal(isApprovedEditableStatus('Transmitido'), false)
  })
  it('título transmitido ou pago → o modo não abre (somente consulta)', () => {
    assert.equal(isApprovedEditable(approved), true)
    for (const status of ['Transmitido', 'Pago'] as const) {
      const progressed = { ...approved, payables: approved.payables.map((p) => ({ ...p, status })) }
      assert.equal(isApprovedEditable(progressed), false, status)
    }
  })
  it('a marca de troca vem do título pai (paymentMethodChangedAt)', () => {
    assert.equal(methodChangedAfterApproval(approved), false)
    const changed = {
      ...approved,
      payables: approved.payables.map((p) => ({ ...p, paymentMethodChangedAt: '2026-10-23T12:00:00.000Z' })),
    }
    assert.equal(methodChangedAfterApproval(changed), true)
  })
  it('abre descrição, forma e categorização; fornecedor/valor/emissão/vencimento/impostos travados', () => {
    const l = approvedEditLocksFor(ctxOf(approved), 'Boleto')
    assert.equal(l.description, false)
    assert.equal(l.paymentMethod, false)
    assert.equal(l.categorization, false)
    for (const k of [
      'type',
      'numberSeries',
      'supplier',
      'grossValue',
      'issueDate',
      'competencia',
      'dueDate',
      'retentions',
    ] as const) {
      assert.equal(l[k], true, k)
    }
  })
  it('Boleto que continua Boleto: código de barras travado, com motivo', () => {
    const ctx = ctxOf(approved)
    assert.equal(approvedEditLocksFor(ctx, 'Boleto').paymentComplement, true)
    assert.equal(
      approvedLockReasonTag(ctx, 'Boleto').paymentComplement,
      'financial.edit.approved.barcodeLocked',
    )
  })
  it('Boleto → PIX: complemento da forma nova destravado', () => {
    const ctx = ctxOf(approved)
    assert.equal(approvedEditLocksFor(ctx, 'PIX').paymentComplement, false)
    assert.equal(approvedLockReasonTag(ctx, 'PIX').paymentComplement, null)
  })
  it('Guia SEM código pode recebê-lo; Guia com código, não', () => {
    const empty = ctxOf({ ...approved, paymentMethod: 'GuiaRecolhimento', paymentDetail: null })
    assert.equal(approvedEditLocksFor(empty, 'GuiaRecolhimento').paymentComplement, false)
    const filled = ctxOf({ ...approved, paymentMethod: 'GuiaRecolhimento', paymentDetail: '8581' })
    assert.equal(approvedEditLocksFor(filled, 'GuiaRecolhimento').paymentComplement, true)
  })
  it('forma já trocada uma vez → forma travada, com motivo', () => {
    const ctx = ctxOf(approved, true)
    assert.equal(approvedEditLocksFor(ctx, 'PIX').paymentMethod, true)
    assert.equal(
      approvedLockReasonTag(ctx, 'PIX').paymentMethod,
      'financial.edit.approved.methodAlreadyChanged',
    )
  })
  it('não volta para código de barras: bloqueia Boleto/Guia, salvo a própria forma gravada', () => {
    const fromPix = approvedBlockedMethods(ctxOf({ ...approved, paymentMethod: 'PIX', paymentDetail: null }))
    assert.deepEqual([...fromPix].sort(), ['Boleto', 'GuiaRecolhimento'])
    const fromBoleto = approvedBlockedMethods(ctxOf(approved))
    assert.deepEqual([...fromBoleto], ['GuiaRecolhimento'])
  })
  it('o ajuste do Aberto não recategoriza e mantém o complemento editável (#284)', () => {
    const l = editLocksFor('Aberto')
    assert.equal(l.categorization, true)
    assert.equal(l.paymentComplement, false)
    assert.equal(editLocksFor('Pago').paymentComplement, true)
  })
})

describe('spec 125 · o que mudou e o que salva', () => {
  const base = hydrateFieldsFromDetail(approved)

  it('nada mudou → nada a salvar', () => {
    const c = approvedEditChanges(base, approved)
    assert.deepEqual(c, { description: false, paymentMethod: false, paymentDetail: false, taxonomy: false })
    assert.equal(buildApprovedAdjustInput(base, approved), null)
  })
  it('só a descrição → PATCH com version e a descrição', () => {
    const input = buildApprovedAdjustInput(
      { ...base, description: '  Fatura de setembro (ajustada) ' },
      approved,
    )
    assert.deepEqual(input, { id: 'doc-9', version: 7, description: 'Fatura de setembro (ajustada)' })
  })
  it('apagar a descrição → null (limpa)', () => {
    assert.deepEqual(buildApprovedAdjustInput({ ...base, description: '' }, approved), {
      id: 'doc-9',
      version: 7,
      description: null,
    })
  })
  it('só a forma → ativa o salvar: PATCH com a forma nova e o complemento limpo', () => {
    const pix = { ...base, paymentMethod: 'PIX' as const, paymentComplement: '' }
    assert.deepEqual(buildApprovedAdjustInput(pix, approved), {
      id: 'doc-9',
      version: 7,
      paymentMethod: 'PIX',
      paymentDetail: null,
    })
  })
  it('só a categorização → ativa o salvar: PATCH com o caminho inteiro', () => {
    const recat = { ...base, categoryRef: 'cat-2', subcategoryRef: 'sub-2' }
    assert.deepEqual(buildApprovedAdjustInput(recat, approved), {
      id: 'doc-9',
      version: 7,
      taxonomy: {
        programRef: 'prog-1',
        budgetPlanRef: 'plan-1',
        costCenterRef: 'cc-1',
        categoryRef: 'cat-2',
        subcategoryRef: 'sub-2',
      },
    })
  })
  it('categorização pela metade (cascata limpou a subcategoria) → não salva', () => {
    const half = { ...base, categoryRef: 'cat-2', subcategoryRef: '' }
    assert.equal(approvedEditChanges(half, approved).taxonomy, true)
    assert.equal(buildApprovedAdjustInput(half, approved), null)
  })
  it('descrição + forma + categorização juntas → um PATCH só', () => {
    const all = {
      ...base,
      description: 'Pago por Pix',
      paymentMethod: 'PIX' as const,
      paymentComplement: '',
      categoryRef: 'cat-2',
      subcategoryRef: 'sub-2',
    }
    const input = buildApprovedAdjustInput(all, approved)
    assert.equal(input?.description, 'Pago por Pix')
    assert.equal(input?.paymentMethod, 'PIX')
    assert.equal(input?.taxonomy?.subcategoryRef, 'sub-2')
  })
  it('Guia sem código recebendo o código → só o complemento vai, sem trocar a forma', () => {
    const guia = { ...approved, paymentMethod: 'GuiaRecolhimento' as const, paymentDetail: null }
    const fields = { ...hydrateFieldsFromDetail(guia), paymentComplement: '8581' }
    assert.deepEqual(buildApprovedAdjustInput(fields, guia), {
      id: 'doc-9',
      version: 7,
      paymentDetail: '8581',
    })
  })
})
