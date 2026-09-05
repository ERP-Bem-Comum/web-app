/**
 * Governança: o vocabulário de LACUNAS do pré-voo da remessa (`PayoutField` e `PayoutGapReason`) não
 * pode divergir entre as cópias que o boundary §I obriga a existir.
 *
 * ## Por que existe um teste em vez de uma fonte única
 *
 * O padrão preferido deste repo é o da `contracts-error-in-sync.test.ts`: uma definição canônica e as
 * demais camadas REEXPORTANDO. Aqui isso não é possível dos dois lados — `client/data/model/` **não
 * pode** importar de `server/domain/` (boundary §I, cobrado pelo `eslint-plugin-boundaries`), então a
 * cópia do client é obrigatória. O que dá para fazer é dividir o problema:
 *
 *   · **dentro do server**, o drift virou IMPOSSÍVEL por construção — `remittance.io.ts` declara a
 *     tupla `as const` e o mapper deriva os `Set` dela (não há segunda lista a atualizar);
 *   · **entre client e server**, sobra a cópia, e é ela que este teste trava.
 *
 * ## O defeito que ele impede, e que já ocorreu DUAS vezes
 *
 * `mapGaps` descarta em silêncio a lacuna cujo campo ou motivo ele não reconhece. O resultado não é
 * erro: é a linha chegando à tela **bloqueada e sem motivo**, com o operador olhando para um cadastro
 * que, para ele, está completo — e sem nada a investigar em lugar nenhum.
 *
 *   1. `check-digit-mismatch` — o core-api criou o motivo para desfazer exatamente o mal-entendido
 *      "cadastro incompleto" num cadastro completo, e o front o descartava.
 *   2. `payee-document` — o core-api o emite para BOLETO desde a #891 (Segmento J-52 identifica sacado
 *      e cedente por inscrição), e o front não o tinha.
 *
 * Nas duas o compilador ficou quieto, e a razão é a mesma: `new Set<PayoutField>([...])` restringe o
 * que PODE entrar e nunca exige o que falta — um subconjunto compila. Um `Record<PayoutField, …>`
 * exigiria, e é por isso que o `FIELD_TAG` do view-model nunca divergiu.
 *
 * ⚠️ O teste lê os arquivos como TEXTO de propósito. Importar os módulos traria só os tipos (apagados
 * em runtime) ou exigiria expor a lista do client como valor só para o teste — e a cópia do client é
 * uma união de tipos, que não existe em runtime. É a mesma técnica da `contracts-error-in-sync`.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

const SERVER_IO = 'src/modules/financial/server/domain/remittance.io.ts'
const CLIENT_MODEL = 'src/modules/financial/client/data/model/remittance.model.ts'
const MAPPER = 'src/modules/financial/server/adapters/core-api/remittance.mappers.ts'
const VIEW_MODEL = 'src/modules/financial/client/contas-a-pagar-list/remittance-preview.view-model.ts'
const CATALOG = 'src/shared/i18n/catalog.pt-BR.ts'

/** Membros de uma tupla `export const NOME = [ 'a', 'b' ] as const`. */
const tupleMembers = (file: string, name: string): readonly string[] => {
  const block = new RegExp(`export const ${name} = \\[([^\\]]*)\\] as const`).exec(read(file))
  assert.ok(block !== null, `não achei a tupla ${name} em ${file}`)
  return [...(block[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1] ?? '').sort()
}

/** Membros de uma união `export type Nome = | 'a' | 'b'`, parando na linha em branco. */
const unionMembers = (file: string, name: string): readonly string[] => {
  const block = new RegExp(`export type ${name} =([\\s\\S]*?)\\n\\n`).exec(read(file))
  assert.ok(block !== null, `não achei a união ${name} em ${file}`)
  return [...(block[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1] ?? '').sort()
}

describe('arquitetura — o vocabulário de lacunas do pré-voo não diverge entre client e server', () => {
  it('PayoutField: a união do client tem exatamente os membros da tupla do server', () => {
    assert.deepEqual(
      unionMembers(CLIENT_MODEL, 'PayoutField'),
      tupleMembers(SERVER_IO, 'PAYOUT_FIELDS'),
      `a cópia do client em ${CLIENT_MODEL} divergiu de ${SERVER_IO}. ` +
        'Campo a mais no server e a menos no client é DESCARTADO em silêncio por `mapGaps`, e a linha ' +
        'chega à tela bloqueada e sem motivo.',
    )
  })

  it('PayoutGapReason: a união do client tem exatamente os membros da tupla do server', () => {
    assert.deepEqual(
      unionMembers(CLIENT_MODEL, 'PayoutGapReason'),
      tupleMembers(SERVER_IO, 'PAYOUT_GAP_REASONS'),
      `a cópia do client em ${CLIENT_MODEL} divergiu de ${SERVER_IO}.`,
    )
  })

  // A trava de construção do lado do server: se alguém reescrever os `Set` à mão, o drift silencioso
  // volta a ser possível e as duas linhas acima param de bastar.
  it('o mapper DERIVA os conjuntos da tupla do domínio, em vez de reescrevê-los', () => {
    const src = read(MAPPER)

    assert.match(
      src,
      /new Set<PayoutField>\(PAYOUT_FIELD_VALUES\)/,
      `${MAPPER} deve derivar PAYOUT_FIELDS da tupla do domínio — um Set escrito à mão aceita ` +
        'subconjunto sem o compilador reclamar, que é como `payee-document` ficou de fora.',
    )
    assert.match(
      src,
      /new Set<PayoutGapReason>\(PAYOUT_GAP_REASON_VALUES\)/,
      `${MAPPER} deve derivar GAP_REASONS da tupla do domínio.`,
    )
  })

  // O `FIELD_TAG` é `Record<PayoutField, string>` e já é cobrado pelo compilador. O que o compilador
  // NÃO cobra é a chave existir no catálogo — um rótulo ausente renderiza a própria tag na tela.
  it('todo campo tem rótulo i18n existente no catálogo', () => {
    const tags = [...read(VIEW_MODEL).matchAll(/'(financial\.remittance\.preview\.field\.[^']+)'/g)].map(
      (m) => m[1] ?? '',
    )
    const catalog = read(CATALOG)

    assert.ok(tags.length > 0, 'não achei nenhuma tag de campo no view-model')
    for (const tag of tags) {
      assert.ok(catalog.includes(`'${tag}'`), `a tag ${tag} não existe em ${CATALOG}`)
    }
  })
})
