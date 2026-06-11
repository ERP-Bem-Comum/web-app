# Data Model: Política de senha alinhada ao #32

Feature frontend-only. Sem entidade de domínio nova nem migration. O que muda: um **tipo de leitura** (PasswordPolicy), a **assinatura do validador**, a **união de erros** e um **limite de schema**.

## Tipo novo

### `PasswordPolicy` (auth)
```ts
type PasswordPolicy = Readonly<{ minLength: number; maxLength: number }>
```
- Origem: `GET /api/v2/auth/password-policy` (200). Validado por Zod na borda: `z.object({ minLength: z.int().positive(), maxLength: z.int().positive() })`.
- Exposto via `auth/public-api` (tipo + `passwordPolicyQueryOptions`).
- **Fallback** quando indisponível: `{ minLength: 12, maxLength: 128 }`.

## Validador (assinatura alterada — `users/client/domain/password-policy.ts`)

| Antes | Depois |
|---|---|
| `evaluatePassword(pw)` → `length: pw.length>=8 && <=15` | `evaluatePassword(pw, limits={minLength:12,maxLength:128})` → `length: pw.length>=limits.minLength && <=limits.maxLength` |
| `passwordMeetsPolicy(pw)` | `passwordMeetsPolicy(pw, limits?)` |

- Complexidade (`upper/lower/number/special`) **inalterada**.
- `PasswordChecks` mantém as 5 chaves; `length` agora reflete os limites recebidos.

## União de erros (alteração)

### `UsersError` (server domain + cópia client)
Acrescenta um membro (union string; switch exaustivo no error-tag):
```
| 'password-too-short'   // 422 password-too-short — senha abaixo do mínimo da política
```
(`password-weak` de `password-too-common` já existe.)

### Mapeamentos
| core-api (`error.code`) | HTTP | `UsersError` | tag i18n |
|---|---|---|---|
| `password-too-short` | 422 | `password-too-short` | `users.error.password-too-short` |
| `password-too-common` | 422 | `password-weak` (já existe) | `users.error.password-weak` (já existe) |

## Schema de borda (alteração)

`ChangePasswordInputSchema.newPassword`: `z.string().trim().min(8).max(128)` → `.min(12).max(128)`.

## i18n (novas strings)

- `users.error.password-too-short` — mensagem amigável (defesa do 422).
- Rótulo da regra de tamanho na checklist da modal — com interpolação `{{min}}` (ex.: "Mínimo {{min}} caracteres"), substituindo o texto fixo "8–15".

## Invariantes preservadas
- `Result<T,E>` ponta a ponta; sem `any`/`throw` fora da borda; Zod na borda (response da política); i18n; views burras (modal recebe limites por props; `useQuery` no binding); validador puro.
