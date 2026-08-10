/**
 * ocr-panel-resize.view (node:test · puro) — clamp da largura da coluna OCR + parse do valor persistido.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  OCR_DEFAULT_PX,
  OCR_MAX_PX,
  OCR_MIN_PX,
  clampOcrWidth,
  parseSavedOcrWidth,
} from '../../../../../src/modules/financial/client/document-create/ocr-panel-resize.view.ts'

describe('clampOcrWidth', () => {
  it('mantém dentro de [MIN, MAX] e arredonda', () => {
    assert.equal(clampOcrWidth(OCR_MIN_PX - 100), OCR_MIN_PX) // abaixo do mínimo → mínimo
    assert.equal(clampOcrWidth(OCR_MAX_PX + 100), OCR_MAX_PX) // acima do máximo → máximo
    assert.equal(clampOcrWidth(420.7), 421) // arredonda p/ inteiro
    assert.equal(clampOcrWidth(OCR_DEFAULT_PX), OCR_DEFAULT_PX) // dentro → inalterado
  })
})

describe('parseSavedOcrWidth', () => {
  it('ausente/ vazio → padrão', () => {
    assert.equal(parseSavedOcrWidth(null), OCR_DEFAULT_PX)
    assert.equal(parseSavedOcrWidth(''), OCR_DEFAULT_PX)
  })
  it('inválido → padrão; válido → clampado', () => {
    assert.equal(parseSavedOcrWidth('abc'), OCR_DEFAULT_PX)
    assert.equal(parseSavedOcrWidth('500'), 500)
    assert.equal(parseSavedOcrWidth('99999'), OCR_MAX_PX) // clampa o exagero salvo
    assert.equal(parseSavedOcrWidth('10'), OCR_MIN_PX)
  })
})
