/**
 * Use-case da LISTA de Planejamento (#372/#373): agora que o core projeta `partnersCount`/`networkKind` e o
 * `updatedByRef`, o use-case NÃO faz mais fan-out por item — mapeia direto e resolve o nome do autor em UMA
 * chamada deduplicada. Cobre: mapeamento de rede (incl. mista/null), partnersCount, e a resolução do autor.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err, isOk } from '#shared/primitives/result.ts'
import {
  createListBudgetPlans,
  type BudgetPlansCoreClient,
  type RawPlanItem,
  type ResolveUserNames,
} from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'

const rawItem = (over: Partial<RawPlanItem>): RawPlanItem => ({
  id: 'p1',
  year: 2026,
  status: 'RASCUNHO',
  version: '1.0',
  programRef: 'prog-1',
  programName: 'Prog',
  totalInCents: 0,
  updatedAt: '2026-07-12T00:00:00.000Z',
  updatedByRef: null,
  partnersCount: 0,
  networkKind: null,
  parentId: null, // #423 — default: plano-raiz
  scenarioName: null,
  ...over,
})

/**
 * Double do client. `budgetsOf`/`resultsOf` alimentam a derivação interina do total (#458): o core-api soma o
 * `valueInCents` INFORMADO (que ninguém preenche → 0), então o BFF soma os LANÇAMENTOS. Sem eles, o double
 * devolve vazio — e o total cai no do core, como manda o best-effort.
 */
const clientOf = (
  items: readonly RawPlanItem[],
  opts: Readonly<{
    budgetsOf?: Readonly<Record<string, readonly string[]>>
    resultsOf?: Readonly<Record<string, number>>
    failHeader?: boolean
    onCall?: (what: string) => void
  }> = {},
): BudgetPlansCoreClient => ({
  listBudgetPlans: () => Promise.resolve(ok({ items, total: items.length })),
  getProgramOptions: () => Promise.resolve(ok([{ ref: 'prog-1', abbreviation: 'PG' }])),
  getPlanDetailHeader: (id) => {
    opts.onCall?.(`header:${id}`)
    if (opts.failHeader === true) return Promise.resolve(err('unexpected'))
    return Promise.resolve(
      ok({
        id,
        year: 2026,
        status: 'RASCUNHO' as const,
        version: '1.0',
        programName: 'Prog',
        totalInCents: 0,
        budgets: (opts.budgetsOf?.[id] ?? []).map((bid) => ({
          budgetId: bid,
          partnerKind: 'state' as const,
          partnerRef: 'CE',
          valueInCents: 0, // ⟵ o que o core-api guarda: SEMPRE zero (#458)
        })),
      }),
    )
  },
  getBudgetResults: (budgetId) => {
    opts.onCall?.(`results:${budgetId}`)
    const cents = opts.resultsOf?.[budgetId] ?? 0
    return Promise.resolve(ok([{ subcategoryRef: 'sub-1', month: 1, valueInCents: cents }]))
  },
})

const params = { page: 1, limit: 10 } as const
const noNames: ResolveUserNames = () => Promise.resolve(new Map())

describe('createListBudgetPlans — #372 networkKind + partnersCount', () => {
  it('mapeia state/municipality/mixed/null → ESTADO/MUNICIPIO/MISTO/ESTADO e passa partnersCount', async () => {
    const client = clientOf([
      rawItem({ id: 'a', networkKind: 'state', partnersCount: 2 }),
      rawItem({ id: 'b', networkKind: 'municipality', partnersCount: 5 }),
      rawItem({ id: 'c', networkKind: 'mixed', partnersCount: 7 }),
      rawItem({ id: 'd', networkKind: null, partnersCount: 0 }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual(
      res.value.items.map((i) => i.networkKind),
      ['ESTADO', 'MUNICIPIO', 'MISTO', 'ESTADO'],
    )
    assert.deepEqual(
      res.value.items.map((i) => i.partnersCount),
      [2, 5, 7, 0],
    )
  })
})

describe('createListBudgetPlans — #373 autor resolvido em 1 chamada deduplicada', () => {
  it('resolve updatedByName; ref null → null; ref não resolvido → null; dedup de refs', async () => {
    const calls: (readonly string[])[] = []
    const resolve: ResolveUserNames = (refs) => {
      calls.push(refs)
      return Promise.resolve(new Map(refs.filter((r) => r !== 'ghost').map((r) => [r, `Nome-${r}`])))
    }
    const client = clientOf([
      rawItem({ id: 'a', updatedByRef: 'u1' }),
      rawItem({ id: 'b', updatedByRef: 'u1' }), // mesmo autor → dedup
      rawItem({ id: 'c', updatedByRef: 'u2' }),
      rawItem({ id: 'd', updatedByRef: null }), // sem autor
      rawItem({ id: 'e', updatedByRef: 'ghost' }), // não resolvido
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: resolve })(params, 'tok')
    assert.ok(isOk(res))
    const names = res.value.items.map((i) => i.updatedByName)
    assert.deepEqual(names, ['Nome-u1', 'Nome-u1', 'Nome-u2', null, null])
    // uma única chamada, com refs deduplicados (u1, u2, ghost)
    assert.equal(calls.length, 1)
    assert.deepEqual([...(calls[0] ?? [])].sort(), ['ghost', 'u1', 'u2'])
  })

  it('sem nenhum updatedByRef → não chama resolveUserNames', async () => {
    let called = false
    const resolve: ResolveUserNames = () => {
      called = true
      return Promise.resolve(new Map())
    }
    const client = clientOf([rawItem({ id: 'a', updatedByRef: null })])
    await createListBudgetPlans({ client, resolveUserNames: resolve })(params, 'tok')
    assert.equal(called, false)
  })
})

// ── #423: aninhar cenários sob o plano-pai ───────────────────────────────────
describe('createListBudgetPlans — #423 árvore de cenários', () => {
  it('cenário com parentId vira FILHO do pai, e some do topo', async () => {
    const client = clientOf([
      rawItem({ id: 'pai', version: '1.0' }),
      rawItem({ id: 'cen', version: '1.1', parentId: 'pai', scenarioName: 'Inicial' }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))

    assert.deepEqual(
      res.value.items.map((i) => i.id),
      ['pai'],
    )
    assert.deepEqual(
      res.value.items[0]?.children.map((c) => c.id),
      ['cen'],
    )
    assert.equal(res.value.items[0]?.children[0]?.scenarioName, 'Inicial')
  })

  it('o FILHO mantém a riqueza da linha (valor, rede, autor) — é o motivo de não usar /:id/children', async () => {
    const client = clientOf([
      rawItem({ id: 'pai' }),
      rawItem({
        id: 'cen',
        parentId: 'pai',
        totalInCents: 3_243_872,
        partnersCount: 1,
        networkKind: 'state',
      }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))

    const child = res.value.items[0]?.children[0]
    assert.equal(child?.totalInCents, 3_243_872)
    assert.equal(child?.partnersCount, 1) // "1 estados" do HANDBOOK §1.1
    assert.equal(child?.networkKind, 'ESTADO')
  })

  it('ordena os filhos por VERSÃO ascendente, não pela ordem do core', async () => {
    const client = clientOf([
      rawItem({ id: 'pai', version: '1.0' }),
      rawItem({ id: 'c2', version: '1.2', parentId: 'pai' }),
      rawItem({ id: 'c1', version: '1.1', parentId: 'pai' }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual(
      res.value.items[0]?.children.map((c) => c.id),
      ['c1', 'c2'],
    )
  })

  it('ÓRFÃO (pai fora do resultado) sobe como raiz — nunca some da tela', async () => {
    const client = clientOf([rawItem({ id: 'orfao', parentId: 'pai-filtrado-fora' })])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual(
      res.value.items.map((i) => i.id),
      ['orfao'],
    )
  })

  it('core-api SEM o #423 (parentId sempre null) → lista flat, como antes', async () => {
    const client = clientOf([rawItem({ id: 'a' }), rawItem({ id: 'b' })])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual(
      res.value.items.map((i) => i.id),
      ['a', 'b'],
    )
    assert.ok(res.value.items.every((i) => i.children.length === 0))
  })
  it('NETO aninha sob o filho — árvore de 3 níveis (HANDBOOK §1.1: "2.0 pode ter seu próprio chevron")', async () => {
    // Ciclo de vida real: plano 1.0 aprovado → calibração 2.0 → cenários 2.1/2.2 pendurados NA CALIBRAÇÃO.
    const client = clientOf([
      rawItem({ id: 'plano', version: '1.0' }),
      rawItem({ id: 'calib', version: '2.0', parentId: 'plano' }),
      rawItem({ id: 'cen1', version: '2.1', parentId: 'calib', scenarioName: 'Teste' }),
      rawItem({ id: 'cen2', version: '2.2', parentId: 'calib' }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))

    assert.deepEqual(
      res.value.items.map((i) => i.id),
      ['plano'],
    )
    const calib = res.value.items[0]?.children[0]
    assert.equal(calib?.id, 'calib')
    // O bug que isto trava: pendurar só nas RAÍZES fazia os netos sumirem da tela.
    assert.deepEqual(
      calib?.children.map((c) => c.id),
      ['cen1', 'cen2'],
    )
  })

  it('ciclo de parentId (dado corrompido) → os nós sobem soltos, não somem nem travam', async () => {
    const client = clientOf([
      rawItem({ id: 'raiz' }),
      rawItem({ id: 'a', parentId: 'b' }),
      rawItem({ id: 'b', parentId: 'a' }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual([...res.value.items.map((i) => i.id)].sort(), ['a', 'b', 'raiz'])
  })
})

// INTERINO #458: o core-api soma o `valueInCents` INFORMADO do orçamento — campo que ninguém preenche (a P.O.
// decidiu que ele não existe no legado; o front manda 0). A lista mostrava R$ 0,00 em TODO plano enquanto o
// Detalhe do MESMO plano mostrava o valor real. Dois números pro mesmo plano é pior que um número feio.
describe('createListBudgetPlans — total DERIVADO dos lançamentos (#458)', () => {
  it('soma os lançamentos de todas as redes do plano', async () => {
    const client = clientOf([rawItem({ id: 'p1', partnersCount: 2, totalInCents: 0 })], {
      budgetsOf: { p1: ['bg-a', 'bg-b'] },
      resultsOf: { 'bg-a': 1000, 'bg-b': 500 },
    })
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res))
    assert.equal(res.value.items[0]?.totalInCents, 1500) // e NÃO o 0 que o core mandou
  })

  // A decisão que mantém o fan-out barato: sem rede, o total é zero DE VERDADE — não há o que buscar.
  it('plano SEM rede: não chama o servidor e fica com 0', async () => {
    const calls: string[] = []
    const client = clientOf([rawItem({ id: 'p-vazio', partnersCount: 0 })], {
      onCall: (w) => calls.push(w),
    })
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res))
    assert.equal(res.value.items[0]?.totalInCents, 0)
    assert.deepEqual(calls, []) // nenhuma ida ao servidor
  })

  it('busca SÓ os planos com rede (a página não paga pelos vazios)', async () => {
    const calls: string[] = []
    const client = clientOf(
      [
        rawItem({ id: 'com-rede', partnersCount: 1 }),
        rawItem({ id: 'vazio-1', partnersCount: 0 }),
        rawItem({ id: 'vazio-2', partnersCount: 0 }),
      ],
      { budgetsOf: { 'com-rede': ['bg-1'] }, resultsOf: { 'bg-1': 700 }, onCall: (w) => calls.push(w) },
    )
    await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.deepEqual(calls, ['header:com-rede', 'results:bg-1']) // 2 chamadas, não 6
  })

  // Best-effort: um total que falha não pode derrubar a LISTA inteira — ela é a tela de entrada do módulo.
  // ⚠️ `totalInCents: 0` DE PROPÓSITO: com um total não-zero o plano nem entra na derivação (o core manda),
  // e o teste passaria sem exercitar a falha — foi o que aconteceu na 1ª versão deste teste.
  it('falha ao derivar → a LISTA não cai; o plano fica com o total do core', async () => {
    const client = clientOf(
      [rawItem({ id: 'p1', partnersCount: 1, totalInCents: 0 }), rawItem({ id: 'p2', partnersCount: 0 })],
      { failHeader: true },
    )
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res)) // ⟵ o que importa: `ok`, não `err`
    assert.equal(res.value.items.length, 2) // nenhum plano some por causa de um total
    assert.equal(res.value.items[0]?.totalInCents, 0)
  })

  it('rede que falha no meio → soma as que deram, não zera o plano inteiro', async () => {
    // `bg-b` não está em `resultsOf` → devolve 0; `bg-a` soma normal. Uma rede ruim não apaga a boa.
    const client = clientOf([rawItem({ id: 'p1', partnersCount: 2, totalInCents: 0 })], {
      budgetsOf: { p1: ['bg-a', 'bg-b'] },
      resultsOf: { 'bg-a': 800 },
    })
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res))
    assert.equal(res.value.items[0]?.totalInCents, 800)
  })

  // A regra que faz este remendo se aposentar sozinho — e que impede o pior caso: sobrescrever a resposta
  // CERTA do backend com um palpite nosso.
  it('core mandou um total → ELE MANDA: não deriva e nem chama o servidor (#458 se auto-desliga)', async () => {
    const calls: string[] = []
    const client = clientOf([rawItem({ id: 'p1', partnersCount: 1, totalInCents: 999_999 })], {
      budgetsOf: { p1: ['bg-a'] },
      resultsOf: { 'bg-a': 1 }, // se derivasse, daria 1 e destruiria o 999.999 do core
      onCall: (w) => calls.push(w),
    })
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res))
    assert.equal(res.value.items[0]?.totalInCents, 999_999)
    assert.deepEqual(calls, []) // no dia do #458, o fan-out some sem PR nenhum
  })

  it('soma os 12 meses da rede — o anual é Σ dos meses (#413), não o último', async () => {
    const client = clientOf([rawItem({ id: 'p1', partnersCount: 1 })], {
      budgetsOf: { p1: ['bg-a'] },
      resultsOf: { 'bg-a': 100 },
    })
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 't')
    assert.ok(isOk(res))
    assert.equal(res.value.items[0]?.totalInCents, 100)
  })
})
