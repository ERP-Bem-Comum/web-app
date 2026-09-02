/**
 * GOVERNANÇA + comportamento — o erro do formulário diz QUAL regra caiu (specs/114, #359).
 *
 * O defeito que estes testes barram não é "a mensagem está feia". É que a mensagem genérica
 * **produz diagnóstico errado**: ao popular a base, o `max(20)` do campo Banco gerou duas hipóteses
 * de causa falsas — "rejeita acentos", "rejeita dígitos" — que só morreram na leitura do
 * código-fonte.
 *
 * Três invariantes, e a terceira é a que impede o código morto de voltar:
 *
 * 1. o schema **nomeia** a regra;
 * 2. o controller **transporta** o nome (era um booleano, e o motivo morria no laço);
 * 3. todo slug nomeado **tem tradução** — senão o operador lê `bank-required` na tela.
 *
 * A 3 existe porque o repositório já tinha a prova do contrário: `cnpj-invalid` estava nomeado em
 * três models desde sempre e nunca chegou a uma tela, porque ninguém o consumia.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  BankAccountFormSchema,
  PixKeyFormSchema,
} from '#modules/partners/client/data/model/supplier.model.ts'
import { formErrorTag, NAMED_FORM_ERROR_SLUGS } from '#modules/partners/client/shared/form-error-labels.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

const P = 'src/modules/partners/client'

/** O slug do primeiro erro do campo — é o que o controller guarda e a view traduz. */
const slugOf = (
  schema: {
    safeParse: (v: unknown) => {
      success: boolean
      error?: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }
    }
  },
  value: unknown,
  field: string,
): string | null => {
  const r = schema.safeParse(value)
  if (r.success || r.error === undefined) return null
  const issue = r.error.issues.find((i) => i.path.join('.') === field)
  return issue?.message ?? null
}

describe('specs/114 — o schema nomeia a regra (banco e PIX)', () => {
  const bank = { bank: '237', agency: '0288', accountNumber: '38220', checkDigit: '5' }

  it('CA1 — banco vazio diz que o banco é obrigatório', () => {
    assert.equal(slugOf(BankAccountFormSchema, { ...bank, bank: '' }, 'bank'), 'bank-required')
  })

  it('CA2 — agência longa demais nomeia o LIMITE, não "formato inválido"', () => {
    assert.equal(
      slugOf(BankAccountFormSchema, { ...bank, agency: 'x'.repeat(21) }, 'agency'),
      'agency-too-long',
    )
  })

  it('conta e dígito também são nomeados', () => {
    assert.equal(
      slugOf(BankAccountFormSchema, { ...bank, accountNumber: '' }, 'accountNumber'),
      'account-number-required',
    )
    assert.equal(
      slugOf(BankAccountFormSchema, { ...bank, accountNumber: '1'.repeat(31) }, 'accountNumber'),
      'account-number-too-long',
    )
    assert.equal(
      slugOf(BankAccountFormSchema, { ...bank, checkDigit: '123456' }, 'checkDigit'),
      'check-digit-too-long',
    )
  })

  it('CA3 — chave PIX vazia nomeia a CHAVE', () => {
    assert.equal(slugOf(PixKeyFormSchema, { keyType: 'random-key', key: '' }, 'key'), 'pix-key-required')
  })

  it('chave acima do teto do cadastro (140) é nomeada', () => {
    assert.equal(
      slugOf(PixKeyFormSchema, { keyType: 'random-key', key: 'k'.repeat(141) }, 'key'),
      'pix-key-too-long',
    )
  })

  it('tipo de chave fora do domínio é nomeado', () => {
    assert.equal(
      slugOf(PixKeyFormSchema, { keyType: 'boleto', key: 'abc' }, 'keyType'),
      'pix-key-type-invalid',
    )
  })
})

describe('specs/114 — a view traduz o slug, e só o slug conhecido', () => {
  const GENERIC = 'partners.suppliers.form.invalid'

  it('campo sem erro não rende mensagem', () => {
    assert.equal(formErrorTag(undefined, GENERIC), null)
  })

  it('slug conhecido vira a tag da frase própria', () => {
    assert.equal(formErrorTag('bank-required', GENERIC), 'partners.form.error.bankRequired')
  })

  it('CA5 — regra AINDA NÃO nomeada cai na genérica, sem vazar texto do Zod', () => {
    // É o que o Zod produz para um `max(200)` sem `error:` — inglês, e nunca pode chegar à tela.
    assert.equal(formErrorTag('Too big: expected string to have <=200 characters', GENERIC), GENERIC)
  })
})

describe('specs/114 — governança', () => {
  it('CA7 — todo slug nomeado tem tradução no catálogo pt-BR', () => {
    for (const slug of NAMED_FORM_ERROR_SLUGS) {
      const tag = formErrorTag(slug, 'FALLBACK')
      assert.notEqual(tag, 'FALLBACK', `slug "${slug}" sem tag`)
      assert.ok(
        tag !== null && ptBR[tag] !== undefined,
        `slug "${slug}" aponta para a tag "${tag ?? ''}", que não existe no catálogo pt-BR`,
      )
    }
  })

  it('CA7 — todo `error:` declarado nos models de parceiro está no mapa', () => {
    const models = ['supplier', 'financier', 'act', 'collaborator']
    const declared = new Set<string>()
    for (const m of models) {
      const src = read(`${P}/data/model/${m}.model.ts`)
      for (const m2 of src.matchAll(/error:\s*'([a-z0-9-]+)'/g)) {
        const slug = m2[1]
        if (slug !== undefined) declared.add(slug)
      }
    }
    assert.ok(declared.size > 0, 'nenhum erro nomeado encontrado — o scan quebrou')
    for (const slug of declared) {
      assert.ok(
        NAMED_FORM_ERROR_SLUGS.includes(slug),
        `"${slug}" é nomeado num model e não tem frase — o operador leria o slug cru`,
      )
    }
  })

  it('CA6 — os quatro cadastros usam a MESMA fonte de frase', () => {
    const views = [
      'act-create/components/act-form.component.tsx',
      'act-detail/components/act-detail-content.component.tsx',
      'collaborator-create/components/collaborator-form.component.tsx',
      'financier-create/components/financier-form.component.tsx',
      'financier-detail/components/financier-detail-content.component.tsx',
      'supplier-create/components/supplier-form.component.tsx',
      'supplier-detail/components/supplier-detail-content.component.tsx',
    ]
    for (const v of views) {
      assert.match(read(`${P}/${v}`), /formErrorTag\(/, `${v} não usa a fonte compartilhada`)
    }
  })

  it('o controller NÃO pode voltar a guardar booleano — era ali que o motivo morria', () => {
    const controllers = [
      'supplier-create/components/supplier-form.controller.ts',
      'collaborator-create/components/collaborator-form.controller.ts',
      'financier-create/components/financier-form.controller.ts',
      'act-create/components/act-form.controller.ts',
    ]
    for (const c of controllers) {
      const src = read(`${P}/${c}`)
      assert.doesNotMatch(src, /Readonly<Record<string, boolean>>/, `${c} voltou ao booleano`)
      assert.match(src, /issue\.message/, `${c} descarta o motivo do issue`)
    }
  })

  it('o ACT não volta a duplicar os schemas de banco/PIX', () => {
    const src = read(`${P}/data/model/act.model.ts`)
    assert.doesNotMatch(src, /export const BankAccountFormSchema = z\.object/, 'ACT duplicou de novo')
    assert.match(src, /from '\.\/supplier\.model\.ts'/, 'ACT deixou de importar do Fornecedor')
  })
})
