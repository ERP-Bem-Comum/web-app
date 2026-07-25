/**
 * file-base64 (puro, node:test) — decode base64 → bytes/File p/ o comprovante-fonte (core-api#568). `atob`
 * e `File` são globais no runtime (Node 20+/browser). Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  base64ToBytes,
  base64ToFile,
  fileToSourceFileInput,
} from '../../../../../src/modules/financial/client/data/file-base64.ts'

describe('base64ToBytes', () => {
  it('decodifica base64 → bytes (ASCII conhecido)', () => {
    // "hi" = 0x68 0x69; base64("hi") = "aGk=".
    const bytes = base64ToBytes('aGk=')
    assert.deepEqual([...bytes], [0x68, 0x69])
  })

  it('base64 vazia → 0 bytes', () => {
    assert.equal(base64ToBytes('').length, 0)
  })

  it('preserva bytes binários (não-ASCII: 0x00 0xff)', () => {
    // base64 de [0x00, 0xff] = "AP8=".
    const bytes = base64ToBytes('AP8=')
    assert.deepEqual([...bytes], [0x00, 0xff])
  })
})

describe('base64ToFile', () => {
  it('monta um File com nome, type e bytes corretos', async () => {
    const file = base64ToFile('aGk=', 'nota.xml', 'text/xml')
    assert.equal(file.name, 'nota.xml')
    assert.equal(file.type, 'text/xml')
    assert.equal(file.size, 2)
    assert.equal(await file.text(), 'hi')
  })
})

describe('fileToSourceFileInput (#577)', () => {
  it('PDF por File.type → mimeType application/pdf + base64 dos bytes', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'nota.pdf', { type: 'application/pdf' }))
    assert.deepEqual(sf, { fileName: 'nota.pdf', mimeType: 'application/pdf', base64: 'aGk=' })
  })

  it('XML por File.type (text/xml)', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'nota.xml', { type: 'text/xml' }))
    assert.equal(sf?.mimeType, 'text/xml')
  })

  it('application/xml por File.type', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'n.xml', { type: 'application/xml' }))
    assert.equal(sf?.mimeType, 'application/xml')
  })

  it('type vazio → resolve pela EXTENSÃO .pdf (lição do MIME quebrado)', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'NOTA.PDF', { type: '' }))
    assert.equal(sf?.mimeType, 'application/pdf')
  })

  it('type vazio → resolve pela EXTENSÃO .xml', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'nota.XML', { type: '' }))
    assert.equal(sf?.mimeType, 'text/xml')
  })

  it('fora da allowlist (nem pdf nem xml) → null (documento salvo sem anexo)', async () => {
    const sf = await fileToSourceFileInput(new File(['hi'], 'foto.png', { type: 'image/png' }))
    assert.equal(sf, null)
  })
})
