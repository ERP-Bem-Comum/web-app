/**
 * Mappers do core-api reports (#114, puro, node:test): teamReportToModel / suppliersWithoutContractToModel /
 * paymentPositionToModel — caso feliz (DTO→Model), drift (shape inválido → err('server')) e nullable
 * preservado. Fixtures SINTÉTICAS (LGPD: nomes fictícios, nada real). Import relativo (os #alias resolvem
 * via package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  teamReportToModel,
  suppliersWithoutContractToModel,
  paymentPositionToModel,
  mapHttpError,
} from '../../../../../../src/modules/reports/server/adapters/core-api/reports.mappers.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type { HttpError } from '../../../../../../src/shared/http/http-error.types.ts'

describe('mapHttpError', () => {
  const http = (status: number, code?: string): HttpError => ({
    kind: 'http',
    status,
    body: code === undefined ? null : { error: { code, message: '', requestId: 'r' } },
  })

  it('mapeia status → ReportsError', () => {
    assert.equal(mapHttpError(http(401)), 'unauthorized')
    assert.equal(mapHttpError(http(403)), 'forbidden')
    assert.equal(mapHttpError(http(400)), 'validation')
    assert.equal(mapHttpError(http(422)), 'validation')
    assert.equal(mapHttpError(http(500)), 'server')
  })
  it('mapeia slug de auth/RBAC quando presente', () => {
    assert.equal(mapHttpError(http(500, 'unauthorized')), 'unauthorized')
    assert.equal(mapHttpError(http(500, 'forbidden')), 'forbidden')
  })
  it('rede/timeout → connectivity; parse/aborted → server', () => {
    assert.equal(mapHttpError({ kind: 'network' }), 'connectivity')
    assert.equal(mapHttpError({ kind: 'timeout' }), 'connectivity')
    assert.equal(mapHttpError({ kind: 'parse' }), 'server')
    assert.equal(mapHttpError({ kind: 'aborted' }), 'server')
  })
})

const validTeam = {
  team: [
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
      startOfContract: '2026-01-15',
      registrationStatus: 'Pendente',
      active: false,
      education: null,
      experienceInPublicSector: null,
    },
  ],
}

describe('teamReportToModel', () => {
  it('mapeia DTO válido → Model', () => {
    const r = teamReportToModel(validTeam)
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.length, 2)
      assert.equal(r.value[0]?.name, 'Aurora Ferreira')
      assert.equal(r.value[0]?.active, true)
      assert.equal(r.value[0]?.experienceInPublicSector, true)
    }
  })
  it('preserva os nullable (program/education/experienceInPublicSector)', () => {
    const r = teamReportToModel(validTeam)
    if (isOk(r)) {
      assert.equal(r.value[1]?.program, null)
      assert.equal(r.value[1]?.education, null)
      assert.equal(r.value[1]?.experienceInPublicSector, null)
    }
  })
  it('drift (shape inválido) → err(server)', () => {
    assert.equal(isErr(teamReportToModel({ team: [{ id: 'x' }] })), true)
    assert.equal(isErr(teamReportToModel({ members: [] })), true)
    assert.equal(isErr(teamReportToModel(null)), true)
  })
})

const validSuppliers = {
  suppliers: [
    { supplierRef: 'sup-1', name: 'Comercial Andorinha Ltda', totalCents: 1520000, payableCount: 4 },
    { supplierRef: 'sup-2', name: null, totalCents: 0, payableCount: 0 },
  ],
}

describe('suppliersWithoutContractToModel', () => {
  it('mapeia DTO válido → Model', () => {
    const r = suppliersWithoutContractToModel(validSuppliers)
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.length, 2)
      assert.equal(r.value[0]?.supplierRef, 'sup-1')
      assert.equal(r.value[0]?.totalCents, 1520000)
      assert.equal(r.value[0]?.payableCount, 4)
    }
  })
  it('preserva name nullable', () => {
    const r = suppliersWithoutContractToModel(validSuppliers)
    if (isOk(r)) assert.equal(r.value[1]?.name, null)
  })
  it('drift (shape inválido) → err(server)', () => {
    assert.equal(isErr(suppliersWithoutContractToModel({ suppliers: [{ supplierRef: 'x' }] })), true)
    assert.equal(isErr(suppliersWithoutContractToModel({})), true)
  })
})

const validPositions = {
  positions: [
    {
      supplierRef: 'sup-1',
      supplierName: 'Comercial Andorinha Ltda',
      costCenterRef: 'cc-1',
      costCenterName: 'Administrativo',
      categoryRef: 'cat-1',
      categoryName: 'Serviços',
      pendingCents: 30000,
      paidCents: 120000,
      overdueCents: 5000,
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
  ],
}

describe('paymentPositionToModel', () => {
  it('mapeia DTO válido → Model', () => {
    const r = paymentPositionToModel(validPositions)
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.length, 2)
      assert.equal(r.value[0]?.supplierName, 'Comercial Andorinha Ltda')
      assert.equal(r.value[0]?.pendingCents, 30000)
      assert.equal(r.value[0]?.paidCents, 120000)
      assert.equal(r.value[0]?.overdueCents, 5000)
    }
  })
  it('preserva todas as dimensões nullable', () => {
    const r = paymentPositionToModel(validPositions)
    if (isOk(r)) {
      assert.equal(r.value[1]?.supplierRef, null)
      assert.equal(r.value[1]?.supplierName, null)
      assert.equal(r.value[1]?.costCenterRef, null)
      assert.equal(r.value[1]?.costCenterName, null)
      assert.equal(r.value[1]?.categoryRef, null)
      assert.equal(r.value[1]?.categoryName, null)
    }
  })
  it('drift (shape inválido) → err(server)', () => {
    assert.equal(isErr(paymentPositionToModel({ positions: [{ supplierRef: 'x' }] })), true)
    assert.equal(isErr(paymentPositionToModel({ rows: [] })), true)
  })
})
