# Contrato: leitura da política de senha (BFF ↔ core-api)

> Frontend-only. O browser fala só com a server function (única fronteira). O core-api **não muda**.

## Leitura (nova)

`GET /api/v2/auth/password-policy` — **público (sem auth)**

Resposta `200`:
```json
{ "minLength": 12, "maxLength": 128 }
```

Validação na borda (Zod):
```ts
const PasswordPolicyResponseSchema = z.object({
  minLength: z.int().positive(),
  maxLength: z.int().positive(),
})
```

### Fluxo no front
```
my-account.binding (useQuery passwordPolicyQueryOptions)   [auth/public-api]
  → passwordPolicyQueryOptions.queryFn → password-policy.gateway → getPasswordPolicyFn  [auth server fn]
        → resultFetch GET ${CORE_API_URL}/api/v2/auth/password-policy (sem Authorization)
        → PasswordPolicyResponseSchema.safeParse → { ok, data:{minLength,maxLength} } | { ok:false, error }
  → binding deriva { minLength, maxLength } com fallback { 12, 128 }
  → my-account.page → props → reset-password-modal (Trocar Senha)
       → evaluatePassword(pw, { minLength, maxLength })  + rótulo "Mínimo {{min}} caracteres"
```

`staleTime: Infinity` (a política não muda durante a sessão). Erro/pending → fallback `{12,128}` (nunca mais permissivo).

## Escrita (já existente — só alinhar)

`POST /api/v2/auth/change-password` (já consumido via `change-password.service.fn`):
- Borda do BFF: `ChangePasswordInputSchema.newPassword.min(12)` (era 8).
- Erros → tag i18n:

| `error.code` (core-api) | HTTP | `UsersError` | tag |
|---|---|---|---|
| `password-too-short` | 422 | `password-too-short` (novo) | `users.error.password-too-short` |
| `password-too-common` | 422 | `password-weak` (existe) | `users.error.password-weak` |
| `invalid-credentials` | 401 | `invalid-current-password` (existe) | `users.error.invalid-current-password` |
