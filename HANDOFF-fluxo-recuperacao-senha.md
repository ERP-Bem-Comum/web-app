# Handoff — Fluxo de Recuperação de Senha (front v2)

> Para o tech lead. Descreve **todas as telas e o fluxo completo** de recuperação de senha já
> implementados no web-app (front + BFF), o **contrato esperado do core-api** e as **propriedades de
> segurança**. Útil para casar com o hardening de e-mail/auth em andamento (core-api #337 e afins).

## Visão geral

Dois fluxos públicos (sem sessão), mais uma **variante reaproveitada** de ativação de conta:

| Fluxo                     | Rota (pública)                              | Feature | Server fn → core-api             |
| ------------------------- | ------------------------------------------- | ------- | -------------------------------- |
| **Esqueci Minha Senha**   | `/recuperar-senha`                          | #037    | `POST /auth/forgot-password`     |
| **Redefinir Senha**       | `/reset-password?token=<token>`             | #038    | `POST /auth/reset-password`      |
| _(variante)_ Ativar Conta | mesma tela do reset (`variant: 'activate'`) | #039    | idem `POST /auth/reset-password` |
| Política de senha         | (lida pelas telas)                          | #32     | `GET /auth/password-policy`      |

Ambas as rotas têm `beforeLoad`: **se já logado → redireciona pro `/dashboard`** (não faz sentido recuperar senha autenticado).

Todas as telas reusam o **shell visual do login** (fundo com formas + card branco sobre a barra laranja), só-tokens.

---

## Fluxo ponta a ponta

```
[Login] → "Esqueci Minha Senha"
   │
   ▼
/recuperar-senha  ── e-mail ──▶  POST /auth/forgot-password  ──▶  core-api SEMPRE 202
   │                                                                   │
   │  (resposta uniforme, não revela se o e-mail existe)               ├─ e-mail existe → dispara e-mail com link
   ▼                                                                   └─ não existe → no-op (mesma resposta)
[Modal "Verifique seu e-mail"] → "Entendi" → /login

   … usuário abre o e-mail e clica no link …

/reset-password?token=<token>
   │
   ├─ SEM token → tela "Link inválido" (sem formulário) → CTA "Solicitar novo link" → /recuperar-senha
   │
   └─ COM token → formulário Nova senha + Confirmar + checklist de regras (política)
          │
          ▼
      POST /auth/reset-password { token, newPassword }
          │
          ├─ 2xx  → Modal "Senha redefinida com sucesso!" → "Ir para o login" → /login
          ├─ 400  → erro no form: "Este link é inválido ou expirou. Solicite um novo."
          └─ rede/5xx → erro genérico + código de referência (request_id)
```

---

## Telas e estados (com os textos reais)

### 1. `/recuperar-senha` — "Recuperar Senha"

- **Título:** "Recuperar Senha" · **Subtítulo:** "Informe seu e-mail para receber o link de redefinição."
- Campo **E-mail** (`seu@email.com`) · botão **"Enviar link para meu e-mail"** · **"Cancelar"** (→ login).
- **Sucesso (SEMPRE que a chamada completa):** modal **"Verifique seu e-mail"** (mensagem uniforme) → **"Entendi"** → login.
- **Erro** (só rede/5xx): mensagem + "Código de referência: `<request_id>`".

### 2. `/reset-password?token=…` — "Redefinir Senha"

- **Sem token / token vazio:** tela **"Link inválido"** — "Este link é inválido ou expirou. Solicite um novo." + CTA **"Solicitar novo link"** (→ `/recuperar-senha`). **O formulário nunca é renderizado sem token.**
- **Com token:** título "Redefinir Senha", subtítulo "Escolha uma nova senha para a sua conta."
  - **Nova senha** + **Confirmar nova senha** (com mostrar/ocultar).
  - **Checklist de regras** ("Sua senha precisa de:") derivado da **política** (`GET /auth/password-policy`):
    - "No mínimo {min} e no máximo {max} caracteres" · "Uma letra maiúscula" · "Uma letra minúscula" · "Um número" · "Um símbolo especial como @ ^ ~ #".
  - Botão **"Redefinir senha"** só habilita quando **a senha atende à política E confirmação === nova senha**.
  - "As senhas não coincidem." quando confirmação diverge.
- **Sucesso (2xx):** modal **"Senha redefinida com sucesso!"** → **"Ir para o login"**.
- **Erro 400:** "Este link é inválido ou expirou. Solicite um novo." · **rede/5xx:** genérico + código de referência.

---

## Contrato esperado do core-api (o que o front assume)

### `POST /auth/forgot-password` — público

- Body: `{ email }`.
- **Anti-enumeração (BE-REC-003):** deve responder **SEMPRE `202`**, exista ou não o e-mail. O front devolve sucesso uniforme sempre que a chamada COMPLETA — **nunca** sinaliza se o e-mail existe. Só rede/5xx viram erro.
- Efeito (quando o e-mail existe): **disparar o e-mail** com link `.../reset-password?token=<token>`.

### `POST /auth/reset-password` — público

- Body: `{ token, newPassword }`.
- `2xx` = senha redefinida. `400` = **token inválido/expirado/usado** (o front mostra "link inválido" a partir de `reset-token-invalid`, sem vazar o subcaso). rede/5xx → genérico.

### `GET /auth/password-policy` — público

- Devolve a política (`minLength`/`maxLength` + regras). Se vier `null`/indisponível, o front **degrada com fallback `{ min 12, max 128 }`**. **A política é fonte única** — o checklist e o gate do botão derivam dela.

> **O link do e-mail deve apontar para `/<host-front>/reset-password?token=<token>`** (search param `token`). A tela lê o `token` da URL; sem ele, cai direto no estado "link inválido".

---

## Propriedades de segurança já garantidas no BFF (server fn = única fronteira)

- **Anti-enumeração** no "esqueci senha": resposta uniforme, sem revelar existência do e-mail.
- **CSRF de origem (defense-in-depth):** as duas server-fns rejeitam requisições cross-origin (checam `origin`/`host`/`sec-fetch-site`) → `forbidden`.
- **Zod na borda:** `email` e `{token, newPassword}` validados antes de cruzar a fronteira (§IX).
- **Erros como valores** (§II/§V): a UI nunca olha status HTTP; o mapeamento vive no BFF. Erro inesperado (5xx) anexa **`reference` = `request_id`** p/ correlação em log.
- **Token nunca fica exposto além do necessário:** vem só na URL do link → prop → body do POST.

---

## Mapa de arquivos (referência)

**Rotas (públicas):** `src/routes/recuperar-senha.tsx` · `src/routes/reset-password.tsx`
**Client — Esqueci Senha:** `src/modules/auth/client/forgot-password/` (page · viewModel · bind · form · success-modal)
**Client — Redefinir Senha:** `src/modules/auth/client/reset-password/` (page · viewModel · bind · form · invalid-link · success-modal · `set-password.copy.ts`)
**Server fns (fronteira):** `src/modules/auth/server/adapters/server-fns/request-password-reset.server-fn.ts` · `reset-password.server-fn.ts` · `get-password-policy.query.fn.ts`
**Adapter core-api (endpoints):** `src/modules/auth/server/adapters/core-api/core-api-auth.ts`
**Textos (i18n):** `src/shared/i18n/catalog.pt-BR.ts` (`auth.forgot.*`, `auth.reset.*`, `auth.error.*`)

---

## Pontos de atenção para o hardening de e-mail (backend)

1. **Template/remetente do e-mail de redefinição** e o **link** (`/reset-password?token=`) são responsabilidade do core-api — o front só consome o resultado.
2. **Expiração/uso único do token** deve retornar **400** (o front já trata como "link inválido").
3. **Rate limit** do `POST /auth/forgot-password` (evitar abuso do disparo de e-mail) — o front já sabe surfar `rate-limited` se o backend devolver.
4. Manter o **202 uniforme** no forgot-password (não trocar por 200/404 condicional — quebraria a anti-enumeração).
