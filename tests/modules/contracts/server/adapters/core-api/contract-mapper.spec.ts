import { describe, it, expect } from 'vitest'

import { apiContractDetailToDomain } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'
import { isOk } from '#shared/primitives/result.ts'

// T004 (019): mapeamento dos campos novos do #32 (classification CT/OS, bloco program, metadados),
// backward-compat (ausência/null) e resiliência D9 (status desconhecido não quebra).
const UUID = '11111111-1111-4111-8111-111111111111'
const PROG = '22222222-2222-4222-8222-222222222222'

const baseRaw = {
  id: UUID,
  sequentialNumber: '1/2026',
  title: 'Contrato',
  objective: 'Objeto',
  originalValue: { cents: 1000 },
  originalPeriod: { kind: 'Fixed' as const, start: '2026-01-01', end: '2026-12-31' },
  amendments: [],
  documents: [],
}

describe('apiContractDetailToDomain — campos #32', () => {
  it('mapeia classification OS→ServiceOrder + bloco program (sigla) + metadados', () => {
    const res = apiContractDetailToDomain({
      ...baseRaw,
      status: 'Pending',
      classification: 'OS',
      programId: PROG,
      program: { id: PROG, snapshot: { name: 'Educação Básica', sigla: 'EDB', programNumber: 3 } },
      categorizacao: 'Operacional',
      centroDeCusto: 'RH',
    })
    expect(isOk(res)).toBe(true)
    if (!isOk(res)) return
    expect(res.value.classification).toBe('ServiceOrder')
    expect(res.value.program).toEqual({ id: PROG, name: 'Educação Básica', sigla: 'EDB' })
    expect(res.value.programId).toBe(PROG)
    expect(res.value.categorizacao).toBe('Operacional')
    expect(res.value.centroDeCusto).toBe('RH')
  })

  it('backward-compat: sem metadados (ausentes/null) → defaults sem quebrar', () => {
    const res = apiContractDetailToDomain({
      ...baseRaw,
      status: 'Pending',
      classification: null,
      programId: null,
      program: null,
      categorizacao: null,
      centroDeCusto: null,
    })
    expect(isOk(res)).toBe(true)
    if (!isOk(res)) return
    expect(res.value.classification).toBe('Contract') // default
    expect(res.value.program).toBeUndefined()
    expect(res.value.programId).toBeUndefined()
    expect(res.value.categorizacao).toBeUndefined()
  })

  it('§1.7: status Cancelled mapeia para Cancelado (cancelamento de contrato Pendente)', () => {
    const res = apiContractDetailToDomain({ ...baseRaw, status: 'Cancelled', endedAt: '2026-06-11' })
    expect(isOk(res)).toBe(true)
    if (!isOk(res)) return
    expect(res.value.status).toBe('Cancelado') // antes degradava p/ 'Finalizado'; agora é status próprio
  })

  it('D9: status REALMENTE desconhecido ainda degrada com segurança p/ Finalizado', () => {
    const res = apiContractDetailToDomain({ ...baseRaw, status: 'Voodoo', endedAt: '2026-06-11' })
    expect(isOk(res)).toBe(true)
    if (!isOk(res)) return
    expect(res.value.status).toBe('Finalizado')
  })
})
