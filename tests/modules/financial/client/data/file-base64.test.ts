/**
 * file-base64 (puro, node:test) — decode base64 → bytes/File p/ o comprovante-fonte (core-api#568). `atob`
 * e `File` são globais no runtime (Node 20+/browser). Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { base64ToBytes, base64ToFile } from '../../../../../src/modules/financial/client/data/file-base64.ts'

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
