/**
 * Fornecedor pessoa física (#1022) na cadeia BFF — node:test puro.
 *  - leitura: `document` + `personType`; PF com razão social/nome fantasia `null` (a lista não pode cair);
 *    leitura tolerante ao core-api anterior (só `cnpj`, sem `personType`);
 *  - escrita: o corpo envia `document` (nunca o alias `cnpj`) e os nomes da empresa `null` na PF;
 *  - erros novos do core-api → PartnersError;
 *  - io-schema aceita 11 caracteres; use-case valida CPF × CNPJ e a identidade coerente.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { isErr } from '#shared/primitives/result.ts'
import {
  SLUG_TO_ERROR,
  detailToModel,
  toWriteBody,
} from '#modules/partners/server/adapters/core-api/core-api-suppliers.ts'
import { CreateSupplierInputSchema } from '#modules/partners/server/adapters/supplier.io-schemas.ts'
import {
  createCreateSupplier,
  type SupplierClient,
} from '#modules/partners/server/application/supplier/supplier.use-cases.ts'
import type { CreateSupplierInput } from '#modules/partners/server/domain/supplier/supplier.io.ts'

const VALID_CPF = '52998224725'
const VALID_CNPJ = '11222333000181'

const pfDto = {
  id: 'sup-pf',
  name: 'Maria da Silva',
  email: 'maria@exemplo.dev',
  document: VALID_CPF,
  personType: 'PF',
  cnpj: VALID_CPF,
  corporateName: null,
  fantasyName: null,
  serviceCategory: 'Limpeza',
  bankAccount: null,
  pixKey: null,
  active: true,
} as const

describe('detailToModel — fornecedor PF', () => {
  it('lê PF com razão social/nome fantasia null (antes derrubava a leitura inteira)', () => {
    const r = detailToModel(pfDto)
    assert.ok(r.ok)
    assert.equal(r.value.document, VALID_CPF)
    assert.equal(r.value.personType, 'PF')
    assert.equal(r.value.corporateName, null)
    assert.equal(r.value.fantasyName, null)
  })

  it('tolerante ao core-api anterior: só o alias `cnpj`, sem `personType` → deriva do documento', () => {
    const { document: _d, personType: _p, ...legacy } = pfDto
    const r = detailToModel(legacy)
    assert.ok(r.ok)
    assert.equal(r.value.document, VALID_CPF)
    assert.equal(r.value.personType, 'PF')

    const pj = detailToModel({ ...legacy, cnpj: VALID_CNPJ, corporateName: 'X LTDA', fantasyName: 'X' })
    assert.ok(pj.ok)
    assert.equal(pj.value.personType, 'PJ')
  })

  it('razão social em branco ("") também é ausência', () => {
    const r = detailToModel({ ...pfDto, corporateName: '', fantasyName: '' })
    assert.ok(r.ok)
    assert.equal(r.value.corporateName, null)
  })
})

const pfWrite: CreateSupplierInput = {
  name: 'Maria da Silva',
  email: 'maria@exemplo.dev',
  document: '529.982.247-25',
  corporateName: null,
  fantasyName: null,
  serviceCategory: 'Limpeza',
  bankAccount: null,
  pixKey: null,
  serviceRating: null,
  ratingComment: null,
}

describe('toWriteBody — documento', () => {
  it('envia `document` sem máscara; PF com nomes null', () => {
    const body = toWriteBody(pfWrite)
    assert.equal(body.document, VALID_CPF)
    assert.equal(body.corporateName, null)
    assert.equal(body.fantasyName, null)
  })

  it('CNPJ mascarado vai normalizado (14)', () => {
    assert.equal(toWriteBody({ ...pfWrite, document: '11.222.333/0001-81' }).document, VALID_CNPJ)
  })

  // TEMPORÁRIO (#1022): o alias `cnpj` vai junto, IGUAL ao `document`. O core-api anterior à #1025 só lê
  // `cnpj` — sem ele, salvar qualquer fornecedor falharia num ambiente com o backend atrasado. O core-api
  // novo recusa o corpo se os dois divergirem, por isso o teste exige igualdade.
  it('envia também o alias `cnpj`, idêntico ao `document` (compatível com o core-api anterior)', () => {
    const pj = toWriteBody({ ...pfWrite, document: '11.222.333/0001-81' })
    assert.equal(pj.cnpj, VALID_CNPJ)
    assert.equal(pj.cnpj, pj.document)
    const pf = toWriteBody(pfWrite)
    assert.equal(pf.cnpj, pf.document)
  })
})

describe('SLUG_TO_ERROR — erros do fornecedor PF', () => {
  it('documento inválido → invalid-supplier-document', () => {
    assert.equal(SLUG_TO_ERROR['invalid-supplier-document'], 'invalid-supplier-document')
  })

  it('documento duplicado (3 variantes) → supplier-document-duplicate', () => {
    assert.equal(SLUG_TO_ERROR['register-supplier-document-duplicate'], 'supplier-document-duplicate')
    assert.equal(SLUG_TO_ERROR['edit-supplier-document-duplicate'], 'supplier-document-duplicate')
    assert.equal(SLUG_TO_ERROR['supplier-document-duplicate'], 'supplier-document-duplicate')
  })

  it('PF com razão social/nome fantasia → validation', () => {
    assert.equal(SLUG_TO_ERROR['supplier-corporate-name-not-allowed-for-pf'], 'validation')
    assert.equal(SLUG_TO_ERROR['supplier-fantasy-name-not-allowed-for-pf'], 'validation')
  })
})

describe('CreateSupplierInputSchema — documento', () => {
  it('aceita CPF (11) com nomes null', () => {
    assert.equal(CreateSupplierInputSchema.safeParse(pfWrite).success, true)
  })

  it('aceita CPF mascarado (14) e CNPJ mascarado (18); recusa 10 e 19', () => {
    assert.equal(
      CreateSupplierInputSchema.safeParse({ ...pfWrite, document: '529.982.247-25' }).success,
      true,
    )
    assert.equal(
      CreateSupplierInputSchema.safeParse({ ...pfWrite, document: '11.222.333/0001-81' }).success,
      true,
    )
    assert.equal(CreateSupplierInputSchema.safeParse({ ...pfWrite, document: '5299822472' }).success, false)
    assert.equal(
      CreateSupplierInputSchema.safeParse({ ...pfWrite, document: '11.222.333/0001-811' }).success,
      false,
    )
  })
})

describe('createCreateSupplier — identidade coerente com o documento', () => {
  // Client falso: registra a chamada e devolve um detalhe qualquer.
  const run = async (input: CreateSupplierInput): Promise<{ called: boolean; error: string | null }> => {
    let called = false
    const client = {
      create: () => {
        called = true
        return Promise.resolve(detailToModel(pfDto))
      },
    } as unknown as SupplierClient
    const r = await createCreateSupplier({ client })(input, 'token')
    return { called, error: isErr(r) ? r.error : null }
  }

  it('PF com CPF válido e sem nomes da empresa → chama o core-api', async () => {
    assert.deepEqual(await run(pfWrite), { called: true, error: null })
  })

  it('PJ com CNPJ válido e nomes preenchidos → chama o core-api', async () => {
    const pj = { ...pfWrite, document: VALID_CNPJ, corporateName: 'X LTDA', fantasyName: 'X' }
    assert.deepEqual(await run(pj), { called: true, error: null })
  })

  it('PF com razão social → validation, sem tocar o core-api', async () => {
    assert.deepEqual(await run({ ...pfWrite, corporateName: 'Empresa' }), {
      called: false,
      error: 'validation',
    })
  })

  it('PJ sem razão social → validation', async () => {
    assert.deepEqual(await run({ ...pfWrite, document: VALID_CNPJ }), { called: false, error: 'validation' })
  })

  it('CPF com DV errado → validation', async () => {
    assert.deepEqual(await run({ ...pfWrite, document: '52998224724' }), {
      called: false,
      error: 'validation',
    })
  })
})
