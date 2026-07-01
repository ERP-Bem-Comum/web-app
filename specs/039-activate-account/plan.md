# Plan — Ativação de Conta · #039

## Estratégia: generalizar a 038, não duplicar

A feature `reset-password` já é MVVM completa e com todas as views burras recebendo strings por props.
A única coisa que "escolhe" strings é a `ResetPasswordPage`. Introduzimos um `variant` e um seletor
de copy PURO; tudo abaixo da page é reuso literal.

## Mudanças

| Arquivo                                                               | Ação                                                                                                                               | Camada           |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `src/modules/auth/client/reset-password/page/set-password.copy.ts`    | **novo** — seletor PURO `variant → copy` (i18n keys + alvo do CTA inválido + resolução do errorTag por variant)                    | client/ui (puro) |
| `src/modules/auth/client/reset-password/page/reset-password.page.tsx` | **editar** — aceita `variant` (default `'reset'`); usa a copy do seletor; escolhe o destino do CTA/back conforme variant           | client/ui        |
| `src/routes/activate.tsx`                                             | **novo** — `/activate`, `validateSearch {token?}`, `beforeLoad` logado→dashboard, renderiza `ResetPasswordPage variant='activate'` | route glue       |
| `src/shared/i18n/catalog.pt-BR.ts`                                    | **editar** — adiciona bloco `auth.activate.*` (reusa `auth.reset.rule.*` e labels de campo)                                        | i18n             |
| `tests/modules/auth/client/reset-password/set-password-copy.test.ts`  | **novo** — node:test do seletor puro (as duas variants, CTA target, error text)                                                    | teste puro       |
| `tests/modules/auth/client/reset-password/activate-page.spec.tsx`     | **novo** — vitest/jsdom: `variant='activate'` mostra copy correta, mesmo gate, estado inválido → CTA login                         | teste DOM        |
| `routeTree.gen.ts`                                                    | regenerado pelo `pnpm dev` (não editar à mão)                                                                                      | gerado           |

## Constitution Check (§I–§XII)

- **§I vertical-modular:** tudo dentro de `modules/auth/client`; import externo só por public-api (policy via `#modules/users/public-api`). OK.
- **§II erros como valores:** reuso do `Result`/binding do reset; nenhum `throw` novo. OK.
- **§III server fn única fronteira:** REUSA `resetPasswordFn`; nenhuma composição no client; zero server novo. OK.
- **§V cadeia de erro:** UI não olha status HTTP; `reset-token-invalid` (400) já mapeado. Copy por variant só troca o TEXTO, não a lógica de erro. OK.
- **§VI TS estrito:** `variant` = união literal discriminada; sem `any`/`enum`. OK.
- **§X design só-tokens:** nenhum CSS novo — reusa os `.css.ts` do reset. OK.
- **§XI MVVM/views burras:** o seletor de copy é PURO (sem React); a page continua composição; views intactas. OK.

## Regressão zero

- `/reset-password` renderiza com `variant='reset'` (default) → mesmas strings de antes → testes 038 verdes.
- Server-fn/client do reset intactos (só reuso).
- Gates: `pnpm typecheck`, `pnpm lint`, `pnpm verify`, `pnpm test:dom`.
