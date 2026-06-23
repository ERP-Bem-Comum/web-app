/**
 * Export CSV de parceiros — helpers puros (node:test). O BFF é um passthrough do `text/csv` que o
 * core-api serializa em `GET /api/v1/{resource}/export`; aqui validamos a montagem da query e o filename.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  partnerExportFilename,
  buildExportQuery,
  collaboratorHistoryFilename,
  parseContentDispositionFilename,
} from '#modules/partners/server/adapters/core-api/core-api-partners-export.ts'

describe('partnerExportFilename', () => {
  it('deriva o nome do arquivo por recurso (igual ao Content-Disposition do core-api)', () => {
    assert.strictEqual(partnerExportFilename('suppliers'), 'suppliers.csv')
    assert.strictEqual(partnerExportFilename('collaborators'), 'collaborators.csv')
    assert.strictEqual(partnerExportFilename('financiers'), 'financiers.csv')
    assert.strictEqual(partnerExportFilename('acts'), 'acts.csv')
  })
})

describe('buildExportQuery', () => {
  it('omite tudo quando não há filtros', () => {
    assert.strictEqual(buildExportQuery({}), '')
  })

  it('serializa search + active (0|1) + categories repetidas', () => {
    const qs = buildExportQuery({ search: 'acme', active: true, categories: ['LIMPEZA', 'TI'] })
    const params = new URLSearchParams(qs)
    assert.strictEqual(params.get('search'), 'acme')
    assert.strictEqual(params.get('active'), '1')
    assert.deepStrictEqual(params.getAll('categories'), ['LIMPEZA', 'TI'])
  })

  it('active=false vira 0; search vazio é omitido', () => {
    const params = new URLSearchParams(buildExportQuery({ search: '', active: false }))
    assert.strictEqual(params.get('active'), '0')
    assert.strictEqual(params.has('search'), false)
  })

  it('type=history serializa ?type=history (export do histórico do grid · #126)', () => {
    const params = new URLSearchParams(buildExportQuery({ type: 'history', search: 'ana' }))
    assert.strictEqual(params.get('type'), 'history')
    assert.strictEqual(params.get('search'), 'ana')
  })
})

describe('collaboratorHistoryFilename', () => {
  it('deriva o fallback do histórico por id (igual ao Content-Disposition do core-api)', () => {
    assert.strictEqual(collaboratorHistoryFilename('abc-123'), 'collaborator-abc-123-history.csv')
  })
})

describe('parseContentDispositionFilename', () => {
  it('retorna undefined quando o header está ausente', () => {
    assert.strictEqual(parseContentDispositionFilename(null), undefined)
  })

  it('extrai filename="..." (com aspas)', () => {
    assert.strictEqual(
      parseContentDispositionFilename('attachment; filename="collaborator-7-history.csv"'),
      'collaborator-7-history.csv',
    )
  })

  it('extrai filename sem aspas', () => {
    assert.strictEqual(
      parseContentDispositionFilename('attachment; filename=collaborator-7-history.csv'),
      'collaborator-7-history.csv',
    )
  })

  it('prioriza e decodifica filename* (RFC 5987) sobre o filename simples', () => {
    const encoded = `colaborador-${encodeURIComponent('é')}.csv`
    const header = ['attachment; filename="fallback.csv"', `filename*=UTF-8''${encoded}`].join('; ')
    assert.strictEqual(parseContentDispositionFilename(header), 'colaborador-é.csv')
  })

  it('retorna undefined quando não há um filename utilizável', () => {
    assert.strictEqual(parseContentDispositionFilename('attachment'), undefined)
  })
})
