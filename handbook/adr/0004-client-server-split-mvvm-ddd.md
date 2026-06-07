[← Voltar para ADRs](./README.md)

# ADR-0004: Separação client (MVVM) × server (BFF/DDD) no módulo + Event Bus + Controller

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

[ADR-0001](./0001-vertical-modular-architecture.md) definiu o módulo vertical como
`modules/<f>/{domain,application,adapters,ui,public-api}`, tratando a feature como **um** slice DDD.
Ao detalhar a primeira feature-modelo (Auth, `specs/002-auth`), o Tech Lead explicitou uma distinção que
o layout achatado não capturava:

> **"Tudo que é front-end é client-side. A Model é só padronização client-side do que o BFF JÁ fez; o
> Repository é só uma porta pra qual API consumir. Pense em tudo que definimos pro BFF como inalterado —
> lá temos o DDD (server-side); aqui no client (FRONT) temos MVVM. Há uma clara diferença entre client e
> server."**

Forças:
- O **server-side** (BFF) faz orquestração real: sessão, tokens, chamada ao `core-api`, segurança. É onde
  o domínio/`Result`/ports fazem sentido (DDD).
- O **client-side** (FRONT) **consome** o BFF e **apresenta**. Não redá o domínio — padroniza o retorno do
  BFF (Model) e orquestra a tela (MVVM). Acoplar os dois no mesmo conjunto de pastas escondia essa fronteira.
- Times com agentes de IA precisam de uma fronteira **óbvia** entre "lógica de servidor" e "lógica de tela".
- O Tech Lead quer **Event Bus** (reatividade declarativa cross-feature) e **Controller** (estado transiente
  de form) como padrões de primeira classe.

## Decisão

Refinar a estrutura interna do módulo para **separar explicitamente client de server**, com a **server
function como fronteira**:

```
modules/<feature>/
├── server/   # BFF, server-side, DDD
│   ├── domain/        # PURO: VOs, Result, regras, *.repository.port.ts, *.events.ts
│   ├── application/   # *.use-case.ts (orquestra core-api + sessão) + ports
│   └── adapters/      # *.server-fn.ts (RPC) + client core-api + *.schema.ts (Zod) + mappers
├── client/   # FRONT, client-side, MVVM
│   ├── data/          # *.model.ts (Zod do retorno do BFF) + *.repository.ts (porta → server-fn)
│   ├── usecase/       # *.use-case.ts (intenção de UI; opcional) — emite eventos no bus
│   ├── view-model/    # *.view-model.ts (TanStack + store; {estado, ações}; assina bus)
│   └── ui/            # *.page.tsx (template burro) + *.controller.ts (form) + *.component.tsx
└── public-api/
```

- **Fronteira client↔server = a server function.** `client/` só toca `server/` **chamando** server
  functions (RPC); nunca importa `server/domain`/`server/application`.
- **Dependência aponta pra dentro** em cada lado. `external/` (I/O + segredos) é server-only.
- **Event Bus** (`shared/bus`): Observer com eventos no passado; `client/usecase` emite, `view-model`
  assina. Opt-in (chamada direta é o default); handlers delegam; sem loops.
- **Controller** (`*.controller.ts`): estado transiente de form, por exceção; entrega ao ViewModel no submit.
- **MVVM (Princípio XI)**: só `*.page.tsx`/`*.component.tsx` são "burros"; `view-model`/`controller` podem
  ter estado.

Materializado na **constituição v1.2.0** (Princípios III, XI, XII) e no `eslint.config.js`.

## Consequências

**Positivas**
- Fronteira client/server explícita e enforçada — agentes/devs sabem onde cada coisa vive.
- Server-side (DDD) e client-side (MVVM) evoluem sem vazar um no outro; token/segredo confinados ao `server/`.
- Event Bus + Controller dão um vocabulário reativo claro para telas (a Auth é a vitrine).

**Negativas / custos**
- Mais pastas por módulo (server/ + client/) — mais cerimônia que o layout achatado do ADR-0001.
- Risco de duplicar tipos (Model client vs domain server) — mitigado: client `data` valida/adapta o
  contrato do BFF, não recria regra de domínio.
- Regras de lint mais elaboradas (server/* × client/* + sufixos de papel na UI).

**Neutras**
- O `client/usecase` é opcional (muitas telas chamam o repository direto pelo view-model).

## Alternativas consideradas

- **Layout achatado do ADR-0001** (`domain/application/adapters/ui`) — rejeitado: escondia a fronteira
  client/server que o Tech Lead considera fundamental.
- **Refresh token / lógica no client** — rejeitado (ADR-0002 + Princípio I): token nunca no browser.
- **Bus como CQRS/event-store** — rejeitado: reatividade simples (Observer), sem a complexidade de CQRS.

## Referências

- Refina o layout interno de [ADR-0001](./0001-vertical-modular-architecture.md) (verticalidade + `public-api`
  permanecem; só a organização interna do módulo muda).
- `.specify/memory/constitution.md` v1.2.0 §III, §XI, §XII.
- `specs/002-auth/spec.md` (Clarifications — origem da decisão) e o guia de arquitetura do Tech Lead.
- `handbook/core-api/01-architecture.md` (DDD server-side de referência).
