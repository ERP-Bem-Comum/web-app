/**
 * buildContractsCsv (node:test puro) — CSV legível da listagem (export "todos os contratos").
 * Import relativo (alias só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildContractsCsv } from '../../../../../src/modules/contracts/client/contract-list/contract-list.view-model.ts'
import type { ContractRow } from '../../../../../src/modules/contracts/client/domain/types.ts'

const mk = (over: Partial<ContractRow>): ContractRow =>
  ({
    contractType: 'Fornecedor',
    contractCode: '123/2026',
    object: 'Serviço X',
    contractStatus: 'Em Andamento',
    contractPeriod: { start: '2026-01-01', end: '2026-12-31' },
    currentValue: 1000,
    totalValue: 1000,
    children: [],
    ...over,
  }) as unknown as ContractRow

const HEADER = 'Número;Contratado;CNPJ/CPF;Objeto;Tipo;Programa;Valor Atual;Saldo;Início;Fim;Status'

describe('buildContractsCsv', () => {
  it('primeira linha é o cabeçalho com as colunas de negócio', () => {
    const csv = buildContractsCsv([])
    assert.equal(csv, HEADER)
  })

  it('uma linha por contrato (cabeçalho + N) com contratado, objeto e status', () => {
    const csv = buildContractsCsv([
      mk({ supplier: { name: 'Acme Ltda', cnpj: '12345678000190' } as never }),
      mk({ supplier: { name: 'Beta SA', cnpj: '98765432000110' } as never, object: 'Outro' }),
    ])
    const lines = csv.split('\n')
    assert.equal(lines.length, 3)
    assert.ok(lines[1]?.includes('Acme Ltda'))
    assert.ok(lines[1]?.includes('Serviço X'))
    assert.ok(lines[1]?.includes('EM ANDAMENTO'))
    assert.ok(lines[2]?.includes('Beta SA'))
  })

  it('escapa aspas dobrando-as (RFC 4180)', () => {
    const csv = buildContractsCsv([mk({ object: 'Serviço "especial"' })])
    assert.ok(csv.includes('"Serviço ""especial"""'))
  })

  it('contratado ausente vira travessão; documento ausente vira vazio', () => {
    const csv = buildContractsCsv([mk({ supplier: undefined })])
    const cells = csv.split('\n')[1]?.split(';') ?? []
    assert.equal(cells[1], '"—"')
    assert.equal(cells[2], '""')
  })
})
