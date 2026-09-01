/**
 * Borda do PRÉ-VOO da remessa (puro, node:test) — core-api#794/#804.
 *
 * O que se prova aqui é a política de INTOLERÂNCIA do schema, que é deliberada e contrária ao resto do
 * módulo (onde enums e campos derivados são drift-tolerantes):
 *
 *  - **contador ausente NÃO é tolerado.** Um `readyCount` aceito como zero diria "nada a enviar" a quem
 *    tem título para pagar — o silêncio aqui é pior que a falha, e por isso vira `err('server')`.
 *  - **`valueCents` (o valor DO TÍTULO, renomeado de `netValueCents`) não tem default.** Se o backend
 *    regredir o nome, a tela precisa falhar alto em vez de exibir R$ 0,00 num comprovante de pagamento.
 *
 * E que campo DESCONHECIDO do backend passa sem ruído: o core-api#804 devolve `batches[]` (a composição
 * dos lotes), que não lemos — a P.O. avaliou o painel em tela e concluiu que não acrescenta à
 * conferência. Ignorar não pode custar a conferência inteira.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  previewToModel,
  generatedToModel,
} from '../../../../../src/modules/financial/server/adapters/core-api/remittance.mappers.ts'
import { isOk, isErr } from '../../../../../src/shared/primitives/result.ts'
import type { PreviewLineStatus } from '../../../../../src/modules/financial/server/domain/remittance.io.ts'

const line = {
  payableId: 'p-1',
  documentId: 'd-1',
  status: 'ready',
  route: 'pix',
  gaps: [],
  valueCents: '25000',
}

const raw = (over: Record<string, unknown> = {}): unknown => ({
  lines: [line],
  readyCount: 1,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  notApprovedCount: 0,
  readyTotalCents: '25000',
  blockedTotalCents: '0',
  ...over,
})

describe('previewToModel — o que se tolera', () => {
  it('campo que não lemos (`batches` do #804) passa sem derrubar a conferência', () => {
    const r = previewToModel(
      raw({
        batches: [
          {
            launchForm: '41',
            launchFormLabel: 'TED outra titularidade',
            payeeBankCode: '341',
            count: 1,
            totalCents: '25000',
          },
        ],
      }),
    )
    assert.ok(isOk(r))
    assert.equal(r.value.lines.length, 1)
    assert.equal(r.value.readyCount, 1)
  })
})

describe('previewToModel — status da linha', () => {
  // core-api#792/ADR-0065 §5. Este caso existe porque o defeito que ele prende era INVISÍVEL: o
  // fallback de drift manda status desconhecido para `blocked`, que é o default seguro para o
  // dinheiro — a linha não entra na remessa. Mas para quem opera, `blocked` significa "corrija o
  // cadastro", e não havia cadastro a corrigir: o título já tinha sido pago. O operador ficava
  // olhando um cadastro completo sem entender a linha vermelha.
  it('`transmitted` é status PRÓPRIO, não cai no fallback de `blocked`', () => {
    const r = previewToModel(raw({ lines: [{ ...line, status: 'transmitted' }] }))
    assert.ok(isOk(r))
    assert.equal(r.value.lines[0]?.status, 'transmitted')
  })

  // core-api#837/PR #925. MESMO defeito do `transmitted` acima, e é a SEGUNDA vez: um status novo do
  // backend nasce fora do `LINE_STATUSES` e a linha fica vermelha sem motivo. Aqui o cadastro pode
  // estar completo — o que falta é o emissor da rota, e nenhuma correção do operador resolve.
  //
  // ⚠️ Só PIX e guia produzem este status. Boleto e transferência TÊM emissor (`ROUTES_WITH_ISSUER`),
  // e é por isso que o boleto não regride com o #925.
  it('`no-issuer` é status PRÓPRIO, não cai no fallback de `blocked`', () => {
    const r = previewToModel(raw({ lines: [{ ...line, status: 'no-issuer' }] }))
    assert.ok(isOk(r))
    assert.equal(r.value.lines[0]?.status, 'no-issuer')
  })

  // A GUARDA QUE FECHA A PORTA, em vez de prender mais um caso: o conjunto do mapper e a união do
  // domínio têm de ser o mesmo conjunto. Foi a divergência entre os dois que produziu o `transmitted`
  // e o `no-issuer` — duas vezes o mesmo esquecimento, cada uma custando uma tela ilegível em
  // produção. Um status novo no domínio agora reprova AQUI, antes de chegar ao operador.
  it('governança: todo status do domínio é conhecido pelo mapper (sem drift silencioso)', () => {
    const DOMAIN_STATUSES = [
      'ready',
      'blocked',
      'out-of-van',
      'not-found',
      'not-approved',
      'transmitted',
      'no-issuer',
    ] as const satisfies readonly PreviewLineStatus[]

    for (const status of DOMAIN_STATUSES) {
      const r = previewToModel(raw({ lines: [{ ...line, status }] }))
      assert.ok(isOk(r))
      assert.equal(
        r.value.lines[0]?.status,
        status,
        `\`${status}\` caiu no fallback de drift — acrescente-o a LINE_STATUSES no mapper, e uma ` +
          `frase própria em remittance-preview.view-model.ts. Ver o histórico de #792 e #837.`,
      )
    }
  })

  it('status realmente desconhecido continua caindo em `blocked` — o default seguro é "não sai"', () => {
    const r = previewToModel(raw({ lines: [{ ...line, status: 'algo-que-nao-existe' }] }))
    assert.ok(isOk(r))
    assert.equal(r.value.lines[0]?.status, 'blocked')
  })

  // O contador novo do #792 é ignorado de propósito (o fato já vem por linha). Se um dia alguém
  // decidir lê-lo, que seja por escolha — não porque o schema o deixou entrar sem querer.
  it('`transmittedCount` do backend passa sem derrubar a conferência, e não é lido', () => {
    const r = previewToModel(raw({ transmittedCount: 3 }))
    assert.ok(isOk(r))
    assert.ok(!('transmittedCount' in r.value))
  })
})

describe('previewToModel — o que NÃO se tolera', () => {
  it('⚠️ contador ausente falha alto: um zero aceito diria "nada a enviar" a quem tem o que pagar', () => {
    const { readyCount: _omit, ...semContador } = raw() as Record<string, unknown>
    const r = previewToModel(semContador)
    assert.ok(isErr(r))
    assert.equal(r.error, 'server')
  })

  it('⚠️ `valueCents` ausente falha alto — sem default, a renomeação não passa em silêncio', () => {
    const r = previewToModel(raw({ lines: [{ ...line, valueCents: undefined }] }))
    assert.ok(isErr(r))
    assert.equal(r.error, 'server')
  })
})

/**
 * GERAÇÃO — o contrato do LOTE (core-api#929).
 *
 * Estes casos existem porque a ausência deles custou caro em 01/09/2026: o core-api passou a devolver
 * `{ files: [...] }` (a remessa é repartida por MODALIDADE) e o front seguia validando a forma antiga.
 * O `safeParse` recusava, `generatedToModel` devolvia `err('server')` e a tela dizia "Algo deu errado"
 * — DEPOIS de o backend ter alocado o NSA e transmitido o título. Três NSA queimados, um por clique,
 * cada um irrecuperável.
 *
 * `generatedToModel` não tinha teste algum. Era a única função do caminho do dinheiro sem rede.
 */
const file = (over: Record<string, unknown> = {}) => ({
  remittanceId: 'r1',
  fileName: 'PAG_435366.01092026204605_000007.REM',
  objectKey: 'saida/PAG_435366.01092026204605_000007.REM',
  nsa: 7,
  totalCents: '300',
  lineCount: 6,
  ...over,
})

describe('generatedToModel — contrato do lote', () => {
  it('aceita `{ files: [...] }` e preserva o arquivo', () => {
    const r = generatedToModel({ files: [file()] })
    assert.ok(isOk(r))
    assert.equal(r.value.files.length, 1)
    assert.equal(r.value.files[0]?.nsa, 7)
  })

  it('⚠️ seleção MISTA: preserva TODOS os arquivos, não só o primeiro', () => {
    // Boleto e transferência não cabem no mesmo lote. Ficar com o primeiro faria o comprovante
    // descrever metade do que foi enfileirado no banco — e o operador confirmaria assim mesmo.
    const r = generatedToModel({
      files: [file(), file({ remittanceId: 'r2', nsa: 8, fileName: 'PAG_...008.REM' })],
    })
    assert.ok(isOk(r))
    assert.equal(r.value.files.length, 2)
    assert.deepEqual(
      r.value.files.map((f) => f.nsa),
      [7, 8],
    )
  })

  it('a forma ANTIGA (arquivo cru, sem `files`) é recusada — foi ela que queimou NSA em 01/09', () => {
    const r = generatedToModel(file())
    assert.ok(isErr(r))
    assert.equal(r.error, 'server')
  })

  it('lista VAZIA é recusada: geração sem arquivo não é sucesso', () => {
    // Um comprovante em branco descreveria um pagamento que já foi enfileirado. Falhar alto é o certo.
    const r = generatedToModel({ files: [] })
    assert.ok(isErr(r))
  })

  it('`nsa` ausente falha alto — sem default, um comprovante não mente sobre o que já saiu', () => {
    const { nsa: _omitted, ...semNsa } = file()
    const r = generatedToModel({ files: [semNsa] })
    assert.ok(isErr(r))
  })
})
