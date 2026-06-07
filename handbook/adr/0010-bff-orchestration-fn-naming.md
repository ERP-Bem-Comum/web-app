[← Voltar para ADRs](./README.md)

# ADR-0010: BFF orquestrador — uma `fn` completa por caso de uso; client não compõe; nomenclatura `.query.fn` / `.service.fn`

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O [ADR-0004](./0004-client-server-split-mvvm-ddd.md) fixou o split client × server e definiu a
**server function como a única fronteira** entre os dois. O [ADR-0009](./0009-framework-agnostic-client.md)
levou o client ao mínimo: `data → view-model → ui`, portável entre frameworks. O que faltava era um
princípio explícito sobre **de quem é a obrigação de orquestrar múltiplas origens de dados**.

Hoje o backend não é um só. O `core-api` expõe contratos em `/api/v2` e parceiros em `/api/v1`
(recursos **separados**: `suppliers`, `financiers`, `acts`, `collaborators` — **não há** rota agregadora
`/api/v1/partners`). Amanhã entram outros serviços. Duas tensões apareceram ao religar o módulo de
contratos:

1. **Quem junta as peças?** O combobox de busca de parceiros (em `contract-create`) precisa de parceiros
   de 4 tipos, que vivem em 4 endpoints distintos. Se o client fizer o fan-out, ele passa a conhecer a
   topologia do backend e a montar dados — violando o ADR-0004/0009.
2. **A `fn` devolve OK ou devolve estado?** Uma ação como `reactivate` poderia devolver só `{ ok: true }`,
   forçando o client a refazer um GET para ter o estado novo. Isso empurra orquestração para a UI.

O detalhe de contrato (`getContractFn`) já fazia a coisa certa: o BFF entrega `Contract + Amendment[] +
Document[]` **composto**, e o client só consome. Faltava generalizar isso como cânone.

## Decisão

**O BFF é o guardião e o orquestrador. O client só consome `fn`s completas e gerencia estado de UI.**

1. **O client nunca compõe, agrega, faz fan-out, nem conhece a topologia de backends.** Ele consome
   uma `fn` por caso de uso e cuida só de estado (server-state no TanStack Query; UI-state em
   reducer/máquina). Nada de "buscar A, depois B, e juntar na tela".

2. **O BFF orquestra e conta a história completa.** Uma `fn` específica por necessidade de tela faz o
   fan-out para N origens (`core-api` hoje; serviços B, C… amanhã), mescla, normaliza e devolve **uma
   resposta simples e completa**. Erros continuam sendo valores (`Result`, [ADR-0002](./0002-errors-as-values.md));
   operações sem rota no backend retornam `'not-implemented'` (erro-como-valor), nunca mock.

   ```
   [core-api | svc B | svc C | … svc n]
           ↓  (BFF: fan-out · merge · normaliza · monta a história)
      fnQuery / fnService   ← rota simples e completa, por caso de uso
           ↓
      [client: só consome + estado de UI]
   ```

3. **Comandos devolvem o estado resultante, não só `ok`.** Uma `fn` de escrita (ex.: `reactivate`)
   retorna o agregado já atualizado, para o client apenas trocar o cache — sem refetch manual.

4. **Nomenclatura por intenção** — o arquivo de fronteira passa a declarar se lê ou se age:
   - **`*.query.fn.ts`** — leitura (sem efeito colateral; tipicamente `GET`). Ex.: `get-contract.query.fn.ts`.
   - **`*.service.fn.ts`** — comando/escrita ou orquestração com efeito. Ex.: `create-contract.service.fn.ts`.

   Substitui o sufixo único `*.server-fn.ts`. As fronteiras de import (boundaries) continuam por **pasta**
   (`server/adapters`), então o sufixo é só semântica + lint de `throw` na borda.

## Consequências

**Positivas**
- Client trivial e portável: a regra "view burra" ([ADR-0004](./0004-client-server-split-mvvm-ddd.md) §XI)
  ganha um irmão no server — "client não orquestra".
- Multi-serviço fica natural: somar um backend é mudar **uma** `fn`, sem tocar no client.
- O nome do arquivo revela a intenção (leitura vs efeito) sem abrir o conteúdo.

**Negativas / custos**
- Renomeação em massa dos `*.server-fn.ts` (imports, `public-api`, READMEs, patterns de lint).
- O BFF concentra complexidade de orquestração — precisa de teste de composição/erro parcial.

**Neutras**
- `auth/` (a feature-modelo) **ainda usa `*.server-fn.ts`**; migra em follow-up. O lint aceita os dois
  sufixos durante a transição.

## Alternativas consideradas

- **Client faz o fan-out** — rejeitada: acopla a UI à topologia do backend e fere ADR-0004/0009.
- **Manter `*.server-fn.ts` único** — rejeitada: não distingue leitura de efeito; o Tech Lead quer a
  intenção explícita no nome (`fnQuery | fnService`).
- **Mock/placeholder enquanto o backend não tem rota** — rejeitada: viola [ADR-0002](./0002-errors-as-values.md);
  usamos `'not-implemented'` como valor.

## Adendo (2026-06-07) — o fan-out de parceiros virou 1 chamada ao agregador

O core-api passou a expor o agregador **`GET /api/v1/partners`** (PR #20 `003-partners-aggregator-export`),
que não existia quando este ADR foi escrito. O BFF da busca de parceiros (`core-api-partners.ts`)
**deixou de fazer o fan-out de 4 GETs** e passa a fazer **uma única chamada** ao agregador.

**A decisão central deste ADR não muda:** o BFF continua sendo o orquestrador e o client continua sem
conhecer a topologia do backend (consome a mesma `searchPartnersFn`, com o mesmo contrato). O que mudou é
apenas **onde** a composição acontece — antes no BFF (fan-out + merge), agora no core-api (agregador
nativo). O princípio "o client nunca compõe/agrega/faz fan-out" segue valendo: o fan-out simplesmente
saiu de cena porque o backend passou a entregar a lista já unificada. Detalhes: `core-api-partners.ts`
e o `api-readiness-report.md` da spec 008.

## Referências

- [ADR-0002](./0002-errors-as-values.md) — erros como valores (`Result`); base do `'not-implemented'`.
- [ADR-0004](./0004-client-server-split-mvvm-ddd.md) — split client × server; server fn é a fronteira.
- [ADR-0009](./0009-framework-agnostic-client.md) — client agnóstico e mínimo.
- `src/modules/contracts/README.md` — combobox de parceiros (agregador) e update (PATCH real).
