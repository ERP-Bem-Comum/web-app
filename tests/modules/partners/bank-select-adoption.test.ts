/**
 * GOVERNANÇA — o banco do favorecido é SELEÇÃO, nunca texto livre (specs/108 + specs/112).
 *
 * Scan de fonte no estilo de `regression-contracts-partners-review.test.ts`: lê o source e faz
 * assert, sem importar módulo — robusto a refactor de componente.
 *
 * O que ele protege, e por que vale um teste em vez de um comentário: o CNAB 240 é POSICIONAL e
 * exige o código de compensação FEBRABAN. Um `<input>` de banco aceita "Bradesco", "bradesco",
 * "237-2" — tudo grava, nada falha na tela, e a recusa aparece semanas depois, no banco, com a
 * remessa já transmitida. Voltar ao texto livre é uma regressão silenciosa por construção, e o
 * único lugar onde ela dá para ser barrada de graça é aqui.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

const P = 'src/modules/partners/client'

/**
 * As telas em que o banco do favorecido é EDITÁVEL. `*-edit` não aparece porque ACT e Financiador
 * reusam o componente de criar — incluí-las asseriria o mesmo arquivo duas vezes.
 *
 * Colaborador tem só o CRIAR: `bankAccount` é create-only (#40) e a borda de update faz strip, então
 * o detalhe exibe read-only. Um seletor editável ali aceitaria a troca e a descartaria em silêncio.
 */
const EDITABLE_BANK_SCREENS: readonly string[] = [
  `${P}/supplier-create/components/supplier-form.component.tsx`,
  `${P}/supplier-detail/components/supplier-detail-content.component.tsx`,
  `${P}/collaborator-create/components/collaborator-form.component.tsx`,
  `${P}/financier-create/components/financier-form.component.tsx`,
  `${P}/financier-detail/components/financier-detail-content.component.tsx`,
  `${P}/act-create/components/act-form.component.tsx`,
  `${P}/act-detail/components/act-detail-content.component.tsx`,
]

describe('banco do favorecido — seleção FEBRABAN, não texto livre', () => {
  it('toda tela com banco editável usa o BankSelect', () => {
    const offenders = EDITABLE_BANK_SCREENS.filter((f) => !read(f).includes('<BankSelect'))
    assert.deepEqual(
      offenders,
      [],
      `Sem o seletor o banco volta a ser string livre e a TED é recusada no banco, não na tela ` +
        `(specs/108). Arquivos: ${offenders.join(', ')}`,
    )
  })

  it('nenhuma delas mantém um <input> de banco em paralelo', () => {
    // `setField('bank', e.target.value)` é a assinatura do input cru: só um handler de evento DOM lê
    // `.target.value`. O BankSelect entrega o código já normalizado (`onChange={(code) => …}`).
    const offenders = EDITABLE_BANK_SCREENS.filter((f) =>
      /setField\('bank',\s*e\.target\.value\)/.test(read(f)),
    )
    assert.deepEqual(offenders, [], `Input cru de banco ainda presente em: ${offenders.join(', ')}`)
  })

  it('o aviso do cadastro legado acompanha o seletor em todas', () => {
    // Sem o aviso, o cadastro antigo aparece como "Não reconhecido: Bradesco" e não diz o que fazer
    // nem o que acontece se ficar assim — que é a recusa da transferência.
    const offenders = EDITABLE_BANK_SCREENS.filter((f) => !read(f).includes('BANK_UNKNOWN_HINT'))
    assert.deepEqual(offenders, [], `Sem aviso de cadastro legado em: ${offenders.join(', ')}`)
  })

  it('os rótulos do seletor têm fonte única (chaves sem tipo de parceiro)', () => {
    // Quatro cópias da mesma frase são quatro lugares para a redação divergir. O RÓTULO do campo
    // ("Banco") segue por tipo de propósito — ele acompanha a seção de cada formulário.
    const catalog = read('src/shared/i18n/catalog.pt-BR.ts')
    for (const key of ['bankPlaceholder', 'bankFrequent', 'bankAll', 'bankUnknown', 'bankUnknownHint']) {
      assert.ok(catalog.includes(`'partners.form.${key}'`), `chave compartilhada ausente: ${key}`)
      assert.ok(
        !new RegExp(`'partners\\.(suppliers|collaborators|financiers|acts)\\.form\\.${key}'`).test(catalog),
        `chave de banco re-tipada por parceiro: ${key}`,
      )
    }
  })

  it('o colaborador NÃO ganha seletor editável no detalhe (bankAccount é create-only, #40)', () => {
    // Guarda de intenção: se o backend passar a aceitar update, este teste é o lugar de registrar a
    // mudança — deliberadamente, e não por alguém "completar" a tela achando que faltou.
    const detail = read(`${P}/collaborator-detail/components/collaborator-detail-content.component.tsx`)
    assert.ok(
      !detail.includes('<BankSelect'),
      'update de bankAccount do colaborador sofre strip na borda (#40)',
    )
  })
})
