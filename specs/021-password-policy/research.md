# Research: Política de senha alinhada ao #32

Investigação no código real (front) e no backend `dev` (#32). NEEDS CLARIFICATION resolvidos.

## Achados de código

- **Único fluxo com senha nova**: `users/client/my-account/components/reset-password-modal.component.tsx` (Trocar Senha). É o **único** consumidor de `users/client/domain/password-policy.ts` (`evaluatePassword`/`passwordMeetsPolicy`/`PASSWORD_RULE_KEYS`).
- **Cadastro de usuário**: `CreateUserInputSchema` = `name/cpf/email/telephone` — **sem senha** (convite). Não há validação de senha a alinhar.
- **Recuperação**: não existe no front (link "Esqueci Minha Senha" é `href="#"`). Fora de escopo.
- **Validador atual** (`password-policy.ts`): `length: pw.length >= 8 && pw.length <= 15` + complexidade (upper/lower/number/special). O comentário admite que é mais rígido que o backend (8/128, sem complexidade). **Bug real = min 8** (deveria 12); **teto 15** = annoyance (backend aceita 128).
- **Borda do server**: `ChangePasswordInputSchema.newPassword: z.string().trim().min(8).max(128)` → min deve virar 12.
- **Erros**: `UsersError` já tem `password-weak` (de `password-too-common`); **falta** `password-too-short`. `core-api-users.ts` `SLUG_TO_ERROR` mapeia slugs; `users-error-tag.ts` traduz.
- **Backend (#32, dev)**: `GET /api/v2/auth/password-policy` → `{ minLength: 12, maxLength: 128 }` (handler em `auth/adapters/http/plugin.ts`; schema `passwordPolicyResponseSchema`). `change-password` → `password-too-short` (422), `password-too-common` (422).
- **Binding da Minha Conta**: `my-account.binding.ts` já usa `useQuery` (camada binding, permitido) → bom lugar para consumir a política e threar à modal.

## D1 — Consumir `GET /password-policy` vs. constante fixa no front

- **Decisão**: **consumir** `GET /api/v2/auth/password-policy` (com fallback constante 12/128).
- **Rationale**: o handoff §1.2 manda "não hardcode — consuma a fonte única"; vira **infra reutilizável** (FR-007) para os futuros fluxos de cadastro-com-senha/recuperação; se o backend mudar o número, o front acompanha sem deploy de regra.
- **Alternativa rejeitada**: hardcode 12/128 no validador — mais simples, mas viola o handoff e não escala para os próximos fluxos. (Mantida apenas como **fallback** quando a leitura falhar/estiver carregando.)

## D2 — Onde mora a leitura da política

- **Decisão**: módulo **`auth`** (dono do endpoint `/api/v2/auth/...`): `get-password-policy.query.fn.ts` (server fn pública) + `passwordPolicyQueryOptions` (client), exposto por **`auth/public-api`**. O **users** consome via public-api.
- **Rationale**: respeita boundaries (auth owns auth endpoint); reutilizável por outros módulos; espelha como o auth já expõe `getCurrentUserFn`/`logoutUseCase`.
- **Padrão**: server fn (sem exigir user/token — endpoint público) → gateway client → `queryOptions` (queryKey `['auth','password-policy']`, `staleTime: Infinity` — a política quase nunca muda na sessão). Response validado por Zod na borda.

## D3 — Validador puro parametrizável

- **Decisão**: `evaluatePassword(pw, limits: { minLength: number; maxLength: number } = { minLength: 12, maxLength: 128 })` — a checagem `length` usa `limits`; **default seguro 12/128**. `passwordMeetsPolicy(pw, limits)` idem. Corrige o teto 15.
- **Rationale**: mantém o validador **puro** (testável por node:test, sem I/O), recebendo a regra por argumento; o default garante segurança mesmo sem a query.
- **Complexidade preservada**: upper/lower/number/special **permanecem** (pré-existentes, stricter/safe — toda senha que passa no front é aceita no backend). Remover seria mudança de comportamento fora de escopo (regressão na checklist da modal).

## D4 — Onde mora o fallback seguro

- **Decisão**: **duas camadas**. (a) o **binding** deriva `{ minLength, maxLength }` da query com `?? { 12, 128 }` quando pending/erro; (b) o **validador** tem default 12/128. Nunca permite submit abaixo de 12.
- **Rationale**: defesa em profundidade — se a query falhar, a UI ainda bloqueia <12.

## D5 — Mensagem que informa o mínimo (i18n)

- **Decisão**: o **rótulo da regra de tamanho** na checklist da modal passa a refletir o min dinâmico via **interpolação i18n** (tag com `{{min}}`, ex.: "Mínimo {{min}} caracteres"). O **422 `password-too-short`** do backend (defesa) mapeia para uma tag amigável genérica (`users.error.password-too-short`), sem expor detalhe técnico. `password-weak` já tem tag.
- **Rationale**: a validação inline já mostra o número exato (melhor UX); o 422 é só rede de segurança.

## D6 — Schema de borda

- **Decisão**: `ChangePasswordInputSchema.newPassword`: `min(8) → min(12)` (mantém `max(128)`). Alinha a borda do BFF ao backend (Zod na fronteira).
- **Rationale**: defesa adicional — mesmo que a UI seja burlada, a server fn rejeita <12 antes de chamar o core-api.
