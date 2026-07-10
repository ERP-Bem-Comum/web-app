/**
 * Testes puros (feature 060) do use-case de export CSV do plano: no sucesso nomeia `plano-{id}.csv` e repassa
 * os bytes do core-api; no erro propaga o `Result.err`. O client é injetado (double). Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err, isOk, isErr } from '#shared/primitives/result.ts'
import { createExportBudgetPlanCsv } from '#modules/budget-plans/server/application/export-budget-plan-csv.use-case.ts'

const ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

describe('createExportBudgetPlanCsv', () => {
  it('sucesso → { filename: plano-{id}.csv, content: bytes do core }', async () => {
    const csv = 'ano;total\n2027;1000\n'
    const useCase = createExportBudgetPlanCsv({ client: { generateCsv: () => Promise.resolve(ok(csv)) } })
    const r = await useCase(ID, 'token')
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value.filename, `plano-${ID}.csv`)
      assert.equal(r.value.content, csv)
    }
  })

  it('erro do core → propaga o Result.err (não nomeia arquivo)', async () => {
    const useCase = createExportBudgetPlanCsv({
      client: { generateCsv: () => Promise.resolve(err('budget-plan-not-found')) },
    })
    const r = await useCase(ID, 'token')
    assert.ok(isErr(r))
    if (isErr(r)) assert.equal(r.error, 'budget-plan-not-found')
  })
})
