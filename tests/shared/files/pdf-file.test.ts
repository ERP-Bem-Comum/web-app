/**
 * isPdfFile — aceitação robusta de PDF na UI (node:test puro). Aceita por MIME OU por extensão,
 * porque File.type é não-confiável (pode vir vazio). Import relativo (alias só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { isPdfFile } from '../../../src/shared/files/pdf-file.ts'

describe('isPdfFile', () => {
  it('aceita por MIME application/pdf', () => {
    assert.equal(isPdfFile({ type: 'application/pdf', name: 'contrato.pdf' }), true)
  })
  it('aceita por extensão quando o MIME vem vazio (caso real do bug)', () => {
    assert.equal(isPdfFile({ type: '', name: 'contrato.pdf' }), true)
    assert.equal(isPdfFile({ type: 'application/octet-stream', name: 'CONTRATO.PDF' }), true)
  })
  it('rejeita não-PDF', () => {
    assert.equal(isPdfFile({ type: 'image/png', name: 'foto.png' }), false)
    assert.equal(isPdfFile({ type: '', name: 'planilha.xlsx' }), false)
  })
})
