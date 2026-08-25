/**
 * Testes de `parseErrorEnvelope` — parser do envelope de erro real do core-api.
 * Contrato: { error: { code: string; message: string; requestId?: string } }.
 * Fonte: specs/001-v2-foundation/contracts/error-envelope.md (core-api errors.ts:19-35).
 *
 * `code` e `message` são obrigatórios; `requestId` é OPCIONAL — nem todo envelope do core-api passa
 * pelo `toErrorEnvelope` que o carimba (ver o terceiro bloco).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'

describe('parseErrorEnvelope — envelope válido', () => {
  it('extrai code/message/requestId de um envelope completo', () => {
    const body = {
      error: { code: 'invalid-credentials', message: 'invalid-credentials', requestId: 'req-123' },
    }

    const parsed = parseErrorEnvelope(body)

    assert.notEqual(parsed, null)
    assert.equal(parsed?.error.code, 'invalid-credentials')
    assert.equal(parsed?.error.message, 'invalid-credentials')
    assert.equal(parsed?.error.requestId, 'req-123')
  })
})

describe('parseErrorEnvelope — entradas inválidas retornam null (sem throw)', () => {
  it('null → null', () => {
    assert.equal(parseErrorEnvelope(null), null)
  })

  it('string → null', () => {
    assert.equal(parseErrorEnvelope('boom'), null)
  })

  it('objeto sem chave error → null', () => {
    assert.equal(parseErrorEnvelope({ foo: 'bar' }), null)
  })

  it('error sem code → null', () => {
    assert.equal(parseErrorEnvelope({ error: { message: 'x', requestId: 'r' } }), null)
  })

  it('error com campos de tipo errado → null', () => {
    assert.equal(parseErrorEnvelope({ error: { code: 1, message: 'x', requestId: 'r' } }), null)
  })

  it('error sem message → null (é a message que fala com o operador)', () => {
    assert.equal(parseErrorEnvelope({ error: { code: 'c', requestId: 'r' } }), null)
  })
})

/**
 * ⚠️ Este bloco INVERTE um caso que existia aqui ("error parcial (sem requestId) → null").
 *
 * O caso antigo fixava o contrato feliz do core-api, onde `toErrorEnvelope` sempre carimba o
 * `requestId`. Mas o core-api também monta envelopes À MÃO em guardas de rota, e esses saem sem o
 * campo — a guarda que recusa a geração de remessa sob `AUTH_RBAC_MODE=bypass` é uma delas
 * (`financial/adapters/http/plugin.ts:407`), e responde 503 com a mensagem exata do bloqueio.
 *
 * Exigir `requestId` fazia o parser devolver `null` para esse corpo, a `message` ser descartada
 * inteira e a tela dizer "Algo deu errado" — com a frase certa dentro da resposta HTTP. Custou uma
 * investigação inteira, com hipóteses de VAN mal configurada e de estouro na montagem do CNAB, para
 * chegar num campo de observabilidade que NENHUM dos ~20 chamadores lê.
 */
describe('parseErrorEnvelope — envelope sem requestId (guardas de rota do core-api)', () => {
  it('sem requestId a MENSAGEM sobrevive — era isto que virava "Algo deu errado"', () => {
    const parsed = parseErrorEnvelope({
      error: {
        code: 'remittance-disabled-under-rbac-bypass',
        message:
          'Geração de remessa indisponível: a autorização por permissão está desligada neste ambiente.',
      },
    })

    assert.notEqual(parsed, null)
    assert.equal(parsed?.error.code, 'remittance-disabled-under-rbac-bypass')
    assert.match(parsed?.error.message ?? '', /autorização por permissão está desligada/)
    // `null`, e não ausente: quem loga precisa distinguir "não veio" de "o campo não existe nesta versão".
    assert.equal(parsed?.error.requestId, null)
  })

  it('requestId de tipo errado degrada para null em vez de derrubar a mensagem junto', () => {
    const parsed = parseErrorEnvelope({ error: { code: 'c', message: 'm', requestId: 42 } })

    assert.notEqual(parsed, null)
    assert.equal(parsed?.error.message, 'm')
    assert.equal(parsed?.error.requestId, null)
  })
})
