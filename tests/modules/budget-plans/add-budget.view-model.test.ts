/**
 * Modal "Adicionar Orçamento" (#394) — rede obrigatória e bloqueio de rede já orçada (por REF/chave natural).
 *
 * ── Estado + Município (legado V1) ── O orçamento é de um estado OU de um município (o município pertence a
 * um estado via `uf`). O modal separa Estado (UF) e Município (do estado escolhido); o binding resolve a REF
 * efetiva (`addBudgetRefFor`) e a passa ao `validateAddBudget`. Estados/municípios vêm do CATÁLOGO
 * (/budget-plans/options = ativos em "Estados e Municípios"), não das redes do plano.
 *
 * ── Sem valor (core-api#458) ── O campo "Valor do orçamento" saiu: o total da Rede é DERIVADO dos lançamentos.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyAddBudgetForm,
  validateAddBudget,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'
import {
  addBudgetEstadoOptions,
  addBudgetMunicipioOptions,
  addBudgetRefFor,
  type CatalogNetwork,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

const redes: readonly CatalogNetwork[] = [
  { ref: 'CE', name: 'Ceará', kind: 'state', uf: 'CE' },
  { ref: 'MG', name: 'Minas Gerais', kind: 'state', uf: 'MG' },
  { ref: '2304400', name: 'Caucaia', kind: 'municipality', uf: 'CE' },
  { ref: '3100203', name: 'Açucena', kind: 'municipality', uf: 'MG' },
]

describe('validateAddBudget (recebe a ref já resolvida)', () => {
  it('ref null → estado-required', () => {
    assert.equal(validateAddBudget(null, []), 'estado-required')
  })
  it('rede já orçada (por ref) → estado-duplicate', () => {
    assert.equal(validateAddBudget('CE', ['CE']), 'estado-duplicate')
  })
  it('rede nova → sem erro', () => {
    assert.equal(validateAddBudget('CE', ['AC']), null)
  })
  it('duplicidade é por REF exata — "CE" não colide com "CEA"', () => {
    assert.equal(validateAddBudget('CE', ['CEA', 'AC']), null)
  })
  it('o form nasce com estado e município vazios', () => {
    assert.deepEqual(emptyAddBudgetForm(), { estado: '', municipio: '' })
  })
})

describe('opções do modal — Estado × Município (só estados no Estado; cidades no Município)', () => {
  it('Estado = uma opção por UF (nome do estado), SEM municípios misturados', () => {
    assert.deepEqual(addBudgetEstadoOptions(redes), [
      { value: 'CE', label: 'Ceará' },
      { value: 'MG', label: 'Minas Gerais' },
    ])
  })
  it('Município = só os do estado escolhido', () => {
    assert.deepEqual(addBudgetMunicipioOptions(redes, 'CE'), [{ value: '2304400', label: 'Caucaia' }])
    assert.deepEqual(addBudgetMunicipioOptions(redes, 'MG'), [{ value: '3100203', label: 'Açucena' }])
  })
  it('sem UF escolhida → sem municípios', () => {
    assert.deepEqual(addBudgetMunicipioOptions(redes, ''), [])
  })
  it('município sem estado-rede ativo → UF entra no Estado com a sigla', () => {
    const soMunicipio: readonly CatalogNetwork[] = [
      { ref: '2304400', name: 'Caucaia', kind: 'municipality', uf: 'CE' },
    ]
    assert.deepEqual(addBudgetEstadoOptions(soMunicipio), [{ value: 'CE', label: 'CE' }])
  })
})

describe('addBudgetRefFor — município vence; senão a estado-rede da UF', () => {
  it('só estado → ref da estado-rede (= UF)', () => {
    assert.equal(addBudgetRefFor(redes, 'CE', ''), 'CE')
  })
  it('estado + município → ref do município', () => {
    assert.equal(addBudgetRefFor(redes, 'CE', '2304400'), '2304400')
  })
  it('UF sem estado-rede e sem município → null (força escolher município)', () => {
    const soMunicipio: readonly CatalogNetwork[] = [
      { ref: '2304400', name: 'Caucaia', kind: 'municipality', uf: 'CE' },
    ]
    assert.equal(addBudgetRefFor(soMunicipio, 'CE', ''), null)
  })
  it('nada escolhido → null', () => {
    assert.equal(addBudgetRefFor(redes, '', ''), null)
  })
})
