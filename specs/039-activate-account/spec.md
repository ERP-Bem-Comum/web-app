# Spec — Ativação de Conta (Activate Account) · #039

## Contexto

O usuário CONVIDADO recebe o e-mail "Cadastro de Usuário" com o botão "Criar senha", cujo link é
`activationUrl = ${activationBaseUrl}?token=<token>` (local: `http://localhost:3000/activate?token=...`).
O convidado nasce `status:'active'` com uma senha PLACEHOLDER inutilizável; definir a senha real é o
que ativa efetivamente o acesso.

Funcionalmente esta tela é IDÊNTICA à "Redefinir Senha" (#038): token → nova senha + confirmação +
checklist da policy → mesmo endpoint. Só mudam a **rota** (`/activate`) e o **texto**.

## Objetivo

Tela pública `/activate` que consome o `token` do search param, valida a nova senha contra a policy
(fonte única #32) e chama `POST /auth/reset-password { token, newPassword }` via a MESMA server
function do reset (o token de ativação É um password-reset token). Zero mudança no server.

## Fora de escopo

- Enviar o e-mail de convite (é o core-api / UserInvited).
- Qualquer endpoint novo — REUSA `resetPasswordFn` e o client `resetPassword` existentes.
- Regredir o `/reset-password` (mantém comportamento idêntico via `variant='reset'`).

## Contrato (verificado no core-api)

- E-mail UserInvited: `activationUrl = ${activationBaseUrl}?token=<token>`; `activationBaseUrl` default
  `http://localhost:3000/activate` → rota do front `/activate?token=<token>`.
- Backend: **MESMO** `POST ${baseUrl}/auth/reset-password` body `{ token, newPassword }` (sem endpoint novo).
- Erros do backend → HTTP 400 (`reset-token-invalid` / `-expired` / `-used`) → mensagem única.
- Sucesso → 2xx → `ok(void)`.
- Policy idêntica ao reset (`passwordPolicyQueryOptions`, checklist puro reusado).

## Abordagem — DRY (generaliza a feature 038 via `variant`)

`ResetPasswordPage` recebe `variant: 'reset' | 'activate'` (default `'reset'`). Um seletor de copy PURO
(`set-password.copy.ts`) mapeia o `variant` → o conjunto de strings i18n + o alvo do CTA de link
inválido. Form/checklist/modal/invalid-link/binding/view-model/server-fn são REUSADOS iguais.

## User stories

- **US1 (P1):** Como convidado com link válido, defino a 1ª senha + confirmação, vejo o checklist da
  policy, e ao clicar "Criar senha" (habilitado só quando a policy OK e confirmar === nova) vejo
  "Conta ativada!" com link para o login.
- **US2 (P1):** Como convidado com link inválido/expirado/usado (400), vejo mensagem única "Este
  convite é inválido ou expirou." + link para `/login`.
- **US3 (P1):** Como convidado que abriu a rota sem `token`, vejo "Convite inválido" (sem form) +
  link para `/login`.

## Copy (i18n `auth.activate.*`)

- Título: "Criar Senha" · Subtítulo: "Boas-vindas! Defina uma senha para acessar o sistema."
- Botão: "Criar senha"
- Sucesso: "Conta ativada!" / "Sua senha foi criada. Você já pode entrar no sistema." / "Ir para o login"
- Link inválido: "Convite inválido" / "Este convite é inválido ou expirou. Peça um novo ao administrador." / CTA `/login`
- Erro 400: "Este convite é inválido ou expirou." (mensagem única, adaptada).
- Checklist da policy: idêntico ao reset (reusa `auth.reset.rule.*` e labels de campo).

## Critérios de aceite

- Botão desabilitado até policy OK **e** confirm === nova (mesmo gate do reset).
- Sem `token` no search → nunca renderiza o form; mostra "Convite inválido" + CTA `/login`.
- `/reset-password` continua IDÊNTICO (`variant='reset'`, testes 038 verdes).
- Nenhuma mudança no server (server-fn/client do reset intactos).
