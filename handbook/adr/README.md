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
| [0005](./0005-auth-session-refresh-decisions.md) | Auth: sessão opaca, refresh single-flight, JWT decode-only, /me só userId | Accepted |
| [0006](./0006-security-headers-csp.md) | Security headers & CSP (middleware global em src/start.ts + Caddy; script-src 'self') | Accepted |
| [0007](./0007-design-system-vanilla-extract.md) | vanilla-extract como engine do design system (zero-runtime, type-safe; Panda/Tailwind rejeitados) | Accepted |
| [0008](./0008-self-host-webfonts-fontsource.md) | Self-host de webfonts via @fontsource (assets puros + provenance; CDN/woff2-manual rejeitados) | Accepted |
| [0009](./0009-framework-agnostic-client.md) | Cliente agnóstico de framework: ViewModel puro + Command, UI como adaptador plugável (binding hook), use-case opcional | Accepted |
| [0010](./0010-bff-orchestration-fn-naming.md) | BFF orquestrador: uma `fn` completa por caso de uso, client não compõe; nomenclatura `.query.fn` / `.service.fn` | Accepted |
| [0011](./0011-no-mocks-in-production.md) | Sem mocks em produção (`src/`): `not-implemented` como placeholder; fixtures só em `tests/` (governance test) | Accepted |

> Próximos ADRs a registrar conforme as decisões surgirem (ex.: i18n, módulo de usuários Zero Trust).
> Decisões já tomadas e ainda não "adritizadas" vivem na constituição e em `specs/*/research.md`.
