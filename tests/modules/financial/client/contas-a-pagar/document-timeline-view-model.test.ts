/**
 * document-timeline.view-model (node:test) — derivação PURA da trilha (Histórico do drawer). Cobre o mapa
 * evento→apresentação (rótulo/ícone/tom), o rótulo de campo conhecido×cru e a montagem das linhas.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  timelineEventPresentation,
  isTimelineFieldKnown,
  resolveTimelineTitle,
  deriveTimelineRows,
  deriveReconciledTitleRows,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/document-timeline.view-model.ts'
import type { TimelineTargetPayable } from '../../../../../src/modules/financial/client/contas-a-pagar-list/document-timeline.view-model.ts'
import type { DocumentTimelineEntry } from '../../../../../src/modules/financial/client/data/model/document.model.ts'

describe('timelineEventPresentation', () => {
  it('mapeia cada evento p/ rótulo + tom de status', () => {
    assert.deepEqual(timelineEventPresentation('PayableManuallyPaid'), {
      labelTag: 'financial.timeline.event.paid',
      tone: 'paid',
    })
    assert.equal(timelineEventPresentation('PayableApproved').tone, 'approved')
    assert.equal(timelineEventPresentation('DocumentSaved').tone, 'open') // lançado → Aberto
    assert.equal(timelineEventPresentation('DocumentDraftSaved').tone, 'draft')
    assert.equal(timelineEventPresentation('PayableReconciled').tone, 'reconciled') // roxo (#406)
  })
})

describe('resolveTimelineTitle', () => {
  const payables: readonly TimelineTargetPayable[] = [
    { id: 'pai', isParent: true, retentionType: null, isReconciled: false },
    { id: 'iss', isParent: false, retentionType: 'ISS', isReconciled: false },
  ]
  it('pai / evento de documento → tipo do doc (NFS-e); filho → retenção (ISS)', () => {
    assert.equal(resolveTimelineTitle('Document', 'x', payables, 'NFS-e'), 'NFS-e')
    assert.equal(resolveTimelineTitle('Payable', 'pai', payables, 'NFS-e'), 'NFS-e')
    assert.equal(resolveTimelineTitle('Payable', 'iss', payables, 'NFS-e'), 'ISS')
  })
  it('payableId desconhecido → tipo do doc (fail-safe = pai)', () => {
    assert.equal(resolveTimelineTitle('Payable', 'sumido', payables, 'NFS-e'), 'NFS-e')
  })
})

describe('deriveReconciledTitleRows', () => {
  const payables: readonly TimelineTargetPayable[] = [
    { id: 'pai', isParent: true, retentionType: null, isReconciled: false },
    { id: 'iss', isParent: false, retentionType: 'ISS', isReconciled: true },
    { id: 'irrf', isParent: false, retentionType: 'IRRF', isReconciled: true },
  ]
  it('sintetiza nó Conciliado só p/ títulos conciliados, sem data conhecida', () => {
    const rows = deriveReconciledTitleRows(payables, [])
    assert.equal(rows.length, 2) // iss + irrf (pai não conciliado fica de fora)
    assert.equal(rows[0]?.eventType, 'PayableReconciled')
    assert.equal(rows[0]?.presentation.tone, 'reconciled')
    assert.equal(rows[0]?.dateLabel, '—')
    assert.equal(rows[0]?.targetId, 'iss')
  })
  it('NÃO duplica quando já existe o evento real (PayableReconciled) do #406', () => {
    const existing = [{ eventType: 'PayableReconciled', targetId: 'iss' }] as unknown as Parameters<
      typeof deriveReconciledTitleRows
    >[1]
    const rows = deriveReconciledTitleRows(payables, existing)
    assert.equal(rows.length, 1) // só irrf; iss já tem o evento real
    assert.equal(rows[0]?.targetId, 'irrf')
  })
})

describe('isTimelineFieldKnown', () => {
  it('campo útil é conhecido; técnico não', () => {
    assert.equal(isTimelineFieldKnown('dueDate'), true)
    assert.equal(isTimelineFieldKnown('status'), true)
    assert.equal(isTimelineFieldKnown('supplierRef'), false) // técnico → descartado do diff
    assert.equal(isTimelineFieldKnown('documentNumber'), false)
  })
})

describe('deriveTimelineRows', () => {
  const entries: readonly DocumentTimelineEntry[] = [
    {
      eventType: 'DocumentSaved',
      targetKind: 'Document',
      targetId: 'd1',
      occurredAt: '2026-07-10T19:40:00.000Z',
      isSystem: false,
      actorName: 'Maria Silva',
      changes: [
        { field: 'dueDate', before: '2026-07-10', after: '2026-08-15T00:00:00.000Z' },
        { field: 'value', before: '3700', after: '400000' },
        { field: 'status', before: 'Open', after: 'Approved' },
        { field: 'supplierRef', before: null, after: 'f6e0-uuid' }, // técnico → descartado
      ],
    },
    {
      eventType: 'DocumentDraftSaved',
      targetKind: 'Document',
      targetId: 'd1',
      occurredAt: '2026-07-10T19:20:00.000Z',
      isSystem: true,
      actorName: null,
      changes: [],
    },
  ]

  it('deriva apresentação, descarta campo técnico e formata data/dinheiro/status', () => {
    const rows = deriveTimelineRows(entries)
    assert.equal(rows.length, 2)
    assert.equal(rows[0]?.presentation.labelTag, 'financial.timeline.event.saved')
    // supplierRef (técnico) descartado → 3 pílulas (dueDate, value, status), não 4.
    assert.equal(rows[0]?.changes.length, 3)
    assert.equal(rows[0]?.changes[0]?.labelTag, 'financial.timeline.field.dueDate')
    assert.equal(rows[0]?.changes[0]?.after, '15/08/2026') // ISO datetime → só a data
    assert.ok(rows[0]?.changes[1]?.after.includes('4.000,00')) // cents → moeda (R$ 4.000,00)
    assert.equal(rows[0]?.changes[2]?.before, 'Aberto') // status EN→PT
    assert.equal(rows[0]?.changes[2]?.after, 'Aprovado')
    assert.equal(rows[0]?.actorName, 'Maria Silva')
    assert.equal(rows[0]?.isSystem, false)
    assert.equal(rows[1]?.isSystem, true) // sistema
    assert.equal(rows[1]?.changes.length, 0)
  })

  it('key é estável e única por índice', () => {
    const rows = deriveTimelineRows(entries)
    assert.notEqual(rows[0]?.key, rows[1]?.key)
  })

  it('ordena por data DECRESCENTE (mais recente no topo), mesmo se a entrada vier fora de ordem', () => {
    const rows = deriveTimelineRows([...entries].reverse()) // entra ascendente
    assert.equal(rows[0]?.eventType, 'DocumentSaved') // 19:40 (mais recente) no topo
    assert.equal(rows[1]?.eventType, 'DocumentDraftSaved') // 19:20 abaixo
  })
})
