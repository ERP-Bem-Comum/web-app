/**
 * Use-case do Fluxo de Caixa (#590) — `createGetCashflowReport` (node:test, PURO, client fake injetado). Cobre:
 * (1) composição feliz: payables (Slice A) + chart (Slice B) + fan-out do eixo de Centro de Custo;
 * (2) fan-out: uma chamada `/cashflow?costCenterId` por CC, soma dos totais, ordena DESC por realizado, e
 *     DESCARTA CC sem movimento (0/0) ou cujo fetch falhou;
 * (3) propagação de erro: falha na árvore OU na série → err (não compõe);
 * (4) degradação graciosa: falha no catálogo de Centros de Custo → byCostCenter [] (o relatório NÃO cai).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { ok, err, isOk, isErr } from '#shared/primitives/result.ts'
import { createGetCashflowReport } from '#modules/reports/server/application/reports.use-cases.ts'
import type { ReportsClient } from '#modules/reports/server/application/reports.use-cases.ts'
import type { CashflowRow } from '#modules/reports/server/domain/reports.io.ts'

const TOKEN = 'tok'
/** Resolve síncrono (fakes sem `async` — evita `require-await` sem `await` real). */
const P = <T>(v: T): Promise<T> => Promise.resolve(v)
const row = (realizedCents: number, expectedCents: number): CashflowRow => ({
  categoryRef: null,
  categoryName: null,
  subcategoryRef: null,
  subcategoryName: null,
  realizedCents,
  expectedCents,
})

/**
 * Client fake: só as 3 portas que o use-case toca (o resto lança se chamado — garante que o compositor não
 * usa outras). `perCc` mapeia costCenterId → payables (ausente = []); sem costCenterId = a árvore geral.
 */
type Overrides = Partial<Pick<ReportsClient, 'getCashflow' | 'getCashflowChart' | 'listCostCenters'>>
const fakeClient = (o: Overrides): ReportsClient =>
  new Proxy(o as ReportsClient, {
    get(target, prop) {
      const v = target[prop as keyof ReportsClient]
      if (v !== undefined) return v
      return () => {
        throw new Error(`porta não esperada: ${String(prop)}`)
      }
    },
  })

describe('createGetCashflowReport — composição + fan-out do eixo de Centro de Custo', () => {
  it('compõe payables + chart + byCostCenter (fan-out), ordena DESC e descarta CC zerado', async () => {
    const perCc: Record<string, readonly CashflowRow[]> = {
      a: [row(100, 200)],
      b: [row(300, 400)],
      z: [], // sem movimento → descartado
    }
    const client = fakeClient({
      getCashflow: (filter) =>
        P(
          filter.costCenterId === undefined
            ? ok({ payables: [row(400, 600)], receivables: [] })
            : ok({ payables: perCc[filter.costCenterId] ?? [], receivables: [] }),
        ),
      getCashflowChart: () => P(ok([{ ...row(400, 600), dueMonth: '2026-01' }])),
      listCostCenters: () =>
        P(
          ok([
            { id: 'a', name: 'Alpha' },
            { id: 'b', name: 'Beta' },
            { id: 'z', name: 'Zero' },
          ]),
        ),
    })

    const r = await createGetCashflowReport({ client })({}, TOKEN)
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.payables.length, 1)
    assert.equal(r.value.chart.length, 1)
    // Beta (300) antes de Alpha (100); Zero descartado.
    assert.deepEqual(
      r.value.byCostCenter.map((c) => c.name),
      ['Beta', 'Alpha'],
    )
    assert.deepEqual(r.value.byCostCenter[0], {
      ref: 'b',
      name: 'Beta',
      realizedCents: 300,
      expectedCents: 400,
    })
  })

  it('falha na árvore (Slice A) → propaga o erro (não compõe)', async () => {
    const client = fakeClient({
      getCashflow: () => P(err('server')),
      getCashflowChart: () => P(ok([])),
      listCostCenters: () => P(ok([])),
    })
    const r = await createGetCashflowReport({ client })({}, TOKEN)
    assert.ok(isErr(r))
  })

  it('falha na série (Slice B) → propaga o erro', async () => {
    const client = fakeClient({
      getCashflow: () => P(ok({ payables: [], receivables: [] })),
      getCashflowChart: () => P(err('connectivity')),
      listCostCenters: () => P(ok([])),
    })
    const r = await createGetCashflowReport({ client })({}, TOKEN)
    assert.ok(isErr(r))
    if (isErr(r)) assert.equal(r.error, 'connectivity')
  })

  it('falha no catálogo de CC → degrada gracioso (byCostCenter []), relatório NÃO cai', async () => {
    const client = fakeClient({
      getCashflow: () => P(ok({ payables: [row(1, 2)], receivables: [] })),
      getCashflowChart: () => P(ok([{ ...row(1, 2), dueMonth: '2026-01' }])),
      listCostCenters: () => P(err('forbidden')), // ex.: falta `reference:read`
    })
    const r = await createGetCashflowReport({ client })({}, TOKEN)
    assert.ok(isOk(r))
    if (isOk(r)) assert.deepEqual(r.value.byCostCenter, [])
  })

  it('CC cujo fetch do fan-out falha é descartado (não derruba o relatório)', async () => {
    const client = fakeClient({
      getCashflow: (filter) =>
        P(filter.costCenterId === 'boom' ? err('server') : ok({ payables: [row(9, 9)], receivables: [] })),
      getCashflowChart: () => P(ok([])),
      listCostCenters: () =>
        P(
          ok([
            { id: 'boom', name: 'Explode' },
            { id: 'ok', name: 'Bom' },
          ]),
        ),
    })
    const r = await createGetCashflowReport({ client })({}, TOKEN)
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(
      r.value.byCostCenter.map((c) => c.name),
      ['Bom'],
    )
  })
})
