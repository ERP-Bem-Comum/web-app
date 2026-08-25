/**
 * `domainMessage` (puro, node:test) — a política de QUANDO a mensagem do core-api chega ao operador.
 *
 * A UI prioriza esta mensagem sobre o próprio texto PT (`msg ?? t(tag)`), e a prioridade só se justifica
 * enquanto o que vem é recado de NEGÓCIO. O 404 do roteador não é: ele parseia como qualquer envelope e
 * vencia o texto da tela — em homologação (25/08) o operador leu **"Route not found"** no lugar do recado
 * pronto, porque a rota do arquivo da remessa só era registrada fora de produção e a imagem do core-api
 * fixa `NODE_ENV=production` em todo ambiente. O core-api#855 ligou aquela rota, mas o alvo destes testes
 * é a POLÍTICA, não a rota: rota inexistente é fato de infraestrutura, nunca recado ao operador.
 *
 * Import relativo (os #alias da fonte resolvem via package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { domainMessage } from '../../../../../../src/modules/financial/server/adapters/core-api/core-api-financial.ts'

const envelope = (code: string, message: string): unknown => ({
  error: { code, message, requestId: 'req-1' },
})

describe('domainMessage', () => {
  it('⚠️ descarta o 404 do ROTEADOR — "Route not found" nunca é recado ao operador', () => {
    const e = { kind: 'http', status: 404, body: envelope('not-found', 'Route not found') } as const
    assert.equal(domainMessage(e), null)
  })

  it('preserva o 404 de DOMÍNIO — "não está no bucket" é a informação que distingue o caso', () => {
    const e = {
      kind: 'http',
      status: 404,
      body: envelope(
        'not-found',
        'O arquivo desta remessa não está no armazenamento da VAN — provavelmente é uma remessa antiga, já expurgada.',
      ),
    } as const
    assert.match(domainMessage(e) ?? '', /não está no armazenamento da VAN/)
  })

  it('preserva a mensagem do 422 — é ela que separa as quatro recusas que chegam com o mesmo status', () => {
    const e = {
      kind: 'http',
      status: 422,
      body: envelope('validation', 'Há título já incluído em outra remessa.'),
    } as const
    assert.equal(domainMessage(e), 'Há título já incluído em outra remessa.')
  })

  it('sem envelope parseável não inventa mensagem', () => {
    const e = { kind: 'http', status: 500, body: '<html>502 Bad Gateway</html>' } as const
    assert.equal(domainMessage(e), null)
  })

  it('erro de transporte (sem corpo HTTP) não tem mensagem de backend', () => {
    assert.equal(domainMessage({ kind: 'network' }), null)
    assert.equal(domainMessage({ kind: 'timeout' }), null)
  })
})
