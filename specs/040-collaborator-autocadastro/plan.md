# Plan — Autocadastro de Colaborador (#040)

## Estratégia

Vertical nova e isolada, espelhando o par "público token-based" já validado (reset-password #038 /
activate #039) para a camada de rota+server-fn, e reusando o model + helpers do complete-registration do
Colaborador (#036) para o form. NADA de detail/my-account é alterado.

## Acesso ao `/api/v1` (resolvido)

`src/external/core-api/api-base.ts → coreApiBase(url, 'v1')` (ADR-0033 Strangler Fig). A
`collaborator.composition.ts` JÁ constrói o client de colaboradores em `coreApiBase(env.CORE_API_URL, 'v1')`.
Uma NOVA composition pública (`collaborator-autocadastro.composition.ts`) constrói um client dedicado na
MESMA base v1, sem Bearer (rota pública token-based, como o auth reset).

## Reuso sem regressão

- **Model:** `CollaboratorCompleteInput`, `SEXES`, `MARITAL_STATUSES` e enums já são exportados de
  `client/data/model/collaborator.model.ts` — reusados diretamente.
- **Helpers puros:** hoje vivem em `collaborator-detail/components/collaborator-detail-form.controller.ts`,
  que importa React no topo. Extrair as partes PURAS (`parseChildrenAges`, `formatChildrenAges`, tri-state
  `boolToTri`/`triToBool`, `blank`/`blankInt`, `buildCompleteInput`, `computeHasCompleteData`, o tipo
  `CollaboratorDetailFormState`) para um módulo puro novo
  `client/collaborator-detail/components/collaborator-complete-fields.ts` e fazer o controller do detail
  RE-IMPORTAR de lá (comportamento idêntico — só move a definição). O form do autocadastro importa o
  módulo puro. Zero mudança de comportamento no detail.

## Arquivos (novos, salvo o re-export do controller)

### Server (BFF · DDD) — delega ao server-orchestrator

- `server/domain/collaborator/collaborator-autocadastro.io.ts` — tipos puros: `AutocadastroPreview`,
  `AutocadastroSubmitInput` (= token + cpfPrefix + campos complete).
- `server/domain/errors/partners.errors.ts` — +`autocadastro-invalid`, +`autocadastro-cpf-mismatch`.
- `server/application/collaborator/collaborator-autocadastro.use-cases.ts` — `createAutocadastroPreview`,
  `createAutocadastroSubmit` (Result, sem throw).
- `server/adapters/collaborator-autocadastro.io-schemas.ts` — Zod (guard AssertEqual) das 2 fns.
- `server/adapters/core-api/core-api-collaborator-autocadastro.ts` — client público v1 (GET preview +
  POST submit; 404→invalid, 400 slug→cpf-mismatch; sem Bearer).
- `server/adapters/collaborator-autocadastro.composition.ts` — composition v1 pública.
- `server/adapters/server-fns/collaborator/autocadastro-preview.query.fn.ts` (GET) e
  `autocadastro-submit.service.fn.ts` (POST) — CSRF-origin no POST (defense-in-depth, como reset).
- `partners/public-api/index.ts` — exporta as 2 fns + tipos.

### Client (MVVM) — delega ao client-orchestrator

- `client/collaborator-autocadastro/data/…` repository/porta → chama as 2 server fns.
- `client/collaborator-autocadastro/viewModel/…view-model.ts` (agnóstico de React): deriva estado
  (invalid | preview | submitting | success | cpf-mismatch) a partir dos Results.
- `client/collaborator-autocadastro/components/autocadastro-form.controller.ts` (React) reusando o módulo
  puro extraído; view burra `.component.tsx` + `.css.ts` só-tokens (pode duplicar as seções do detail).
- `client/collaborator-autocadastro/page/autocadastro.page.tsx` + estados (invalid-link, success-modal —
  pode reusar/duplicar as views burras do reset por props).
- `client/collaborator-autocadastro/…binding.ts` (o único ponto React↔query).
- `src/shared/i18n/**` — chaves `partners.autocadastro.*`.

### Rota + guard

- `src/routes/autocadastro.tsx` — `createFileRoute('/autocadastro')`, `validateSearch { token? }`, público
  (SEM redirect de sessão — o colaborador pode não ter conta). Regenera `src/app/routeTree.gen.ts` via
  `pnpm dev` (NUNCA editar à mão).
- `tests/routes/guard-coverage.test.ts` — +`autocadastro.tsx` na allowlist PUBLIC_ROUTES.

### Testes

- node (`*.test.ts`): `collaborator-complete-fields.test.ts` (parseChildrenAges/build); view-model
  (invalid/preview/success/cpf-mismatch), CPF-prefix gating puro.
- vitest (`*.spec.tsx`): view burra — gating do botão por cpfPrefix; render dos estados 400 vs 404 vs
  sucesso via strings do catálogo real (não renderiza a page inteira — evita provider router/query).

## Constitution Check (§I–§XII)

- **§I Vertical-modular:** feature nova `collaborator-autocadastro`; imports externos via `public-api`.
  Helper puro extraído p/ `*.ts` no próprio módulo partners (não cruza boundary).
- **§II Erros como valores:** use-cases retornam `Result`; server fns retornam união discriminada
  `{ ok }`; sem throw fora da borda (CSRF-origin é a única exceção de borda, como reset).
- **§III Server fn = única fronteira:** 2 fns completas (preview/submit); o client não compõe.
- **§IV Estados ilegais irrepresentáveis:** view-model = união discriminada + switch exaustivo.
- **§V Cadeia de erro fim-a-fim:** UI não olha status HTTP; 404→`autocadastro-invalid`,
  400+slug→`autocadastro-cpf-mismatch` mapeados no client via error-tag.
- **§VI TS estrito e apagável:** sem any/enum/namespace; tipos `Readonly`.
- **§VII Imutabilidade:** `Readonly<>`/`as const`.
- **§VIII Mínimo de deps:** nada novo; reusa Zod/Query/Router.
- **§IX Segurança por construção:** rota pública sem sessão; token só via search param → server fn
  (Zod + CSRF-origin no POST); token nunca persistido no browser; anti-enumeração 404.
- **§X Design só-tokens:** `*.css.ts` vanilla-extract; sem hex/px cru.
- **§XI MVVM + views burras:** view-model puro; view só apresenta; binding isola React.
- **§XII Reatividade por eventos:** N/A (sem cross-feature; sucesso é local).

Gate: `pnpm typecheck && pnpm lint && pnpm verify && pnpm test:dom`. Regressão zero.
</content>
