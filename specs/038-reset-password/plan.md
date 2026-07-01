# Plan — Redefinir Senha (Reset Password) · #038

## Abordagem

Espelhar a feature `forgot-password` (vertical MVVM + BFF) + reusar o UI de senha do
`reset-password-modal` do `my-account`. Tamanho **M**.

## Camada server (BFF · DDD)

1. `core-api-auth.ts`: adicionar `resetPassword({ token, newPassword }) => POST /auth/reset-password`.
   Mapear **400 → `reset-token-invalid`** (novo AuthError) para a UI distinguir "link inválido" de rede/5xx.
   Estender `mapHttpToAuthError` para tratar `status === 400` → `reset-token-invalid`.
2. `auth.errors.ts`: adicionar variante `'reset-token-invalid'` à união discriminada.
3. `auth.composition.ts`: passthrough `resetPassword`.
4. `reset-password.server-fn.ts`: `createServerFn POST` + `.inputValidator(Zod { token, newPassword })`,
   CSRF-origin como a forgot-password, rota pública (sem sessão). Retorna
   `{ ok:true } | { ok:false, error, reference? }`.

## Camada client (MVVM)

5. `data/model/auth.model.ts`: `ResetPasswordInputSchema { token, newPassword }` + tipo.
6. `data/repository/auth.repository.ts`: `resetPassword(input) => Result<void, LoginFailure>` +
   injeção de `resetPasswordFn`. Nota: `AuthError` do client ganha `reset-token-invalid` via o contrato.
7. `data/repository/auth.repository.instance.ts`: wira `resetPasswordFn`.
8. `data/helpers/auth-error-tag.ts`: `reset-token-invalid` → `auth.reset.error.link-invalid` (exaustivo).
9. `reset-password/bind/reset-password.mutation.ts`: mutation agnóstica.
10. `reset-password/viewModel/reset-password.view-model.ts`: derivação pura (erro→tag; canSubmit puro
    reusando `passwordMeetsPolicy`).
11. `reset-password/bind/reset-password.binding.ts`: adapter React (useMutation + policy query + router).
12. `reset-password/components/forms/reset-password-form.component.tsx` (+ `.css.ts`): view burra
    (2 inputs password + checklist), reusa `evaluatePassword`/`PASSWORD_RULE_KEYS`.
13. `reset-password/components/forms/reset-password-form.controller.ts`: estado transiente (next/confirm/show).
14. `reset-password/components/invalid-link.component.tsx` (+ `.css.ts`): estado "link inválido".
15. `reset-password/components/success-modal.component.tsx` (+ `.css.ts`): modal de sucesso → `/login`.
16. `reset-password/page/reset-password.page.tsx`: composição (shell do login + estados).

## Rota

17. `src/routes/reset-password.tsx`: `createFileRoute('/reset-password')`, `validateSearch { token? }`,
    `beforeLoad` (logado → dashboard, como recuperar-senha). `pnpm dev` regenera `routeTree.gen.ts`.

## i18n

18. `catalog.pt-BR.ts`: chaves `auth.reset.*` (title, subtitle, labels, submit, back-to-login,
    success-title/body, invalid-link-title/body/cta, error.link-invalid). Reusa `common.loading`.

## Testes

- `tests/.../reset-password/reset-password-view-model.test.ts` (node:test): erro→tag; canSubmit gating.
- `tests/.../reset-password/reset-password-form.spec.tsx` (vitest): checklist, gating do botão,
  invalid-link sem form, sucesso, 400 → mensagem única.
- `tests/.../server/adapters/core-api-auth-client.test.ts`: 400 → `reset-token-invalid` (estender).

## Constitution Check (§I–§XII)

- §I vertical-modular: tudo em `modules/auth`; cross só por public-api (não precisa exportar nada novo).
- §II erros como valores: `Result`/`{ok}`; sem throw fora da borda CSRF.
- §III server fn única fronteira: `resetPasswordFn` compõe; client não compõe.
- §IV estados ilegais: união de `AuthError` + estados de tela discriminados.
- §V cadeia de erro: UI nunca olha status HTTP; 400 mapeado no adapter → tag na UI.
- §VI TS estrito/apagável: sem enum/any; `as const`.
- §VII imutabilidade: `Readonly<>`.
- §IX segurança: token de reset só no search→body; server fn valida Zod + CSRF-origin; rota pública.
- §X design só-tokens: `*.css.ts` com `vars.*`.
- §XI MVVM view burra: derivação pura no view-model; React só no binding.
- §XII eventos: n/a (sem event bus neste fluxo).

## Decisões emergentes na implementação

- **Reuso da policy pura cross-feature:** o boundary §I (eslint-plugin-boundaries) proíbe `auth` importar
  `#modules/users/client/domain/password-policy.ts` direto. Solução: exportar os helpers puros
  (`evaluatePassword`, `passwordMeetsPolicy`, `PASSWORD_RULE_KEYS`, `DEFAULT_PASSWORD_LIMITS` + tipos)
  pela `#modules/users/public-api/index.ts`. Sem duplicar código; respeita o boundary.
- **Allowlist de rota pública:** `tests/routes/guard-coverage.test.ts` cobra que toda rota no topo de
  `src/routes/` esteja em `_authenticated/` ou na `PUBLIC_ROUTES`. `reset-password.tsx` foi adicionada
  (pública por construção — o usuário chega deslogado pelo link do e-mail).
- **a11y do olho:** os botões "mostrar/ocultar senha" usam `aria-label` próprio (`auth.reset.toggle-
visibility`), NÃO o label do campo — senão `getByLabelText` colide e a a11y fica ambígua.

## Regressão zero

`pnpm typecheck`, `pnpm lint`, `pnpm verify`, `pnpm test:dom` verdes antes de fechar. ✅ Todos verdes.
