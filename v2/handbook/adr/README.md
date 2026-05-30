# ADRs — Architecture Decision Records (Frontend v2)

> Registro versionado das **decisões arquiteturais** do frontend v2 (TanStack Start).
> Cada ADR captura uma decisão, **o porquê** (contexto + alternativas), e suas consequências.
> Estes ADRs são do **frontend v2** — distintos dos ADRs do backend (`core-api/handbook/architecture/adr/`).

## Para que servem

Um ADR responde *"por que o projeto é assim?"* de forma durável. Ao contrário de um comentário
no código (que conta o **o quê**), o ADR registra o **trade-off** que levou à escolha — incluindo
as alternativas **rejeitadas** e por quê. É a fonte que um dev novo (ou um agente de IA) lê para
**entender as intenções** antes de mexer, evitando "desfazer" decisões deliberadas por engano.

**Hierarquia de fontes** (quando duas discordam, vence a de cima):

1. **ADRs aqui aceitos** — imutáveis; para mudar, abra um novo ADR que `supersedes` o anterior.
2. **`.specify/memory/constitution.md`** — princípios normativos (o ADR justifica; a constituição manda).
3. **`handbook/`** (arquitetura, reference/&lt;tech&gt;) e **`CLAUDE.md`**.

## Como escrever um ADR

1. Copie [`0000-template.md`](./0000-template.md) para `NNNN-titulo-em-kebab-case.md` (próximo número).
2. Preencha Contexto → Decisão → Consequências → Alternativas. Foque no **porquê** e nos trade-offs.
3. Status começa em `Proposed`; vira `Accepted` quando decidido; `Superseded by ADR-XXXX` se substituído.
4. Adicione a linha no índice abaixo. Nunca edite um ADR `Accepted` para mudar a decisão — crie um novo.

## Índice

| ADR | Título | Status |
| :-- | :----- | :----- |
| [0001](./0001-vertical-modular-architecture.md) | Arquitetura vertical-modular (modules/shared/external + public-api) | Accepted (layout interno refinado por 0004) |
| [0002](./0002-errors-as-values.md) | Erros como valores (Result) + QueryError como única subclasse de Error | Accepted |
| [0003](./0003-pnpm-v11-supply-chain.md) | pnpm v11 pinado + supply-chain hardening | Accepted |
| [0004](./0004-client-server-split-mvvm-ddd.md) | Separação client (MVVM) × server (BFF/DDD) + Event Bus + Controller | Accepted |

> Próximos ADRs a registrar conforme as decisões surgirem (ex.: feature Auth, sessão/cookie, i18n).
> Decisões já tomadas e ainda não "adritizadas" vivem na constituição e em `specs/*/research.md`.
