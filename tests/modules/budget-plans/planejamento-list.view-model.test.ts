/**
 * Testes do ViewModel puro da lista de Planejamento — status/rótulos/parceiros/ações do menu "…".
 * As regras de ação espelham HANDBOOK §1.3 (raiz vs versão; irmão aprovado remove "Aprovar").
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import type { BudgetPlanNode } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import {
  deriveStatusView,
  derivePartnersLabel,
  derivePlanDisplayName,
  deriveVersionLabel,
  deriveAuditLabel,
  derivePlanActions,
  toPlanRow,
  filterPlans,
  paginatePlans,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

/** Intl usa NBSP (U+00A0) entre "R$" e o número; normaliza p/ comparação legível. */
const NBSP = String.fromCharCode(160)
const norm = (s: string): string => s.split(NBSP).join(' ')

const node = (over: Partial<BudgetPlanNode>): BudgetPlanNode => ({
  id: 1,
  year: 2026,
  programName: 'Parceria',
  programAbbreviation: 'PARC',
  version: 1.0,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  updatedByName: 'Bruno Costa',
  updatedAt: '2026-01-26T10:18:00Z',
  networkKind: 'ESTADO',
  partnersCount: 1,
  children: [],
  ...over,
})

describe('deriveStatusView', () => {
  it('mapeia label + tom por status', () => {
    assert.deepEqual(deriveStatusView('RASCUNHO'), { label: 'Rascunho', tone: 'neutral' })
    assert.deepEqual(deriveStatusView('EM_CALIBRACAO'), { label: 'Em Calibração', tone: 'info' })
    assert.deepEqual(deriveStatusView('APROVADO'), { label: 'Aprovado', tone: 'success' })
  })
})

describe('derivePartnersLabel', () => {
  it('estados vs municípios', () => {
    assert.equal(derivePartnersLabel(1, 'ESTADO'), '1 estados')
    assert.equal(derivePartnersLabel(3, 'MUNICIPIO'), '3 municípios')
  })
})

describe('derivePlanDisplayName / deriveVersionLabel', () => {
  it('nome = ano + abreviação + versão', () => {
    assert.equal(derivePlanDisplayName(node({ version: 1.0 })), '2026 PARC 1.0')
  })
  it('usa programName quando não há abreviação', () => {
    assert.equal(
      derivePlanDisplayName(node({ programAbbreviation: null, programName: 'EPV' })),
      '2026 EPV 1.0',
    )
  })
  it('rótulo da versão = nome do cenário; senão "Inicial" para versão fracionária', () => {
    assert.equal(
      deriveVersionLabel(node({ version: 1.1, scenarioName: 'Cenário 01 - Bruno' })),
      'Cenário 01 - Bruno',
    )
    assert.equal(deriveVersionLabel(node({ version: 1.1, scenarioName: null })), 'Inicial')
    assert.equal(deriveVersionLabel(node({ version: 2.0, scenarioName: null })), null)
  })
})

describe('derivePlanActions', () => {
  it('raiz tem todas as ações (calibração + cenário)', () => {
    const a = derivePlanActions({ isRoot: true, status: 'APROVADO', hasApprovedSibling: false })
    assert.deepEqual(a, [
      'share',
      'planned-vs-actual',
      'start-calibration',
      'approve',
      'create-scenery',
      'export-csv',
      'delete',
    ])
  })
  it('versão aprovável (sem irmão aprovado) tem Aprovar, sem calibração/cenário', () => {
    const a = derivePlanActions({ isRoot: false, status: 'RASCUNHO', hasApprovedSibling: false })
    assert.deepEqual(a, ['share', 'planned-vs-actual', 'approve', 'export-csv', 'delete'])
  })
  it('versão não-aprovável (irmão aprovado) não tem Aprovar', () => {
    const a = derivePlanActions({ isRoot: false, status: 'RASCUNHO', hasApprovedSibling: true })
    assert.deepEqual(a, ['share', 'planned-vs-actual', 'export-csv', 'delete'])
  })
})

describe('deriveAuditLabel', () => {
  it('formata "{usuário} alteração dd/mm/aaaa hh:mm" (componentes UTC, estável por fuso)', () => {
    assert.equal(
      deriveAuditLabel('Administrador', '2026-06-30T22:06:00Z'),
      'Administrador alteração 30/06/2026 22:06',
    )
  })
  it('ISO inválido → só o nome (fallback seguro)', () => {
    assert.equal(deriveAuditLabel('Bruno Costa', 'not-a-date'), 'Bruno Costa')
  })
})

describe('toPlanRow', () => {
  it('deriva total formatado, auditoria, editável e propaga irmão-aprovado aos filhos', () => {
    const tree = node({
      status: 'APROVADO',
      totalInCents: 2_578_447_403,
      updatedByName: 'Administrador',
      updatedAt: '2026-06-30T22:06:00Z',
      children: [
        node({ id: 2, version: 1.1, scenarioName: 'Cenário 01 - Bruno', status: 'RASCUNHO' }),
        node({ id: 3, version: 2.0, status: 'APROVADO', totalInCents: 100 }),
      ],
    })
    const row = toPlanRow(tree)
    assert.equal(norm(row.totalLabel), 'R$ 25.784.474,03')
    assert.equal(row.auditLabel, 'Administrador alteração 30/06/2026 22:06')
    assert.equal(row.editable, false) // Aprovado (raiz)
    assert.equal(row.versionLabel, null) // raiz não mostra rótulo
    // filho 1.1 tem irmão aprovado (2.0) → sem "approve"
    const child = row.children[0]
    assert.ok(child)
    assert.equal(child.versionLabel, 'Cenário 01 - Bruno')
    assert.equal(child.editable, true) // Rascunho
    assert.ok(!child.actions.includes('approve'))
  })
})

describe('filterPlans', () => {
  const roots = [
    node({ id: 1, year: 2026, programAbbreviation: 'ETI', status: 'APROVADO' }),
    node({ id: 2, year: 2026, programAbbreviation: 'PARC', status: 'EM_CALIBRACAO' }),
    node({ id: 3, year: 2025, programAbbreviation: 'PARC', status: 'RASCUNHO' }),
  ]
  it('filtra por ano', () => {
    assert.deepEqual(
      filterPlans(roots, { year: 2025 }).map((n) => n.id),
      [3],
    )
  })
  it('filtra por status', () => {
    assert.deepEqual(
      filterPlans(roots, { status: 'APROVADO' }).map((n) => n.id),
      [1],
    )
  })
  it('filtra por programa (abreviação, case-insensitive)', () => {
    assert.deepEqual(
      filterPlans(roots, { program: 'parc' }).map((n) => n.id),
      [2, 3],
    )
  })
  it('busca textual casa ano/abreviação/versão', () => {
    assert.deepEqual(
      filterPlans(roots, { search: 'ETI' }).map((n) => n.id),
      [1],
    )
    assert.deepEqual(
      filterPlans(roots, { search: '2026' }).map((n) => n.id),
      [1, 2],
    )
  })
  it('sem filtro devolve tudo', () => {
    assert.equal(filterPlans(roots, {}).length, 3)
  })
})

describe('paginatePlans', () => {
  const items = [1, 2, 3, 4, 5, 6, 7] as const
  it('fatia por página e reporta total/totalPages', () => {
    const p1 = paginatePlans(items, 1, 5)
    assert.deepEqual([...p1.items], [1, 2, 3, 4, 5])
    assert.equal(p1.total, 7)
    assert.equal(p1.totalPages, 2)
    const p2 = paginatePlans(items, 2, 5)
    assert.deepEqual([...p2.items], [6, 7])
    assert.equal(p2.page, 2)
  })
  it('página fora do intervalo é fixada (clamp)', () => {
    const p = paginatePlans(items, 99, 5)
    assert.equal(p.page, 2)
    assert.deepEqual([...p.items], [6, 7])
  })
  it('lista vazia → 1 página, 0 itens', () => {
    const p = paginatePlans([], 1, 5)
    assert.equal(p.total, 0)
    assert.equal(p.totalPages, 1)
    assert.equal(p.items.length, 0)
  })
})
