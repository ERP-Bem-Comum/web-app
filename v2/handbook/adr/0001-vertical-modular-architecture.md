[← Voltar para ADRs](./README.md)

# ADR-0001: Arquitetura vertical-modular (modules/shared/external + public-api)

- **Status:** Accepted — layout interno do módulo **refinado por [ADR-0004](./0004-client-server-split-mvvm-ddd.md)** (split client/server)
- **Date:** 2026-05-29
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O `handbook/arquiteture.md` descrevia uma estrutura `features/` + `lib/` + `server/` +
`components/ui/`. Ao iniciar o v2 do zero, surgiu a pergunta: **qual layout de pastas adotar?**

Restrições/forças:
- O backend `core-api` é um **modular monolith** (ADR-0006 do core-api): `src/modules/<m>/` com
  `domain/application/adapters/public-api/`, `shared/` e cross-módulo **só via `public-api`**.
- Times com **agentes de IA** vão mexer no código — previsibilidade e fronteiras explícitas reduzem erro.
- Desejo de **paridade de mental model** front↔back (mesmo vocabulário, mesma forma de isolar módulos).
- TanStack Start não impõe layout além de `src/routes/` (file-based router).

## Decisão

Adotar **arquitetura vertical-modular espelhando o core-api**:

```
src/modules/<módulo>/{domain, application, adapters, ui, public-api}
src/shared/   (cross-cutting PURO: primitives, http, ports, utils, ui)
src/external/ (adapters de I/O real + segredos: core-api client, config, session)
```

- Cada módulo expõe um **`public-api/`** — único ponto pelo qual outro módulo o importa.
- Fronteiras **enforçadas por lint** (`eslint-plugin-boundaries`): `domain` puro; `external` nunca
  importa módulos; um módulo nunca importa internals de outro (só `public-api`/`shared`/`external`).
- Materializado na **constituição v1.1.0** (§III + §"Technology Constraints") e no `eslint.config.js`.

## Consequências

**Positivas**
- Cada módulo é extraível/testável isoladamente; acoplamento entre módulos não apodrece silenciosamente.
- Mesmo contrato do backend → menos carga cognitiva para quem transita front↔back.
- Agentes de IA têm fronteiras verificáveis (o lint reprova violação, não é convenção opcional).

**Negativas / custos**
- Mais cerimônia (cada módulo tem `public-api`); diverge do exemplo "cru" do TanStack Start.
- Diverge do `handbook/arquiteture.md` original — exigiu nota de divergência (feita).

**Neutras**
- `routes/`, `router*`, `start*` ficam fora da matriz de camadas (composition root / framework glue).

## Alternativas consideradas

- **Manter `features/lib/server` do handbook** — rejeitada: perde a paridade com o core-api e o
  conceito de `public-api`/`external` que o P.O. quis como padrão de isolamento.
- **Layout "cru" do TanStack Start** (tudo em `routes/` + libs soltas) — rejeitada: sem fronteiras,
  não serve a um ERP multi-módulo com vários autores/agentes.

## Referências

- `.specify/memory/constitution.md` §III e §"Technology Constraints & Stack"
- `eslint.config.js` (boundaryElements / boundaryRules)
- `core-api/handbook/architecture/adr/0006-modular-monolith-core-api.md` (modelo)
- `handbook/arquiteture.md` (nota de divergência no topo de "Estrutura de pastas")
