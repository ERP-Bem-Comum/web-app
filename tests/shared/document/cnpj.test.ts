/**
 * Helper puro de CNPJ (formato/máscara/normalização) — feature 027 (CNPJ alfanumérico Serpro/2026).
 * TDD: escrito ANTES da impl. Fixtures do contrato do core-api (ADR-0044). DV NÃO é deste helper
 * (fica no VO de domínio); aqui só formato.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  normalizeCnpj,
  unmaskCnpj,
  isValidCnpjFormat,
  isCnpjLength,
  maskCnpj,
  maskCpf,
  maskCpfCnpj,
} from '#shared/document/cnpj.ts'

describe('normalizeCnpj', () => {
  it('remove pontuação e aplica maiúsculas', () => {
    assert.equal(normalizeCnpj('12.ABC.345/01DE-35'), '12ABC34501DE35')
    assert.equal(normalizeCnpj('12abc34501de35'), '12ABC34501DE35')
    assert.equal(normalizeCnpj('11.222.333/0001-81'), '11222333000181')
  })
  it('é idempotente', () => {
    const once = normalizeCnpj('12.abc.345/01de-35')
    assert.equal(normalizeCnpj(once), once)
  })
})

describe('unmaskCnpj (forma crua do estado do input)', () => {
  it('mantém só alfanuméricos, uppercase, máx. 14', () => {
    assert.equal(unmaskCnpj('12.ABC.345/01DE-35'), '12ABC34501DE35')
    assert.equal(unmaskCnpj('12abc'), '12ABC')
    assert.equal(unmaskCnpj('112223330001810'), '11222333000181') // trunca em 14
  })
})

describe('isValidCnpjFormat (só FORMATO, sem DV)', () => {
  it('aceita alfanuméricos válidos (12 alnum + 2 dígitos)', () => {
    assert.equal(isValidCnpjFormat('12ABC34501DE35'), true)
    assert.equal(isValidCnpjFormat('A1B2C3D4E5F668'), true)
    assert.equal(isValidCnpjFormat('12.ABC.345/01DE-35'), true)
    assert.equal(isValidCnpjFormat('12abc34501de35'), true) // minúsculo normaliza
  })
  it('aceita numérico legado (retrocompat)', () => {
    assert.equal(isValidCnpjFormat('11222333000181'), true)
    assert.equal(isValidCnpjFormat('11.222.333/0001-81'), true)
  })
  it('rejeita 2 últimas posições não-numéricas', () => {
    assert.equal(isValidCnpjFormat('12ABC34501DEAB'), false)
  })
  it('rejeita degenerado (14 iguais)', () => {
    assert.equal(isValidCnpjFormat('00000000000000'), false)
    assert.equal(isValidCnpjFormat('AAAAAAAAAAAA11'), true) // só os 14 idênticos são degenerados
  })
  it('rejeita comprimento errado', () => {
    assert.equal(isValidCnpjFormat('123'), false)
    assert.equal(isValidCnpjFormat('112223330001810'), false) // 15
  })
})

describe('isCnpjLength', () => {
  it('true só quando normalizado tem 14', () => {
    assert.equal(isCnpjLength('12ABC34501DE35'), true)
    assert.equal(isCnpjLength('12.ABC.345/01DE-35'), true)
    assert.equal(isCnpjLength('123'), false)
    assert.equal(isCnpjLength('11222333000181'), true)
  })
})

describe('maskCnpj', () => {
  it('agrupa alfanumérico como XX.XXX.XXX/XXXX-NN', () => {
    assert.equal(maskCnpj('12ABC34501DE35'), '12.ABC.345/01DE-35')
    assert.equal(maskCnpj('A1B2C3D4E5F668'), 'A1.B2C.3D4/E5F6-68')
    assert.equal(maskCnpj('11222333000181'), '11.222.333/0001-81')
  })
  it('agrupamento parcial durante digitação', () => {
    assert.equal(maskCnpj('12AB'), '12.AB')
    assert.equal(maskCnpj('123'), '12.3')
  })
})

describe('maskCpf', () => {
  it('mantém comportamento numérico', () => {
    assert.equal(maskCpf('12345678901'), '123.456.789-01')
    assert.equal(maskCpf('123'), '123')
  })
})

describe('maskCpfCnpj (heurística: letra ⇒ CNPJ; senão por comprimento)', () => {
  it('letra ⇒ CNPJ mesmo com poucos dígitos', () => {
    assert.equal(maskCpfCnpj('12ABC'), '12.ABC')
    assert.equal(maskCpfCnpj('12ABC34501DE35'), '12.ABC.345/01DE-35')
  })
  it('só dígitos ≤ 11 ⇒ CPF', () => {
    assert.equal(maskCpfCnpj('12345678901'), '123.456.789-01')
  })
  it('só dígitos 12–14 ⇒ CNPJ', () => {
    assert.equal(maskCpfCnpj('11222333000181'), '11.222.333/0001-81')
  })
})
