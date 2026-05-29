# Feature Specification: Fundação Técnica do Frontend v2

**Feature Branch**: `feat/phase-12-backend-integration` (sem branch dedicada — por decisão do time, a spec vive na branch atual)

**Spec Directory**: `specs/001-v2-foundation`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Fundação técnica do frontend v2 (ERP Bem Comum). Estabelecer a base que todo módulo do v2 vai consumir, seguindo a constituição v1.1.0 (arquitetura vertical-modular espelhando o core-api): bootstrap TanStack Start rodável; camada src/shared/ (cross-cutting puro); camada src/external/ (adapters de I/O real + segredos). Permanecer na branch atual."

## Visão Geral

Esta feature **não entrega valor direto ao usuário final** — entrega a **fundação técnica** sobre a qual todos os módulos de negócio do v2 (contratos, auth, financeiro…) serão construídos. Os "usuários" desta spec são os **desenvolvedores do time** que vão consumir a base, e o **app rodável** que ela habilita. O objetivo é materializar, em código, os contratos invariantes da constituição v1.1.0 (Result, branded types, cadeia de erro, fronteiras de camada) e deixar o esqueleto do TanStack Start subindo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - App rodável (esqueleto TanStack Start) (Priority: P1)

Como desenvolvedor do time, quero que o app v2 suba localmente com `pnpm dev`, exibindo uma rota inicial, para confirmar que a stack (Vite + TanStack Start + Router + React 19) está corretamente configurada e que posso começar a adicionar módulos.

**Why this priority**: Sem um app que sobe, nenhuma outra peça pode ser validada de ponta a ponta. É o piso absoluto.

**Independent Test**: Rodar `pnpm dev`, acessar `http://localhost:3000`, ver a página inicial renderizar (SSR) sem erro no console nem no terminal. Acessar a rota de health e obter resposta de status saudável.

**Acceptance Scenarios**:

1. **Given** o repositório com dependências instaladas, **When** o desenvolvedor roda `pnpm dev`, **Then** o servidor sobe em `http://localhost:3000` sem erros e a rota raiz renderiza.
2. **Given** o app rodando, **When** o desenvolvedor acessa a rota de health, **Then** recebe uma resposta indicando que a aplicação está saudável.
3. **Given** o código da fundação, **When** o desenvolvedor roda `pnpm build`, **Then** o build de produção conclui sem erro.

---

### User Story 2 - Núcleo compartilhado puro (`shared/`) (Priority: P1)

Como desenvolvedor de um módulo, quero importar primitivos puros (`Result`, `Brand`, helpers de imutabilidade) e os tipos da cadeia de erro (`HttpError`, `AppError`, `QueryError`, `map-to-app-error`) de um único lugar compartilhado, para modelar domínio e tratar erros sem reimplementar nada e sem violar as fronteiras de import.

**Why this priority**: Todo domínio e toda camada de erro dependem desses primitivos. É consumido por todas as outras camadas.

**Independent Test**: Escrever um teste puro (sem DOM) que importa de `shared/primitives` e `shared/http`, constrói um `Result.ok`/`Result.err`, um valor branded via smart constructor, e mapeia um `HttpError` para `AppError` — tudo type-safe, sem `any`, sem `throw`.

**Acceptance Scenarios**:

1. **Given** a camada `shared/primitives`, **When** um desenvolvedor usa `ok`/`err`/`isOk`/`isErr`/`mapErr`/`combine`, **Then** o fluxo de sucesso e de erro é representado como valor, com tipos discriminados (`.ok`) e narrowing correto.
2. **Given** a camada `shared/primitives`, **When** um desenvolvedor define um branded type com smart constructor, **Then** estado inválido é irrepresentável (o construtor retorna `Result<T, E>` e o `as` só aparece dentro dele).
3. **Given** a camada `shared/http`, **When** um `HttpError` (network/http/parse/timeout/aborted) é mapeado, **Then** resulta num `AppError` semântico via `switch` exaustivo com guarda `never`, sem que a UI precise olhar status HTTP.
4. **Given** a camada `shared/http`, **When** um erro precisa atravessar a fronteira de Query, **Then** existe exatamente uma subclasse de `Error` (`QueryError`) carregando o `AppError`.

---

### User Story 3 - Adapters externos e cadeia de erro de I/O (`external/`) (Priority: P1)

Como desenvolvedor de um módulo, quero um cliente HTTP do core-api que devolve `Result<T, HttpError>` (nunca lança), com timeout/cancelamento, e um tradutor que preserva o status do upstream ao responder ao client, além de uma configuração de ambiente validada — para que server functions de qualquer módulo conversem com o core-api de forma segura e uniforme, sem vazar segredos ao browser.

**Why this priority**: É a ponte real com o backend. Sem ela, nenhuma server function de módulo consegue buscar dados; e é onde a cadeia de erro server-side começa.

**Independent Test**: Chamar o cliente HTTP contra um endpoint simulado que retorna 200/4xx/5xx/timeout, e verificar que o retorno é sempre um `Result` (`ok` com corpo parseado, ou `err` com `HttpError` da variante correta) — nunca uma exceção. Verificar que a config falha cedo e claramente quando uma variável de ambiente obrigatória está ausente.

**Acceptance Scenarios**:

1. **Given** o cliente HTTP do core-api, **When** o upstream responde 2xx, **Then** o retorno é `ok(corpo)` com o corpo parseado; **When** responde 4xx/5xx, **Then** o retorno é `err({ kind: 'http', status, body })` — sem lançar.
2. **Given** o cliente HTTP, **When** a requisição estoura o timeout ou é abortada, **Then** o retorno é `err({ kind: 'timeout' })` ou `err({ kind: 'aborted' })` conforme a causa.
3. **Given** um `HttpError` retornado por uma server function, **When** ele é traduzido para a resposta ao client, **Then** o status do upstream é preservado (ex.: 404 continua 404; connectivity vira 504; parse vira 502).
4. **Given** a configuração de ambiente, **When** o app inicializa sem uma variável obrigatória (ex.: `CORE_API_URL`), **Then** a inicialização falha com mensagem clara, antes de servir requisições.
5. **Given** o app rodando, **When** o browser inspeciona qualquer payload, **Then** nenhum token, segredo ou URL interna do backend aparece (a fronteira do BFF nunca os expõe).

---

### Edge Cases

- **Variável de ambiente ausente/ inválida**: a config deve falhar na inicialização (fail-fast), não no meio de uma requisição.
- **Upstream retorna corpo não-JSON em erro**: o `HttpError` deve carregar o corpo como está (texto), sem quebrar o parsing.
- **Resposta 204 / corpo vazio**: o cliente deve tratar como sucesso sem tentar parsear JSON.
- **Backend offline / DNS falha**: deve virar `err({ kind: 'network' })` e, na borda, status 504 — nunca uma exceção não tratada.
- **Variante de erro nova adicionada no futuro**: o `switch` exaustivo deve quebrar a compilação (guarda `never`), forçando tratamento explícito.

## Requirements *(mandatory)*

### Functional Requirements

**Bootstrap do app (US1)**
- **FR-001**: O sistema MUST subir com `pnpm dev` em `http://localhost:3000`, renderizando uma rota raiz via SSR sem erros.
- **FR-002**: O sistema MUST expor uma rota de health que confirme que a aplicação está no ar.
- **FR-003**: O sistema MUST concluir `pnpm build` (build de produção) sem erros.

**Núcleo compartilhado puro — `shared/` (US2)**
- **FR-004**: O `shared/primitives` MUST prover `Result<T, E>` **vendorizado (cópia fiel) do core-api** — união discriminada por `.ok` (`{ ok: true; value }` / `{ ok: false; error }`) com `ok`, `err`, `isOk`, `isErr`, `mapErr`, `combine` (paridade total com `core-api/src/shared/primitives/result.ts`).
- **FR-005**: O `shared/primitives` MUST prover o tipo `Brand<T, B>` e o padrão de smart constructor (construtor retorna `Result<T, E>`; `as` permitido somente internamente).
- **FR-006**: O `shared/primitives` MUST prover helpers de imutabilidade reutilizáveis.
- **FR-007**: O `shared/http` MUST definir os tipos `HttpError` (transporte) e `AppError` (semântico para a UI) como unions discriminadas.
- **FR-008**: O `shared/http` MUST prover `map-to-app-error` traduzindo `HttpError → AppError` via `switch` exaustivo com guarda `never`.
- **FR-009**: O `shared/http` MUST prover `QueryError` como a **única** subclasse de `Error` permitida no projeto, carregando um `AppError`.
- **FR-010**: A camada `shared/` MUST ser pura — sem dependência de framework de UI nem de I/O — e importável por qualquer outra camada conforme a matriz de fronteiras.

**Adapters externos — `external/` (US3)**
- **FR-011**: O `external/core-api` MUST prover um cliente HTTP que retorna `Result<T, HttpError>` e **nunca** lança exceção ao chamador.
- **FR-012**: O cliente HTTP MUST suportar timeout e cancelamento (via mecanismo de abort), traduzindo cada falha para a variante correta de `HttpError`.
- **FR-013**: O `external/core-api` MUST prover um tradutor de `HttpError` para a resposta ao client que **preserva o status do upstream** (404→404, connectivity→504, parse→502, aborted→499).
- **FR-014**: O `external/config` MUST validar as variáveis de ambiente na inicialização (fail-fast), expondo ao menos `CORE_API_URL`, e falhar com mensagem clara quando faltar variável obrigatória. A configuração MUST ser **server-only** — nunca importada por código de client/UI nem incluída no bundle do browser (FR-015, SC-005).
- **FR-015**: A camada `external/` MUST conter todo I/O real e segredos, e **nunca** expô-los ao browser; pode importar só `shared` e `external` (nunca módulos).

**Conformidade arquitetural (transversal)**
- **FR-016**: O sistema MUST passar `pnpm lint` (incluindo as fronteiras de import `modules/shared/external` + `public-api` e o enforcement MVVM) sem erros.
- **FR-017**: O sistema MUST passar `pnpm typecheck` (`tsc --noEmit`) sem erros.
- **FR-018**: O código MUST respeitar os invariantes da constituição: sem `any`, sem `class` (exceto `QueryError`), sem `this`, sem `throw` fora da borda de infra; imutabilidade; `import type`; sem `enum`/`namespace`/parameter-properties.
- **FR-019**: A cadeia de erro fim-a-fim (`resultFetch → HttpError → map-to-server-response → QueryError(map-to-app-error) → AppError → UI`) MUST estar implementável e demonstrável com as peças entregues.

### Key Entities *(include if feature involves data)*

- **Result<T, E>**: resultado de uma operação falível; union discriminada `ok | err`. Base de todo fluxo de erro-como-valor.
- **Brand<T, B>**: marcador de tipo nominal para VOs validados; acompanha um smart constructor.
- **HttpError**: erro de transporte (network, http+status+body, parse, timeout, aborted). Vive no servidor.
- **AppError**: erro semântico que a UI entende (auth:expired, auth:forbidden, not-found, validation, conflict, server, connectivity, bad-gateway, unknown).
- **QueryError**: ponte entre `Result`/`AppError` e a API de erro do cache de server-state; única subclasse de `Error`.
- **EnvConfig**: configuração de ambiente validada (ao menos `CORE_API_URL`); fonte única de variáveis para a camada externa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de um clone com dependências instaladas, um desenvolvedor sobe o app com um único comando e vê a rota inicial em menos de 1 minuto, sem nenhum erro no terminal ou console.
- **SC-002**: `pnpm lint`, `pnpm typecheck` e `pnpm build` concluem todos com sucesso (zero erros) sobre o código da fundação.
- **SC-003**: 100% das operações de I/O da fundação retornam um valor de resultado explícito (sucesso ou erro tipado) — zero exceções não tratadas escapam ao chamador em qualquer cenário de erro testado (2xx, 4xx, 5xx, timeout, offline, corpo vazio).
- **SC-004**: Toda variante de `HttpError` tem tradução definida para `AppError` e para status de resposta ao client, verificável por testes; adicionar uma variante nova sem tratá-la quebra a compilação.
- **SC-005**: Inspecionando o tráfego e os payloads do browser, nenhum token, segredo ou URL interna do backend é observável.
- **SC-006**: Um novo módulo de exemplo consegue ser esboçado consumindo apenas `shared/` e `external/` (e o `public-api` de outros), sem disparar nenhum erro de fronteira no lint.

## Assumptions

- **Stack fixa pela constituição**: TanStack Start (Vite 8) + TanStack Router + React 19 + TypeScript estrito + Zod 4 + pnpm. Não é decisão desta spec — é restrição herdada (constituição v1.1.0 §"Technology Constraints & Stack").
- **Estrutura de pastas**: vertical-modular espelhando o core-api (`modules/` + `shared/` + `external/` + `public-api`), já oficializada na constituição e no `eslint.config.js`.
- **TanStack Query**: a constituição prevê server-state via TanStack Query, mas o pacote runtime ainda não está instalado; sua adição (e a configuração de `queryCache.onError` 401→signOut / `mutationCache.onSuccess`) é dependência desta fundação e pode ser incluída aqui ou tratada como primeiro item do plano.
- **Sessão/auth real**: a resolução de sessão (cookie HttpOnly, session store, injeção de Bearer) é da feature de **Auth**, fora do escopo desta fundação; aqui o cliente HTTP apenas aceita um token opcional como argumento.
- **Branch**: por decisão do time, não se cria branch dedicada — a spec e a implementação vivem na branch atual (`feat/phase-12-backend-integration`).
- **Backend `core-api`**: assume-se disponível via `CORE_API_URL` (stack Docker local); contratos de endpoint são consultados via agente `core-api-consultant` quando necessário.
- **Ambiente de execução**: Node 20+ / runtime do Nitro do TanStack Start; dev em `http://localhost:3000`.

## Dependencies

- Constituição v1.1.0 (`.specify/memory/constitution.md`) — fonte normativa dos invariantes.
- `eslint.config.js` já ajustado para as fronteiras `modules/shared/external` + MVVM.
- `handbook/arquiteture.md` (snippets de referência: `result-fetch`, `map-to-server-response`, `map-to-app-error`, `QueryError`) e `handbook/core-api/` (contratos do backend).
