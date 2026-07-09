/**
 * Validação de borda da ingestão por OCR (core-api#62) — PURA, sem I/O. Cobre: allowlist de mimeType (pdf/xml),
 * base64 vazia/round-trip, tamanho ≤20 MiB e sanitização do nome. Erros como valor (§II).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  validateIngestDocument,
  INGEST_MIME_ALLOWLIST,
} from '#modules/financial/server/adapters/ingest-document.validation.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
const pdfBytes = (extra = 0): Uint8Array => {
  const head = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34] // "%PDF-1.4"
  return new Uint8Array([...head, ...new Array<number>(extra).fill(0x20)])
}

describe('validateIngestDocument', () => {
  it('PDF válido + mime da allowlist → ok (bytes decodificados, nome, mime)', () => {
    const bytes = pdfBytes()
    const r = validateIngestDocument({
      dataBase64: b64(bytes),
      fileName: 'nota.pdf',
      mimeType: 'application/pdf',
    })
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.fileName, 'nota.pdf')
      assert.equal(r.value.mimeType, 'application/pdf')
      // round-trip: os bytes decodificados batem com a origem
      assert.equal(r.value.bytes[0], 0x25)
      assert.equal(r.value.bytes.length, bytes.length)
    }
  })

  it('XML (text/xml e application/xml) é aceito pela allowlist', () => {
    for (const mimeType of ['text/xml', 'application/xml'] as const) {
      const r = validateIngestDocument({
        dataBase64: b64(new Uint8Array([0x3c, 0x3f, 0x78, 0x6d, 0x6c])), // "<?xml"
        fileName: 'nota.xml',
        mimeType,
      })
      assert.equal(isOk(r), true)
    }
  })

  it('mime fora da allowlist → invalid-mime (não decodifica)', () => {
    const r = validateIngestDocument({
      dataBase64: b64(pdfBytes()),
      fileName: 'x.png',
      mimeType: 'image/png',
    })
    assert.equal(isErr(r) && r.error === 'invalid-mime', true)
  })

  it('base64 vazia → invalid-file', () => {
    const r = validateIngestDocument({ dataBase64: '', fileName: 'x.pdf', mimeType: 'application/pdf' })
    assert.equal(isErr(r) && r.error === 'invalid-file', true)
  })

  it('acima de 20 MiB → file-too-large', () => {
    const big = new Uint8Array(20 * 1024 * 1024 + 1)
    const r = validateIngestDocument({
      dataBase64: b64(big),
      fileName: 'x.pdf',
      mimeType: 'application/pdf',
    })
    assert.equal(isErr(r) && r.error === 'file-too-large', true)
  })

  it('nome com separadores de caminho → sanitizado (sem path-sep)', () => {
    const r = validateIngestDocument({
      dataBase64: b64(pdfBytes()),
      fileName: 'a/b:c*.pdf',
      mimeType: 'application/pdf',
    })
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(/[/\\:*?"<>|]/.test(r.value.fileName), false)
  })

  it('a allowlist é exatamente pdf/xml (contrato #62)', () => {
    assert.deepEqual([...INGEST_MIME_ALLOWLIST], ['application/pdf', 'text/xml', 'application/xml'])
  })
})
