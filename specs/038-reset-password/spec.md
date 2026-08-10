# Spec — Redefinir Senha (Reset Password) · #038

## Contexto

Complemento do fluxo "Esqueci Minha Senha" (#037). O usuário recebe um e-mail com um link
`AUTH_RESET_BASE_URL?token=<token>` (local: `http://localhost:3000/reset-password?token=...`).
Ao abrir esse link, precisa de uma tela pública para definir a **nova senha**.

## Objetivo

Tela pública `/reset-password` que consome o `token` do search param, valida a nova senha contra a
policy (fonte única #32) e chama `POST /auth/reset-password { token, newPassword }` via server function.

## Fora de escopo

- Enviar o e-mail (é o fluxo #037 / core-api).
- Diferenciar `reset-token-invalid` / `-expired` / `-used` ao usuário (mensagem única — §segurança).
- Alterar a feature `forgot-password` ou o modal do `my-account` (apenas REUSO).

## Contrato (verificado)

- Rota do front: `/reset-password` com `validateSearch: { token?: string }`.
- Backend: `POST ${baseUrl}/auth/reset-password` body `{ token, newPassword }`.
- Erros do backend → **HTTP 400**: `reset-token-invalid` / `reset-token-expired` / `reset-token-used`.
- Sucesso → 2xx (sem body relevante) → `ok(void)`.
- Policy: `PasswordPolicy = { minLength, maxLength }` (12/128) via `passwordPolicyQueryOptions`.
  Checklist puro reusado de `#modules/users/client/domain/password-policy.ts`.

## User stories

- **US1 (P1):** Como usuário com link válido, defino nova senha + confirmação, vejo o checklist da
  policy, e ao clicar "Redefinir senha" (habilitado só quando a senha atende à policy e confirmar ===
  nova) recebo confirmação de sucesso com link para o login.
- **US2 (P1):** Como usuário com link inválido/expirado/usado (400), vejo mensagem única "Este link é
  inválido ou expirou. Solicite um novo." + link para `/recuperar-senha`.
- **US3 (P1):** Como usuário que abriu a rota sem `token`, vejo o estado "link inválido" (sem form) +
  link para `/recuperar-senha`.

## Estados da tela

- **token ausente/vazio** → estado "link inválido" (sem form), link p/ `/recuperar-senha`.
- **submitting** → botão em loading.
- **sucesso (2xx)** → modal/estado "Senha redefinida com sucesso!" + botão/link p/ `/login`.
- **erro 400 (token inválido/expirado/usado)** → mensagem única + link p/ `/recuperar-senha`.
- **rede/5xx** → erro genérico (`auth.error.unexpected`).

## Critérios de aceite

- Botão desabilitado até policy OK **e** confirm === nova.
- Sem `token` no search → nunca renderiza o form.
- 400 do backend → tag `auth.reset.error.link-invalid` (não vaza qual dos 3 slugs).
- Sucesso → estado de sucesso com navegação ao login.
- Token nunca no browser além do search param (é o token de reset, não sessão) — a server fn é a única
  fronteira; nada de sessão/access token cruza.
