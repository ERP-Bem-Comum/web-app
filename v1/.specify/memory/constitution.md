# ERP Financeiro Frontend — Constitution

## Core Principles

### I. Camadas DDD — Domain Puro
O domínio de negócio reside em `src/features/<feature>/domain/` e é **100% livre de frameworks**.
- Nenhum `throw` em `domain/` ou `application/` — erros são modelados como `Result<T, E>`.
- Tipos de ID são *branded types* (`ContractId`, `UserId`) com *smart constructors* que validam e retornam `Result`.
- Regras de negócio (ex: teto de R$ 9.999,99 para Ordem de Serviço) vivem no domain, não no componente React.

### II. Server Functions BFF — Padrão Único de HTTP
Toda integração HTTP com o backend NestJS passa por **Server Functions** (`createServerFn`) em `src/server/`.
- Proibido chamar `fetch` ou `axios` diretamente de componentes ou hooks.
- Cada Server Function exige: `authMiddleware`, `.validator(Zod)`, `resultFetch`, validação de response com Zod, e mapeamento de erro via `mapToServerResponse`.
- O contrato OpenAPI (`handbook/<modulo>/openapi.yaml`) é a fonte da verdade para schemas de input/output.

### III. UI — shadcn/ui + Tailwind para código novo
- Todo código novo usa **shadcn/ui** + **Tailwind CSS** + **lucide-react**.
- Componentes MUI existentes são mantidos em modo legado (`src/legacy/`) e **não podem ser importados** por código novo (ESLint rule).
- Nenhum novo componente MUI será criado.

### IV. Auth via Cookie HttpOnly
- Autenticação usa cookie `HttpOnly` + `Secure` + `SameSite=Strict`.
- Token JWT **nunca** transita no localStorage, sessionStorage ou no body de responses.
- Middleware server-side (`src/server/middleware/auth.ts`) lê o cookie e injeta `context.session`.

### V. Test-First (NON-NEGOTIABLE)
- Toda feature migrada ou criada exige testes antes de merge.
- **Domain**: cobertura mínima de 80% (smart constructors, VOs, regras de negócio).
- **Adapters HTTP**: pelo menos 1 happy path + 1 erro (MSW para mock de rede).
- **Application**: testar use-cases quando houver regra rica.
- Gate de qualidade: `pnpm format:check` + `pnpm lint` + `pnpm typecheck` + `pnpm test:run` + `pnpm build` devem passar.

## Architecture Constraints

### Framework e Build
- **Framework**: TanStack Start (Vite + TanStack Router + Nitro).
- **Router**: file-based em `src/routes/`. Nenhuma rota em `src/app/` (Next.js legado).
- **Build**: `vite build` gera output Nitro; deploy via `firebase.json` apontando para `.output/`.

### TypeScript
- `strict: true` em todo código novo.
- `noImplicitAny: true`.
- `ignoreBuildErrors: false` (será ativado após migração completa).

### Strangler Fig
- Migração é **uma feature por vez**. Nunca duas features em paralelo.
- Código legado vai para `src/legacy/` durante a transição.
- Código novo **nunca** importa de `src/legacy/`.
- Remoção do legado só após smoke E2E passar e 24h sem erros no Sentry.

## Development Workflow

1. **Constitution** → guia todas as decisões técnicas.
2. **Specify** → define o "what" e "why" (user stories, requisitos funcionais).
3. **Plan** → define o "how" (stack, arquitetura, data model).
4. **Tasks** → breakdown acionável com dependências e paralelismo marcado.
5. **Implement** → segue tasks na ordem; TDD quando aplicável.
6. **Quality Gate** → ALL GREEN ou BLOCKED.

## Governance

- Esta constituição **supersedes** qualquer outra prática ou preferência pessoal.
- Alterações requerem: (a) documentação do motivo, (b) aprovação do tech lead, (c) plano de migração se afetar código existente.
- Todo PR deve verificar compliance com a constituição (checklist em template).

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
