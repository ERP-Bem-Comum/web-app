/**
 * Validação de borda do anexo de documento assinado (feature 017) — PURA, sem I/O.
 * TDD: cobre magic bytes %PDF, tamanho ≤20 MiB, data de assinatura válida/não-futura, sanitização do nome.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { validateSignedDocument } from '#modules/contracts/server/adapters/attach-signed-document.validation.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const NOW = new Date('2026-06-08T12:00:00.000Z')
const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
const pdfBytes = (extra = 0): Uint8Array => {
  const head = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34] // "%PDF-1.4"
  return new Uint8Array([...head, ...new Array<number>(extra).fill(0x20)])
}

describe('validateSignedDocument', () => {
  it('PDF válido + data passada → ok (bytes, fileName, signedAt)', () => {
    const r = validateSignedDocument(
      { fileBase64: b64(pdfBytes()), fileName: 'contrato.pdf', signedAt: '2026-06-01' },
      NOW,
    )
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.fileName, 'contrato.pdf')
      assert.equal(r.value.bytes[0], 0x25)
      assert.equal(r.value.signedAt instanceof Date, true)
    }
  })

  it('arquivo não-PDF (sem magic %PDF) → invalid-pdf', () => {
    const r = validateSignedDocument(
      { fileBase64: b64(new Uint8Array([0x68, 0x69])), fileName: 'x.pdf', signedAt: '2026-06-01' },
      NOW,
    )
    assert.equal(isErr(r) && r.error === 'invalid-pdf', true)
  })

  it('base64 vazia → invalid-pdf', () => {
    const r = validateSignedDocument({ fileBase64: '', fileName: 'x.pdf', signedAt: '2026-06-01' }, NOW)
    assert.equal(isErr(r) && r.error === 'invalid-pdf', true)
  })

  it('arquivo acima de 20 MiB → file-too-large', () => {
    const big = new Uint8Array(20 * 1024 * 1024 + 1)
    big[0] = 0x25 // %  (irrelevante: tamanho é checado antes do magic)
    const r = validateSignedDocument({ fileBase64: b64(big), fileName: 'x.pdf', signedAt: '2026-06-01' }, NOW)
    assert.equal(isErr(r) && r.error === 'file-too-large', true)
  })

  it('data de assinatura futura → invalid-signed-at', () => {
    const r = validateSignedDocument(
      { fileBase64: b64(pdfBytes()), fileName: 'x.pdf', signedAt: '2026-12-31' },
      NOW,
    )
    assert.equal(isErr(r) && r.error === 'invalid-signed-at', true)
  })

  it('data de assinatura inválida → invalid-signed-at', () => {
    const r = validateSignedDocument(
      { fileBase64: b64(pdfBytes()), fileName: 'x.pdf', signedAt: 'não-é-data' },
      NOW,
    )
    assert.equal(isErr(r) && r.error === 'invalid-signed-at', true)
  })

  it('nome com separadores de caminho → sanitizado (sem path-sep)', () => {
    const r = validateSignedDocument(
      { fileBase64: b64(pdfBytes()), fileName: 'a/b:c*.pdf', signedAt: '2026-06-01' },
      NOW,
    )
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(/[/\\:*?"<>|]/.test(r.value.fileName), false)
  })
})
