/**
 * Adapters PUROS dos view-models dos Relatórios (#114, node:test): DTO real (Model do client) → shape das
 * telas front-first. Cobre `toRawPosicaoRows` (D1), `toRawSupplierRows` (D2) e `toTeamRows` (D3, LGPD-safe
 * com sentinelas honestos). Fixtures SINTÉTICAS (nomes fictícios, nada real). Imports relativos.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { toRawPosicaoRows } from '../../../../src/modules/reports/client/posicao.view-model.ts'
import { toRawSupplierRows } from '../../../../src/modules/reports/client/suppliers-without-contract.view-model.ts'
import { toTeamRows } from '../../../../src/modules/reports/client/equipe.view-model.ts'
import type { PaymentPosition } from '../../../../src/modules/reports/client/data/model/payment-position.model.ts'
import type { SupplierWithoutContract } from '../../../../src/modules/reports/client/data/model/supplier-without-contract.model.ts'
import type { TeamMember } from '../../../../src/modules/reports/client/data/model/team-report.model.ts'

describe('toRawPosicaoRows (D1 — mapeamento 1:1)', () => {
  const positions: readonly PaymentPosition[] = [
    {
      supplierRef: 's1',
      supplierName: 'Fornecedor Alfa',
      costCenterRef: 'c1',
      costCenterName: 'Diretoria',
      categoryRef: 'k1',
      categoryName: 'Consultoria',
      pendingCents: 3000,
      paidCents: 1000,
      overdueCents: 9000,
    },
    {
      supplierRef: null,
      supplierName: null,
      costCenterRef: null,
      costCenterName: null,
      categoryRef: null,
      categoryName: null,
      pendingCents: 0,
      paidCents: 0,
      overdueCents: 0,
    },
  ]

  it('mapeia os 3 buckets (overdue→emAtraso, paid→pago, pending→aPagar)', () => {
    const rows = toRawPosicaoRows(positions)
    assert.equal(rows[0]?.emAtrasoCents, 9000)
    assert.equal(rows[0]?.pagoCents, 1000)
    assert.equal(rows[0]?.aPagarCents, 3000)
    assert.equal(rows[0]?.supplier, 'Fornecedor Alfa')
    assert.equal(rows[0]?.costCenter, 'Diretoria')
    assert.equal(rows[0]?.category, 'Consultoria')
  })

  it('dimensões nullable caem no fallback "—"', () => {
    const rows = toRawPosicaoRows(positions)
    assert.equal(rows[1]?.supplier, '—')
    assert.equal(rows[1]?.costCenter, '—')
    assert.equal(rows[1]?.category, '—')
  })

  it('lista vazia → []', () => {
    assert.equal(toRawPosicaoRows([]).length, 0)
  })
})

describe('toRawSupplierRows (D2 — sem quebra por plano)', () => {
  const suppliers: readonly SupplierWithoutContract[] = [
    { supplierRef: 'sup-1', name: 'Comercial Andorinha Ltda', totalCents: 1520000, payableCount: 4 },
    { supplierRef: 'sup-2', name: null, totalCents: 5000, payableCount: 1 },
    { supplierRef: 'sup-3', name: '   ', totalCents: 700, payableCount: 2 },
  ]

  it('cada fornecedor vira UMA linha com budgetPlan "—"', () => {
    const rows = toRawSupplierRows(suppliers)
    assert.equal(rows.length, 3)
    assert.equal(rows[0]?.budgetPlan, '—')
    assert.equal(rows[0]?.supplier, 'Comercial Andorinha Ltda')
    assert.equal(rows[0]?.totalCents, 1520000)
  })

  it('name null/vazio → cai no supplierRef como rótulo', () => {
    const rows = toRawSupplierRows(suppliers)
    assert.equal(rows[1]?.supplier, 'sup-2')
    assert.equal(rows[2]?.supplier, 'sup-3')
  })
})

describe('toTeamRows (D3 — LGPD-safe, sentinelas honestos)', () => {
  const members: readonly TeamMember[] = [
    {
      id: 'tm-1',
      name: 'Aurora Ferreira',
      program: 'Programa Semente',
      role: 'Coordenadora',
      employmentRelationship: 'CLT',
      startOfContract: '2025-03-01',
      registrationStatus: 'Ativo',
      active: true,
      education: 'Ensino Superior',
      experienceInPublicSector: true,
    },
    {
      id: 'tm-2',
      name: 'Bento Nogueira',
      program: null,
      role: 'Analista',
      employmentRelationship: 'PJ',
      startOfContract: 'sem-data',
      registrationStatus: 'Pendente',
      active: false,
      education: null,
      experienceInPublicSector: null,
    },
  ]

  it('mapeia os campos reais (nome/programa/função/vínculo/escolaridade) sem forçar enum', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.nome, 'Aurora Ferreira')
    assert.equal(rows[0]?.programa, 'Programa Semente')
    assert.equal(rows[0]?.funcao, 'Coordenadora')
    assert.equal(rows[0]?.vinculo, 'CLT')
    assert.equal(rows[0]?.escolaridade, 'Ensino Superior')
  })

  it('idade/gênero/raça-cor → sentinelas honestos (endpoint LGPD-safe não os traz)', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.idade, null)
    assert.equal(rows[0]?.genero, '—')
    assert.equal(rows[0]?.racaCor, '—')
  })

  it('anoContrato = ano de startOfContract; não-parseável → 0', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.anoContrato, 2025)
    assert.equal(rows[1]?.anoContrato, 0)
  })

  it('program/education null → sentinela "—"', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[1]?.programa, '—')
    assert.equal(rows[1]?.escolaridade, '—')
  })
})
