# Contract — core-api Auth (`/api/v2/auth/*`)

Verificado com `core-api-consultant` contra `core-api@73c2f9b` (branch `dev`). Fonte: `modules/auth/adapters/http/{plugin,schemas,auth-hook,composition}.ts`.

## Endpoints

### POST /api/v2/auth/login
- **Body:** `{ email: string, password: string }`
- **200:** `{ accessToken: string, refreshToken: string, userId: string }`
- **Erros:** `401 invalid-credentials` · `403 user-disabled` · `400 validation`
- Anti-enumeration: email/senha malformados, usuário inexistente e senha errada → todos `invalid-credentials`.

### POST /api/v2/auth/refresh
- **Body:** `{ refreshToken: string }`
- **200:** `{ accessToken, refreshToken, userId }` — **refreshToken NOVO (rotação obrigatória, one-time-use)**
- **Erros:** `401 refresh-token-not-found|revoked|rotated|expired` · `403 user-disabled` · `400 validation`
- ⚠️ **Reuse-detection:** reapresentar um refresh já `rotated` → backend **revoga a cadeia inteira** do usuário.

### POST /api/v2/auth/logout
- **Body:** `{ refreshToken: string }`
- **204** sem corpo (idempotente; revoga **só** esse refresh). Sem 401/403.

### GET /api/v2/auth/me
- **Auth:** header `Authorization: Bearer <jwt>` (access token ES256)
- **200:** `{ userId: string }` — **somente** (sem email/nome/roles)
- **Erros:** `401 unauthorized` (sem header / inválido / **expirado** — não distinguidos)

## Envelope de erro (todos 4xx/5xx)
`{ error: { code: string, message: string, requestId: string } }` — em falhas de domínio `message === code`.
**Discriminar por `code`.** Toda resposta `/api/v2` tem `cache-control: no-store`.

## Tokens / sessão (backend)
- Access **JWT ES256**, TTL **15 min**; claims `sub`=userId, `iss`='core-api', `iat`, `exp` (sem roles/email).
- Refresh **opaco**, TTL **30 dias** (sliding por emissão). Rotação obrigatória; logout revoga só o apresentado.
- BFF: **decode-only** do access (`exp`) p/ timing de refresh; core-api valida a assinatura. (Verificação real
  no BFF = decisão futura, exige chave pública estável; em dev o core-api usa par efêmero por boot.)
