/**
 * Regressão G4: o `POST /:id/scenery` do core devolve a forma de transição (`lifecyclePlanResponseSchema`),
 * com o nome do cenário em **`scenarioName`** (nullable) — NÃO em `name`. O schema antigo exigia `name` e
 * falhava o parse (→ "unexpected" / "Não foi possível concluir a ação"). Este teste fixa o contrato real.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { coreScenerySchema } from '#modules/budget-plans/server/adapters/core-api/budget-plans.schema.ts'

// Corpo REAL do core (lifecyclePlanResponseSchema): campos extras (year/programRef/parentId/totalInCents)
// são tolerados por z.object (strip). O essencial: `scenarioName`, não `name`.
const coreResponse = {
  id: '3eb5a205-275c-4baa-8e1e-20b24689f5ce',
  year: 2026,
  programRef: 'a3e94c03-84b3-4f5e-adf6-17f61d720aa8',
  status: 'RASCUNHO',
  version: '2.2',
  scenarioName: 'Cenário Otimista',
  parentId: '8221effe-de84-4991-9b9e-813c06bc2a4a',
  totalInCents: 0,
}

describe('coreScenerySchema (G4 — contrato do /scenery)', () => {
  it('parseia a resposta REAL do core (com scenarioName + campos extras)', () => {
    const parsed = coreScenerySchema.safeParse(coreResponse)
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.id, coreResponse.id)
      assert.equal(parsed.data.scenarioName, 'Cenário Otimista')
      assert.equal(parsed.data.version, '2.2')
      assert.equal(parsed.data.status, 'RASCUNHO')
    }
  })

  it('aceita scenarioName null (o adapter recai no nome do body)', () => {
    const parsed = coreScenerySchema.safeParse({ ...coreResponse, scenarioName: null })
    assert.equal(parsed.success, true)
    if (parsed.success) assert.equal(parsed.data.scenarioName, null)
  })

  it('rejeita quando falta o essencial (id)', () => {
    const { id: _drop, ...semId } = coreResponse
    assert.equal(coreScenerySchema.safeParse(semId).success, false)
  })
})
