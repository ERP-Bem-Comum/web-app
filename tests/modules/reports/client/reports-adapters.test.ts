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

describe('toRawPosicaoRows (D1 — mapeamento das 3 medidas)', () => {
  const positions: readonly PaymentPosition[] = [
    {
      supplierRef: 's1',
      supplierName: 'Fornecedor Alfa',
      costCenterRef: 'c1',
      costCenterName: 'Diretoria',
      categoryRef: 'k1',
      categoryName: 'Consultoria',
      // pending = TODOS os não-pagos (9000); overdue = os já vencidos (3000, subconjunto de pending).
      pendingCents: 9000,
      paidCents: 1000,
      overdueCents: 3000,
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

  it('mapeia os 3 buckets exclusivos (overdue→emAtraso, paid→pago, pending−overdue→aPagar)', () => {
    const rows = toRawPosicaoRows(positions)
    assert.equal(rows[0]?.emAtrasoCents, 3000)
    assert.equal(rows[0]?.pagoCents, 1000)
    assert.equal(rows[0]?.aPagarCents, 6000) // 9000 pending − 3000 overdue (só o a vencer)
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

describe('toTeamRows — dado real do colaborador + área cruzada de Colaboradores', () => {
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
      education: 'ENSINO_SUPERIOR',
      experienceInPublicSector: true,
      genderIdentity: 'MULHER_CIS',
      race: 'PARDO',
      age: 34,
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
      genderIdentity: null,
      race: null,
      age: null,
    },
  ]

  it('mapeia os campos reais (nome/função/vínculo/escolaridade) sem forçar enum', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.nome, 'Aurora Ferreira')
    assert.equal(rows[0]?.funcao, 'Coordenadora')
    assert.equal(rows[0]?.vinculo, 'CLT')
    assert.equal(rows[0]?.escolaridade, 'ENSINO_SUPERIOR')
  })

  // Estes três vinham cravados em sentinela porque o schema de borda não declarava as chaves — o core-api
  // mandava e o Zod descartava calado. O valor é o CÓDIGO canônico; quem traduz é a View.
  it('idade/gênero/raça-cor levam o valor REAL do colaborador (código, não rótulo)', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.idade, 34)
    assert.equal(rows[0]?.genero, 'MULHER_CIS')
    assert.equal(rows[0]?.racaCor, 'PARDO')
  })

  it('gênero/raça/idade ausentes → sentinela, nunca linha descartada', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[1]?.genero, '—')
    assert.equal(rows[1]?.racaCor, '—')
    assert.equal(rows[1]?.idade, null)
  })

  // A área NÃO vem do /reports/team (a projeção grava `program: null`): é cruzada por id com a listagem
  // de Colaboradores. Sem o mapa, a linha aparece com "—" — enriquecimento não pode sumir com ninguém.
  it('área vem do mapa por id; sem mapa → sentinela e a linha permanece', () => {
    const comArea = toTeamRows(members, new Map([['tm-1', 'PARC']]))
    assert.equal(comArea[0]?.programa, 'PARC')
    assert.equal(comArea[1]?.programa, '—')

    const semMapa = toTeamRows(members)
    assert.equal(semMapa.length, 2)
    assert.equal(semMapa[0]?.programa, '—')
  })

  it('anoContrato = ano de startOfContract; não-parseável → 0', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[0]?.anoContrato, 2025)
    assert.equal(rows[1]?.anoContrato, 0)
  })

  it('education null → sentinela "—"', () => {
    const rows = toTeamRows(members)
    assert.equal(rows[1]?.escolaridade, '—')
  })
})
