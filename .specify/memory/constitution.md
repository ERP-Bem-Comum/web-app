# Constituição do web-app (Frontend ERP Bem Comum)

> **O que é este documento.** A constituição **resume e fixa** os princípios não-negociáveis que
> governam `src/` deste pacote (frontend v2 — TanStack Start + React 19 + BFF unificado), para guiar
> o fluxo spec-kit (specify → plan → tasks → analyze → implement) e qualquer assistente de IA.
>
> **Fonte de verdade e precedência.** Esta constituição **não substitui** o cânone; em divergência,
> vencem nesta ordem: **`handbook/adr/`** (ADRs aceitos, imutáveis) → **`handbook/`** → **`AGENTS.md`**
> + **`.claude/rules/`** → esta constituição. Não duplique regras: referencie o ADR/lint que as enforça.
> A **autoridade técnica executável** é o `eslint.config.js` (boundaries + regras customizadas) e o
> `tsconfig.json` — se um princípio aqui divergir do lint, o lint é a verdade e o texto é o bug.
>
> **Nota histórica (2026-06-07).** Até esta data, o arquivo neste slot continha, por engano da
> reestruturação `v2/ → raiz`, a **constituição do core-api** (backend). Os princípios do web-app já
> viviam distribuídos nos ADRs 0001–0012; este documento os **materializa** e consolida. A constituição
> do backend vive em `../core-api/.specify/memory/constitution.md` e **não governa este pacote**.

## Princípios fundamentais

> Convenção: **MUST / MUST NOT** = invariante enforçada (lint/teste/ADR). A numeração §I–§XII é
> **estável** — ADRs e código referenciam seções por número (ex.: "§III split", "§XI views burras",
> "§XII eventos"). Não renumere; adicione no fim ou emende com `supersedes`.

### I. Arquitetura Vertical-Modular com Isolamento por Módulo

Cada feature vive em `src/modules/<m>/` como uma fatia vertical com **split explícito** `server/`
(BFF/DDD) × `client/` (MVVM). O **único** ponto de import externo de um módulo MUST ser
`public-api/index.ts`; cross-módulo MUST NOT importar `domain/`, `application/`, `data/` ou internals
de outro módulo. Fora dos módulos: `shared/` (puro, cross-cutting), `external/` (I/O + segredos,
server-only), `app/` (bootstrap), `routes/` (composition root), `start.ts` (middleware global).

- **Racional.** Fronteiras explícitas evitam acoplamento acidental entre features e mantêm cada módulo
  trocável e testável isoladamente.
- **Enforcement.** `eslint-plugin-boundaries` (`eslint.config.js` → `boundaryElements`/`boundaryRules`);
  ADR-0001 (vertical-modular), ADR-0004 (split client×server). Feature-modelo: `src/modules/auth/`.
- **Cânone (Evans, *Domain-Driven Design*, p.211):**
  > "An individual BOUNDED CONTEXT still does not provide a global view. […] People on other teams
  > won't be very aware of the CONTEXT bounds and will unknowingly make changes that blur the edges or
  > complicate the interconnections. When connections must be made between different contexts, they tend
  > to bleed into each other."

### II. Erros como Valores

Falhas esperadas MUST ser modeladas como `Result<T,E>` (`{ ok: true, value } | { ok: false, error }`,
`src/shared/primitives/result.ts`). MUST NOT usar `throw`/`try-catch` no domínio/aplicação; quando uma
API nativa lança, o `catch` na borda MUST converter para `Result` imediatamente. `QueryError`
(`src/shared/http/query-error.ts`) é a **única** subclasse de `Error` permitida — a ponte com o
TanStack Query. Erros internos MUST ser string-literal unions em inglês kebab-case (ex.:
`'not-implemented'`, `'invalid-format'`).

- **Racional.** Exceções são invisíveis ao compilador e fáceis de engolir; `Result` põe o caminho de
  falha na assinatura e força tratá-lo (errors as values / railway-oriented programming).
- **Enforcement.** ADR-0002; `@typescript-eslint/only-throw-error` ativo (desligado só em `routes/` e
  `*.server-fn|query.fn|service.fn.ts`, onde o framework lança `redirect()`/`notFound()` por design).
  Effect/fp-ts foram explicitamente rejeitados (ADR-0002) — `Result` minimalista, sem lib de efeitos.

### III. A Server Function é a Única Fronteira (Split Client×Server)

O browser MUST NOT falar com o `core-api` (ou qualquer backend) diretamente: toda comunicação
client→backend MUST passar por uma **server function** deste app (RPC do TanStack Start), que
autentica, orquestra, valida e normaliza. O `client/` MUST tocar o `server/` **apenas** via a server
function (pela porta `Repository`), e MUST NOT importar `server/domain` nem `server/application`. O
**BFF orquestra**: faz o fan-out a N origens, mescla e devolve **uma `fn` completa** por caso de uso
(comando de escrita retorna o estado resultante, não só `{ ok: true }`); o client **não compõe** nem
conhece a topologia do backend. A intenção MUST ser declarada pelo sufixo: `*.query.fn.ts` (leitura,
sem efeito) · `*.service.fn.ts` (comando/efeito). Operação ainda inexistente no backend MUST retornar
`Result.err('not-implemented')` — **sem mocks em `src/`** (ADR-0011, governance test).

- **Racional.** Uma única travessia client↔server concentra auth, validação, tratamento de erro e
  confinamento de segredos; o client fica trivial e portável, e somar um backend vira mudar uma `fn`.
- **Enforcement.** ADR-0004, ADR-0009 (Repository = porta), ADR-0010 (orquestração + nomenclatura),
  ADR-0011 (`tests/architecture/no-mocks-in-src.test.ts`); `boundaryRules` (`client-data` só alcança
  `shared` + `server-adapters` da própria feature; `ui` nunca importa `server/`).
- **Cânone (Newman, *Building Microservices*, p.683):**
  > "backend for frontend (BFF) — A server-side component that provides aggregation and filtering for a
  > specific user interface. An alternative to a general-purpose API gateway."
- **Cânone (Evans, *Domain-Driven Design*, p.230):**
  > "Typically for each BOUNDED CONTEXT, you will define a translation layer for each component outside
  > the CONTEXT with which you have to integrate. […] this approach of inserting a translation layer for
  > each external system avoids corruption of the models with a minimum of cost." *(A server fn + os
  > schemas Zod são essa camada de tradução/anti-corrupção entre o core-api e o domínio do front.)*

### IV. Estados Ilegais Irrepresentáveis

Tipos de domínio de folha (value-objects: `Email`, `SessionId`, ids, `Money`…) MUST ser **branded**
(`Brand<T,K>`, `src/shared/primitives/brand.ts`) e só podem ser construídos por um **smart constructor**
que valida e retorna `Result<VO, Error>`; o `as` para o tipo branded só é permitido **dentro** desse
construtor, após a checagem. Brands são restritos a VOs folha — **NUNCA** em agregados. Variantes
mutuamente exclusivas MUST ser **uniões discriminadas** consumidas por `switch` exaustivo com guarda de
exaustividade (`const _: never = x`); adicionar uma variante sem tratá-la MUST quebrar o build.

- **Racional.** Um `string` cru pode ser qualquer coisa; um `Email` branded só existe se passou pelo
  construtor — o estado inválido vira irrepresentável e o compilador propaga a garantia ("parse, don't
  validate" / make illegal states unrepresentable).
- **Enforcement.** ADR-0002; `@typescript-eslint/switch-exhaustiveness-check`. Exemplo:
  `src/modules/auth/server/domain/value-objects/email.value-object.ts`.

### V. Cadeia de Erro Fim-a-Fim — a UI nunca olha status HTTP

O erro MUST trafegar como valor por todo o caminho, e a UI MUST tratá-lo **apenas** por `switch`
exaustivo sobre `AppError.kind` → tag i18n — **nunca** inspecionando status HTTP. A server fn MUST
preservar o status do upstream; o boundary do client reconverte em `AppError`; `401` vira
`signOut + redirect /login` num **único** ponto (cache do TanStack Query).

```
core-api 4xx/5xx → resultFetch → Result.err(HttpError) [external, sem throw]
  → mapToServerResponse → Response (status preservado)  [server fn]
  → queryFn → throw QueryError(mapToAppError(...))       [client boundary]
  → queryCache/mutationCache.onError (401 → signOut)     [client]
  → switch exaustivo em AppError.kind → tag i18n         [ui]
```

- **Racional.** Centralizar a tradução de transporte→domínio→i18n desacopla a UI de detalhes de rede e
  garante tratamento uniforme (ex.: 401 num lugar só).
- **Enforcement.** ADR-0002; `src/external/core-api/result-fetch.ts`, `map-to-server-response.ts`,
  `src/shared/http/map-to-app-error.ts` (switch com guarda `never`).

### VI. TypeScript Estrito e Apagável (migração 6→7)

O projeto MUST compilar sob `strict` completo (`strictNullChecks`, `noUncheckedIndexedAccess`,
`isolatedModules`, `verbatimModuleSyntax`) e o lint MUST estender `strictTypeChecked` +
`stylisticTypeChecked`. MUST NOT usar `any` (use `unknown` + narrowing; `as` só com justificativa ou
dentro de smart constructor). Para a migração TS 6→7 (`erasableSyntaxOnly`): MUST NOT usar `enum`,
`namespace` com runtime, parameter properties ou `import =` — use **união de literais + `as const`** e
**módulos ESM**. Imports/exports só-de-tipo MUST ser `import type`/`export type` (inline).

- **Racional.** Strictness máxima transforma classes inteiras de bug em erro de compilação; sintaxe
  apagável mantém o caminho aberto para o compilador nativo (TS 7 / strip-types).
- **Enforcement.** `tsconfig.json`; `eslint.config.js` (`no-explicit-any`, `no-restricted-syntax` para
  enum/namespace/parameter-property/import=, `consistent-type-imports/exports`).

### VII. Imutabilidade por Padrão

Estruturas de dados MUST ser imutáveis: tipos com `Readonly<>`/`readonly T[]`, valores com `as const`.
Para congelar em runtime, MUST usar as facades `immutable()`/`deepImmutable()`
(`src/shared/primitives/immutable.ts`); MUST NOT chamar `Object.freeze` direto no domínio.

- **Racional.** Imutabilidade elimina bugs de aliasing e estado compartilhado; as facades escondem o
  mecanismo (hoje `Object.freeze`; amanhã Records & Tuples) e documentam intenção.
- **Enforcement.** Tipos do domínio todos `Readonly<…>` (`result.ts`, `app-error.types.ts`,
  `session.types.ts`); `stylisticTypeChecked`.

### VIII. Mínimo de Dependências; Supply-Chain Endurecido

Prefira o nativo (`Intl`, `crypto.randomUUID`, `EventTarget`, `AbortController`) a libs externas. Toda
dependência nova MUST passar pela política de supply-chain do **pnpm 11** (única PM; `npm`/`yarn`
bloqueados): `minimumReleaseAge` (quarentena), `allowBuilds` allowlist explícita (postinstall bloqueado
por padrão), `blockExoticSubdeps`, `trustPolicy: no-downgrade`. MUST NOT usar `dangerouslyAllowAllBuilds`;
publicar dep nova de hoje exige `minimumReleaseAgeExclude` por **versão exata**.

- **Racional.** Cada dependência é superfície de ataque e dívida; a quarentena + allowlist mitigam o
  vetor mais comum (postinstall malicioso) e dão reprodutibilidade.
- **Enforcement.** ADR-0003; `pnpm-workspace.yaml`; hook `block-non-pnpm`; `packageManager` pinado.

### IX. Segurança por Construção

A segurança MUST ser estrutural, em **camadas independentes**: (a) **token NUNCA no browser** — o
cookie `__Host-session` carrega só um `sessionId` opaco; access/refresh tokens vivem no `SessionStore`
server-side; o bundle do client MUST NOT conter `accessToken`/`refreshToken`/`Bearer`/segredo.
(b) cookie blindado por construção (`__Host-` · `HttpOnly` · `Secure` · `SameSite=Strict` · `Path=/`,
sem `Domain`; efêmero por padrão). (c) **validação na fronteira**: Zod no input da server fn **e** no
response do core-api (`*.schema.ts`). (d) headers de segurança (CSP com nonce per-request, HSTS
condicional, nosniff, frame-deny) carimbados no `start.ts` e replicados no Caddy; CSRF re-registrado.
(e) **route guards NÃO protegem server functions** — toda fn protegida MUST anexar a checagem de
auth/origem por conta própria. (f) segredos e I/O reais só em `src/external/` (server-only), nunca com
prefixo `VITE_`.

- **Racional.** A fronteira RPC é diretamente acessível; nenhuma camada basta sozinha — a combinação é
  a defesa. O `core-api` é a autoridade da sessão (rotação/revogação/expiração); o refresh é
  single-flight; o BFF só decodifica o JWT para ler `exp` (decode-only), nunca verifica assinatura.
- **Enforcement.** ADR-0005 (sessão/refresh), ADR-0006 (CSP/headers); `src/external/session/cookie.ts`,
  `src/start.ts`, `src/modules/auth/server/adapters/session.guard.ts`.
- **Cânone (OWASP, *OWASP AI Exchange*, p.144):**
  > "None of these layers is sufficient by itself, which makes the combination of all layers the typical
  > best practice: a defense in depth approach."

### X. Design System "Só-Tokens"

Estilo MUST ser escrito em vanilla-extract (`*.css.ts`, zero-runtime, compilado a CSS estático). Em
`ui/` (atoms/molecules/organisms e `modules/*/client/**/*.css.ts`) é **proibido** cor (hex/rgb/hsl) ou
medida (px) crua — só `vars.*` de `#shared/ui/tokens` (inclusive dentro de template literals); exceção
só em `tokens/` e `*.values.ts`. O design system MUST respeitar o **Atomic Design** com dependência só
"para baixo" (`tokens ← atoms ← molecules ← organisms`). Fontes MUST ser self-hosted (`@fontsource`,
sem CDN — privacidade/LGPD). Strings visíveis MUST vir do i18n (`src/shared/i18n`); organismos são
agnósticos de domínio e recebem textos por props.

- **Racional.** Tokens como fonte única de verdade visual garantem consistência e theming; camadas
  acíclicas mantêm o DS estável e reutilizável; zero-runtime é SSR-safe e sem FOUC em produção.
- **Enforcement.** ADR-0007 (vanilla-extract), ADR-0008 (self-host fonts); `eslint.config.js` (regra
  "só-tokens" + hierarquia `ds-tokens/atom/molecule/organism`). Contrato de tokens em
  `src/shared/ui/tokens/` (contract ≠ values). Atomic Design (Brad Frost).

### XI. MVVM com Views Burras; Server-State ≠ UI-State

Toda tela MUST seguir MVVM: a **ViewModel** orquestra (estado + derivação), a **View** apenas
apresenta. `*.page.tsx`/`*.component.tsx` (e rotas) MUST ser **burras** — recebem tudo por props/binding
e renderizam JSX; MUST NOT usar data-hooks (`useQuery`/`useMutation`), `useReducer`, nem importar
`server/`/`data/`/`use-case`/`server-fn`/`repository` (única exceção: `useState` de interação puramente
local de apresentação). O **núcleo client é agnóstico de framework**: `client/data`, `client/domain` e
`*.view-model.ts`/`*.mutation.ts`/`*.query.ts` MUST NOT importar `react`/`@tanstack/react-*` (só
`@tanstack/query-core`); o acoplamento ao React fica confinado ao `*.binding.ts`. **Server-state**
(dados remotos) MUST viver no TanStack Query; **UI-state** em `useReducer`/máquina de estado tagged ou
`*.controller.ts` — MUST NOT misturar. O render MUST ser puro (sem `Math.random`/`Date.now`/I/O no
corpo; efeitos só em `useEffect`/handlers; SSR-safe). **A camada é o sufixo do arquivo, não a pasta.**

- **Racional.** Concentrar lógica fora da view a torna testável (node:test, sem DOM), trocável
  (React→Solid reescreve só bindings) e legível — a view não decide nada (humble object / passive view).
- **Enforcement.** ADR-0004, ADR-0009, ADR-0012; `eslint.config.js` (bloqueio de data-hooks/`useReducer`
  em views; ban de `react`/`@tanstack/react-*` no núcleo agnóstico); `eslint-plugin-react-hooks`.

### XII. Reatividade por Eventos de Domínio (Event Bus)

A comunicação reativa entre fluxos do client (ex.: "usuário autenticou" → shell reage) MUST usar o
**Event Bus** com eventos nomeados no **passado** (`UsuarioAutenticado`, `SessaoExpirada`), não
chamadas diretas acopladas. Eventos MUST ser fatos imutáveis; emissores e ouvintes MUST NOT se conhecer.

- **Racional.** Observer declarativo desacopla produtores de consumidores e mantém os módulos
  ignorantes uns dos outros, preservando a fronteira de §I.
- **Enforcement.** ADR-0004 (Event Bus como padrão de 1ª classe); `*.events.ts` / `*.bus.ts`
  (ex.: `auth.bus.ts`). Construído sobre `EventTarget` nativo (§VIII).

## Restrições de Tecnologia

Stack fixa (mudar exige ADR novo com `supersedes`): **TanStack Start** (Vite + Nitro) · **React 19** ·
**TypeScript strict** (6→7) · **pnpm 11** · **vanilla-extract** · **Zod 4** · **TanStack Query/Router**.
Dois runners de teste com globs disjuntos: `node:test` (`*.test.ts`, puro, imports relativos) e
**Vitest + jsdom** (`*.spec.ts(x)`, DOM, aliases). Regressão visual via **Playwright** (`e2e/visual/`,
baseline oficial `-linux`). I/O e segredos só em `src/external` (server-only).

## Fluxo de Desenvolvimento & Quality Gates

- **Spec-driven (Spec Kit).** Mudança não-trivial em `src/` MUST passar por specify → plan → tasks →
  analyze → implement (`specs/<NNN>-<slug>/`). Não pule o planejamento.
- **TDD (test-first).** Escreva o teste **antes** da implementação (RED → GREEN). Quando não estiver
  claro se é unitário (`node:test`) ou DOM/comportamento (Vitest), **pergunte**. *(Kent Beck, TDD.)*
- **Gate obrigatório antes de fechar.** `pnpm verify` (typecheck + lint + testes) verde; após mexer em
  UI/CSS, `pnpm test:visual` verde (nunca `test:visual:update` sem revisão humana do diff).
- **Regressão zero.** Qualquer vermelho (teste/lint/typecheck/build/visual) é regressão a corrigir
  agora — "já estava quebrado" não fecha o trabalho.
- **Aprendizado vira artefato.** Decisão arquitetural nova → **ADR**; invariante nova → **regra de lint**
  ou **governance test**; procedimento novo → **guia** no handbook.
- **Commits.** `tipo(<bc>/<scope>): descrição` (PT). Nunca heredoc. PR aponta para **`develop`**.

## Governança

Esta constituição serve ao fluxo spec-kit e está **subordinada** ao cânone (ADRs → handbook →
AGENTS.md → `.claude/rules/`). Toda feature planejada via `/speckit-plan` MUST passar pelo "Constitution
Check" verificando §I–§XII; uma violação só é aceitável com justificativa explícita em "Complexity
Tracking" do plano. Alteração de stack ou de princípio exige **ADR novo** (com `supersedes`), não edição
direta aqui. A numeração §I–§XII é estável (referenciada por ADRs/código) — emende, não renumere.

### Hierarquia de fontes de verdade

1. `handbook/adr/` — ADRs aceitos 0001–0012 (imutáveis).
2. `handbook/` — guias de referência.
3. `AGENTS.md` + `.claude/rules/` — porta de entrada e regras operacionais.
4. `src/modules/auth/README.md` — a feature-modelo (materializa os princípios).
5. **Esta constituição** — resumo subordinado, para o fluxo spec-kit.
6. **Autoridade executável**: `eslint.config.js` + `tsconfig.json` (em divergência, o lint vence).

**Version**: 1.2.1 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-07
<!-- 2026-06-07: materialização do arquivo (antes continha, por engano, a constituição do core-api);
     princípios consolidados dos ADRs 0001–0012, com consultoria de especialistas e citações canônicas
     (ACDG: Evans pp.211/230, Newman p.683, OWASP p.144). -->
