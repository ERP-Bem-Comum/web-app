# Phase 0 — Research: Fundação Técnica do v2

Todas as NEEDS CLARIFICATION resolvidas. Formato: Decisão / Rationale / Alternativas.

## R1 — Envelope de erro do core-api (contrato real)

**Decisão**: O envelope de erro de TODO 4xx/5xx do core-api é
`{ "error": { "code": string, "message": string, "requestId": string } }`. **Não** existe
`issues[]`/`errors[]`. `map-to-app-error` mapeia por **status HTTP** e extrai `code`/`message`/
`requestId` para contexto. Validação por campo é feita no BFF (Zod), pois o backend não vaza issues.

**Rationale**: Confirmado na fonte pelo `core-api-consultant`:
- `core-api/src/shared/http/errors.ts:19-35` — `ErrorEnvelope = { error: { code, message, requestId } }`.
- Validação (400): colapsa para `code: "validation"`, mensagem fixa "Request validation failed" — sem detalhe por campo.
- Domínio (`reply.ts:31-37`): `code` e `message` recebem **ambos** o slug kebab-case (ex.: `invalid-credentials`).
- Slugs por status: `invalid-credentials`→401, `user-disabled`→403, `*-not-found`→404, `email-already-registered`→409, `*-unavailable`→503, `internal`→500.

**Alternativas consideradas**: assumir o envelope genérico do handbook (`{ issues: [...] }`) — **rejeitado**: não corresponde ao backend real; quebraria o parsing.

## R2 — Health endpoint

**Decisão**: O core-api expõe `GET /health` → `200 { "status": "ok" }` (sem prefixo `/api/v2`).
A rota de health/smoke do **front** é própria (SSR via `index`), **não** proxia o backend nesta fundação.

**Rationale**: `core-api/src/shared/http/app.ts:162` — `app.get('/health', () => ({ status: 'ok' }))`.
O healthcheck do `docker-compose` (`http://core-api:3000/health`) já está correto. Proxiar o health do
backend é responsabilidade de uma feature de observabilidade futura, não da base.

**Alternativas**: criar server function que proxia `/health` do backend — adiado (não necessário para o MVP da fundação; evita acoplar a base ao backend antes da feature Auth).

## R3 — TanStack Query nesta fundação

**Decisão**: Instalar `@tanstack/react-query` agora (`pnpm add @tanstack/react-query`) e configurar o
`QueryClient` no composition root (`router.tsx`): `queryCache.onError` → se `QueryError` com
`appError.kind === 'auth:expired'`, `queryClient.clear()` + `router.navigate({ to: '/auth/login', search: { redirect } })`;
`mutationCache.onSuccess` → `queryClient.invalidateQueries()`.

**Rationale**: É o server-state oficial (constituição §V e Stack). A cadeia de erro (FR-019) só fecha com
o QueryClient presente. Instalar agora evita retrabalho e valida a integração `QueryError → AppError → UI`.
O eslint-plugin-query já está configurado, sinalizando intenção.

**Alternativas**: adiar para a feature Auth — **rejeitado** pelo usuário (decisão "Query incluso").

## R4 — Modo de dev e portas (anti-conflito)

**Decisão**: Manter vite em `:3000` (host livre). Suportar **dois modos**, documentados no quickstart:
- **Dev local (recomendado p/ HMR rápido)**: expor o core-api ao host adicionando `ports: ['3001:3000']`
  ao serviço `core-api` no `docker-compose.yml`; `pnpm dev` em `:3000`; `CORE_API_URL=http://localhost:3001/api/v2`.
- **Dev dockerizado (paridade com prod)**: `docker compose up -d`; acessar via Caddy em `https://app.localhost`;
  `CORE_API_URL=http://core-api:3000/api/v2` (rede interna). O container `web` deixa de crashar quando `src/` existir.

**Rationale**: host `:3000`/`:3001` confirmados livres (`lsof`). O core-api hoje **não** é exposto ao host
(só Caddy 80/443 + mysql 3306). Para o BFF local alcançar o backend, ou se expõe o core-api, ou se usa o
caminho dockerizado. Oferecer ambos cobre velocidade (local) e fidelidade (docker).

**Alternativas**: expor core-api numa porta != 3001 — indiferente; 3001 escolhida por estar livre e adjacente.
Mudar vite para outra porta — desnecessário (3000 livre).

## R5 — Base do `result-fetch`: nativo vs `ofetch`

**Decisão**: Usar `globalThis.fetch` nativo + `AbortController` + `setTimeout` (snippet do handbook §2),
adaptado para `shared`/`external`. Sem `ofetch`.

**Rationale**: Constituição §VIII (minimal deps; preferir nativo). O snippet do handbook já entrega
`Result<T, HttpError>`, timeout, abort e leitura segura de corpo (JSON ou texto). O v1 usava `ofetch`, mas
a base v2 não precisa de retry sofisticado nesta fundação — pode ser adicionado depois se necessário.

**Alternativas**: `ofetch` (usado no v1) — adiado; reintroduzível se retry/interceptors forem requisitos.

## R6 — `map-to-server-response` (preservar status upstream)

**Decisão**: Implementar conforme handbook §2: `http`→Response com status original + body; `network`/`timeout`→504
`{kind:'connectivity'}`; `parse`→502 `{kind:'bad-gateway'}`; `aborted`→499 (sem corpo); `default` guarda `never`.

**Rationale**: Mantém o status do backend visível ao client (que reconverte para `AppError` via `map-to-app-error`).
Fecha a cadeia server→client (FR-013, FR-019).

**Alternativas**: achatar tudo para 500 — rejeitado (perde semântica; quebra 401→signOut e 404→not-found).

## R7 — `SessionStore` e token

**Decisão**: Nesta fundação, `SessionStore` é só um **port** (type) em `shared/ports/session-store.port.ts`,
sem adapter real. `result-fetch` aceita `token?: string` por argumento. A resolução real de sessão
(cookie HttpOnly, store, refresh) é da **feature Auth** (próxima spec).

**Rationale**: Mantém a base desacoplada de auth; respeita o escopo da spec (Assumptions). O contrato de port
já deixa o terreno pronto para o adapter da feature Auth implementar.

**Alternativas**: implementar session store agora — fora de escopo; pertence à feature Auth.

## R8 — Primitivos vendorizados do core-api (decisão do usuário)

**Decisão**: `shared/primitives/{result,brand,immutable}.ts` são **cópia fiel (vendoring)** de
`core-api/src/shared/primitives/*`. `Result` adota o shape do backend: união por **`.ok` boolean**
(`{ok:true,value} | {ok:false,error}`), com `ok`/`err`/`isOk`/`isErr`/`mapErr`/`combine` —
**sem** `map`/`flatMap`/`mapError`. `Brand` usa `unique symbol` global + `BrandOf`. `immutable`/`deepImmutable` idênticos.

**Rationale**: paridade total de idioma entre front e back (mesmo `Result`, mesmo `Brand`), reduz carga
cognitiva e divergência. O shape do handbook (`.kind`, `map`/`flatMap`/`mapError`) foi **preterido** em
favor do contrato real já em produção no core-api.

**Mecânica**: não se importa através da fronteira do submódulo (`tsconfig` exclui `core-api`, bundler não
cruza). Copia-se o conteúdo para `src/shared/primitives/`. Ao copiar `brand.ts`, **remover** o
`// eslint-disable @typescript-eslint/naming-convention` (regra inexistente na config do v2 → "unused disable").

**Alternativas consideradas**: (a) shape do handbook — rejeitado (diverge do backend); (b) core-api + combinadores
extras (`map`/`flatMap`/`mapError`) — rejeitado pelo usuário (verbatim, superfície mínima idêntica ao back).
Se a ergonomia funcional for necessária depois, `map`/`flatMap` podem ser adicionados como extensão compatível.

## R9 — Fronteira server/client: facade (port type-only) > disciplina de import

**Decisão**: manter `verbatimModuleSyntax: true` (constituição §VII). O risco de leak server→client que o
TanStack Start associa à flag é eliminado **estruturalmente** pelo padrão facade/ports, não só por `import type`.

**Rationale**: o vazamento só ocorre ao importar um **valor** (impl com regras/segredos/I/O). Expondo através
da fronteira apenas a **assinatura** (facade type-only — `shared/ports/*.port.ts`), não há runtime nem segredo
para vazar. Defesa em camadas: (1) arquitetura — `ports` (facade) + `public-api` + boundaries do eslint
impedem `ui → external`; (2) `import type` + `verbatimModuleSyntax` como reforço; (3) `eslint --fix`
automatiza a marcação `import type`. Insight do usuário (2026-05-29): "só a assinatura, não as regras de
negócio — isso sim são leaks".

**Aplicação (Phase 4/5)**: `external/` (I/O real, segredos) nunca é importado por `ui`/client; o que a UI
consome do servidor é (a) o **stub RPC** de `*.server-fn.ts` (split pelo compilador do TanStack Start) e
(b) tipos via `shared/ports`. Validar no T031 (`pnpm build` + inspeção do bundle: nenhum segredo/URL do backend).

**Reavaliar**: se ao construir `external/` o bundle ainda mostrar risco, reconsiderar desligar a flag.
