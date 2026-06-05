[← Voltar para ADRs](./README.md)

# ADR-0005: Decisões de segurança da Auth — sessão opaca, refresh single-flight, JWT decode-only

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente (textos de UI pendentes da P.O. @lekadecastro)

---

## Contexto

A Auth (`specs/002-auth`) é a **feature-modelo** do v2. As decisões de segurança tomadas aqui viram
padrão para todo módulo que lide com sessão/token. O `core-api` entrega, no login,
`{ accessToken, refreshToken, userId }` (JWT ES256) e expõe `refresh` (rotaciona o par e detecta reuso) e
`logout` (revoga o refresh). Precisávamos decidir **onde** vivem esses tokens, **como** renovar sem o
usuário perceber, e **como** ler a expiração do access — sem violar o Princípio I (browser nunca vê token).

## Decisão

### 1. Sessão server-side + cookie opaco `__Host-session`

O cookie carrega **apenas um `sessionId` opaco** (`crypto.randomUUID()`); o par de tokens fica no
`SessionStore` server-side (`external/session`, porta genérica em `shared/ports`). Atributos:
`HttpOnly · Secure · SameSite=Strict · Path=/` + prefixo `__Host-`.

- **Por quê:** o browser nunca toca em token (Princípio I). `SameSite=Strict` + validação de origem
  (`shared/http/csrf-origin`) mitiga CSRF. `__Host-` impede sobrescrita por subdomínio.
- **Default = cookie de sessão** (sem `Max-Age`, morre ao fechar o navegador). Persistência (`Max-Age`)
  só com "lembrar este dispositivo", limitada ao TTL absoluto do refresh. **Autoridade é o backend**:
  expiração absoluta, inatividade, rotação e revogação no logout mandam — a sessão local só espelha.
- **Custo aceito:** sessão server-side é estado (anomalia REST) — mitigado por `SessionStore` como porta
  compartilhável (in-memory no dev, Redis-like em prod) para escala horizontal.

### 2. Refresh silencioso **single-flight**

Quando o access expira, o guard (`server/adapters/session.guard`) dispara o refresh **server-side**, de
forma transparente. Requisições concorrentes da mesma sessão compartilham **uma única** chamada de refresh
(single-flight): a primeira renova; as demais aguardam o mesmo resultado.

- **Por quê:** o `core-api` rotaciona o refresh e faz **reuse-detection** — dois refresh paralelos com o
  mesmo token disparariam falso-positivo de reuso e matariam a sessão. Single-flight evita a corrida.
- **Reuse real (`refresh-rotated`) → signOut**: apaga a sessão local e força re-login (fail-safe).

### 3. JWT **decode-only** (sem verificar assinatura no BFF)

O BFF **decodifica** o access só para ler `exp` (`server/adapters/decode-access-exp`); **não verifica a
assinatura**.

- **Por quê:** quem assina e valida o JWT é o `core-api` (ES256). O BFF não tem a chave pública nem é a
  autoridade — replicar verificação seria cerimônia redundante e fonte de bug. O BFF confia no token que
  ele mesmo obteve via TLS do backend e o usa apenas como Bearer; `exp` serve só para decidir *quando*
  renovar. A validação real acontece no backend a cada chamada.

### 4. `/me` devolve **só `userId`**

O endpoint de usuário atual retorna o mínimo (`userId`), não o perfil completo.

- **Por quê:** o que a UI precisa para renderizar estado autenticado é "há alguém logado e quem". Perfil
  rico é responsabilidade de um módulo de usuário futuro (Zero Trust), fora do escopo da Auth.

### 5. Redirect pós-login anti open-redirect

`?redirect=<rota>` é **saneado** (`client/data/safe-redirect`): só aceita caminho de mesma origem que
começa com `/` e não com `//`; qualquer URL externa é descartada → fallback `/`.

### 6. Mensagens de erro = **tags i18n**, default genérico

Nenhum literal de UI hardcoded — tudo é tag no catálogo (`shared/i18n`). Erro de credencial usa mensagem
**genérica** (anti-enumeração de usuários). Textos finais são da P.O. @lekadecastro.

## Consequências

**Positivas**
- Token/refresh/segredo/URL do backend confinados ao `server/` — verificável (SC-002: bundle do browser
  não contém `accessToken`/`refreshToken`/`Bearer`/segredo).
- Renovação transparente sem disparar reuse-detection; logout revoga de verdade no backend.
- Superfície de UI mínima (`userId`) e i18n-ready desde o dia 1.

**Negativas / custos**
- Estado de sessão server-side (ver mitigação no item 1).
- `decode-only` significa que um access adulterado só é rejeitado na *próxima* chamada ao backend — aceito,
  pois o BFF nunca recebe token de fonte não-confiável (ele mesmo os obteve do `core-api`).

**Neutras**
- "Lembrar este dispositivo" é opt-in; sem ele, a sessão é efêmera.

## Alternativas consideradas

- **Token no browser (localStorage/cookie legível)** — rejeitado (Princípio I): expõe a XSS/exfiltração.
- **Refresh sem single-flight** — rejeitado: corre contra a reuse-detection do backend.
- **Verificar assinatura ES256 no BFF** — rejeitado: o backend é a autoridade; redundância sem ganho.
- **`/me` com perfil completo** — adiado para o módulo de usuários (Zero Trust).

## Referências

- `.specify/memory/constitution.md` v1.2.1 §I (BFF/sem token no browser), §II (erros como valor).
- [ADR-0004](./0004-client-server-split-mvvm-ddd.md) (fronteira client/server) e
  [ADR-0002](./0002-errors-as-values.md).
- `specs/002-auth/{spec.md,research.md,contracts/}` — origem das decisões.
- `handbook/core-api/` — contrato real de login/refresh/logout/me (confirmado via `core-api-consultant`).
- `src/modules/auth/README.md` — anatomia da feature.
