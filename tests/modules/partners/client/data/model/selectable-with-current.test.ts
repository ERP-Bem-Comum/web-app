/**
 * `selectableWithCurrent` (spec 126) — node:test PURO. Seletor que esconde valores do enum mantém o valor
 * ATUAL quando ele é um dos escondidos (dado gravado antes da opção sair).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_OPTIONS,
  selectableWithCurrent,
} from '#modules/partners/client/data/model/collaborator.model.ts'

describe('selectableWithCurrent — Escolaridade', () => {
  it('as opções do seletor não têm EDUCACAO_INFANTIL; o enum canônico ainda tem (gráfico do Equipe)', () => {
    assert.ok(!(EDUCATION_LEVEL_OPTIONS as readonly string[]).includes('EDUCACAO_INFANTIL'))
    assert.ok((EDUCATION_LEVELS as readonly string[]).includes('EDUCACAO_INFANTIL'))
  })

  it('vazio ou valor oferecido → só as opções', () => {
    assert.deepEqual(
      selectableWithCurrent(EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, ''),
      EDUCATION_LEVEL_OPTIONS,
    )
    assert.deepEqual(
      selectableWithCurrent(EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, 'MESTRADO'),
      EDUCATION_LEVEL_OPTIONS,
    )
  })

  it('valor gravado escondido → entra no fim', () => {
    const r = selectableWithCurrent(EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, 'EDUCACAO_INFANTIL')
    assert.equal(r.at(-1), 'EDUCACAO_INFANTIL')
    assert.equal(r.length, EDUCATION_LEVEL_OPTIONS.length + 1)
  })

  it('valor fora do enum inteiro → não entra', () => {
    assert.deepEqual(
      selectableWithCurrent(EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, 'QUALQUER'),
      EDUCATION_LEVEL_OPTIONS,
    )
  })
})
