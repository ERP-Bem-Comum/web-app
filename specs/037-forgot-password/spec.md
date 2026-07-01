# Spec — Recuperar Senha (Esqueci Minha Senha)

- **ID:** 037-forgot-password
- **Tamanho:** M (feature pequena, fatia vertical MVVM + BFF no módulo `auth`)
- **Módulo:** `src/modules/auth` (espelha a feature-modelo do LOGIN)
- **Data:** 2026-07-01

## Problema / valor

O fluxo de login expõe o link "Esqueci Minha Senha", hoje um placeholder (`href="#"`).
O usuário que esqueceu a senha não tem como solicitar a redefinição. Precisamos de uma tela
pública que dispare o e-mail de reset via `core-api`, sem nunca revelar se o e-mail existe.

## Escopo (o que ENTRA)

1. Ligar o link "Esqueci Minha Senha" (login-form) para navegar até `/recuperar-senha`.
2. Rota pública `/recuperar-senha` (fora de `_authenticated`), espelhando `/login`
   (redireciona ao dashboard se já autenticado).
3. Tela "Recuperar Senha": mesmo layout/fundo do login (formas + card + barra laranja),
   logo B, título, 1 input **E-mail**, botão **"Enviar link para meu e-mail"** e **"Cancelar"**
   (volta ao login).
4. Server function `POST /auth/forgot-password` (body `{ email }`) via `coreApiAuth.forgotPassword`.
5. Modal de sucesso **sempre** que a chamada COMPLETA (202): mensagem anti-enumeração + "Entendi"
   (fecha e volta ao login).

## Fora de escopo

- A tela de **redefinir** senha (consumir o token do e-mail) — é outro fluxo/rota.
- Alteração de política de senha, OCR, ou qualquer coisa não relacionada.

## Regras de negócio / contrato (VERIFICADO no core-api)

- `POST /auth/forgot-password` body `{ email }` → **SEMPRE 202** (anti-enumeração BE-REC-003).
  Emite `PasswordResetRequested` → e-mail de reset. NUNCA revela se o e-mail existe.
- **Anti-enumeração (CRÍTICO):** a tela mostra o MESMO modal de sucesso em qualquer 202.
  Só erro de **conectividade/servidor** (rede/5xx) mostra mensagem de erro genérica.
  Nunca diferenciar "e-mail não encontrado".

## User Story (P1)

Como usuário que esqueceu a senha, quero informar meu e-mail e solicitar o link de redefinição,
para recuperar o acesso — recebendo sempre a mesma confirmação (sem vazar se a conta existe).

### Critérios de aceite

- AC1: O link "Esqueci Minha Senha" no login navega para `/recuperar-senha`.
- AC2: `/recuperar-senha` é pública; se já autenticado, redireciona ao dashboard.
- AC3: Submeter um e-mail válido → em 202, abre o modal de sucesso com a mensagem anti-enumeração
  e botão "Entendi".
- AC4: "Entendi" fecha o modal e volta ao login.
- AC5: "Cancelar" volta ao login sem enviar.
- AC6: Erro de conectividade/servidor mostra mensagem genérica; NÃO abre o modal de sucesso;
  NÃO diferencia e-mail inexistente.
- AC7: Todas as strings vêm do catálogo i18n (PT); nada hardcoded na view.

## Não-funcionais

- MVVM (§XI): view burra, view-model puro, binding é o único que toca React/@tanstack.
- Erros como valores (Result); server fn = única fronteira (§III); token nunca no browser (§IX).
- Zod na borda (input da server fn e do controller). CSS só-tokens (§X).
