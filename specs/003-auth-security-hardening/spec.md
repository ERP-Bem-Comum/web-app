# Feature Specification: Endurecimento de Segurança da Autenticação (Auth Hardening)

**Feature Branch**: `003-auth-security-hardening`

**Created**: 2026-05-30

**Status**: Draft

**Input**: Hardening da autenticação contra OWASP WSTG/ASVS, testável manualmente. Escopo: **só v2 (front+BFF)**; gaps de backend viram recomendações registradas. Categorias: Sessão (5), Anti-enumeration (2), Bypass/Guard (3) + Client/BFF (9–11), Rate-limit (7) + Reset de senha (6). **Fora de escopo:** OIDC/OAuth2/PKCE (cap. 8) e MFA (cap. 4) — não existem neste stack (login é email/senha direto no core-api, JWT ES256).

## Contexto e estado atual

A feature 002-auth já entregou: cookie `__Host-session` opaco, `SessionStore` server-side com TTL, single-flight no refresh + reuse-detection, `csrf-origin.ts` (validação de Origin/Sec-Fetch-Site), `safe-redirect.ts` (anti open-redirect), tags de erro genéricas e guard `_authenticated/`. O backend core-api já é robusto em: mensagem de login genérica (anti-enumeration), rotação obrigatória de refresh com revogação de cadeia, ES256 com allow-list de algoritmo, argon2id (params OWASP), e revogação de todas as sessões pós-troca de senha.

Esta feature **fecha as lacunas restantes no v2** e entrega um **runbook de verificação manual** mapeado a OWASP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cabeçalhos de segurança e proteção do navegador (Priority: P1)

Como responsável pela segurança, quero que toda resposta HTTP do v2 carregue os cabeçalhos de segurança corretos, para que o navegador bloqueie clickjacking, sniffing de MIME, downgrade para HTTP e execução de scripts não confiáveis na tela de login.

**Why this priority**: É a maior lacuna confirmada (nenhum security header foi encontrado em `src/`) e protege justamente a página de credenciais. Defesa de base contra XSS/clickjacking/SSL-strip.

**Independent Test**: Carregar qualquer página e a `/login`; inspecionar os response headers no DevTools/curl e confirmar presença e valor de cada cabeçalho.

**Acceptance Scenarios**:

1. **Given** qualquer rota do v2, **When** a resposta é emitida, **Then** ela inclui `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin` e `Strict-Transport-Security` (em produção/HTTPS).
2. **Given** a página `/login`, **When** carregada, **Then** uma `Content-Security-Policy` restritiva é aplicada (sem `unsafe-inline` em scripts; default-src restrito) impedindo execução de script injetado.
3. **Given** uma tentativa de embutir a app em um `<iframe>` de outra origem, **When** o navegador avalia os headers, **Then** o carregamento em frame é bloqueado (clickjacking mitigado).

---

### User Story 2 - Sessão resistente a fixation e logout efetivo (Priority: P1)

Como usuário, quero que minha sessão seja recriada com novo identificador ao autenticar e completamente invalidada no logout, para que um ID pré-login capturado não me dê acesso e um cookie roubado pare de funcionar após eu sair.

**Why this priority**: Session fixation e logout que não invalida são falhas clássicas de alta severidade (OWASP cap. 5), diretamente sob controle do BFF.

**Independent Test**: Capturar o valor do cookie antes do login; autenticar; confirmar que o `sessionId` mudou. Fazer logout e reusar o cookie antigo numa ação autenticada; confirmar rejeição.

**Acceptance Scenarios**:

1. **Given** um visitante com qualquer cookie de sessão pré-login, **When** ele faz login com sucesso, **Then** um novo `sessionId` (crypto-random opaco) é emitido e o anterior é descartado no store.
2. **Given** uma sessão ativa, **When** o usuário faz logout, **Then** a entrada é apagada do `SessionStore` server-side e o cookie é limpo; reusar o cookie antigo resulta em `auth:expired`.
3. **Given** o cookie de sessão, **When** seus atributos são inspecionados, **Then** ele tem `HttpOnly`, `Secure`, `SameSite=Strict`, prefixo `__Host-`, `Path=/`, e `Max-Age` presente **apenas** quando "lembrar dispositivo" foi marcado.
4. **Given** uma sessão, **When** atinge o tempo de expiração (idle/absoluto), **Then** o `get()` do store a remove automaticamente e a requisição cai em `auth:expired`.

---

### User Story 3 - Toda rota protegida exige sessão (guard completo) (Priority: P1)

Como responsável pela segurança, quero garantir que nenhuma rota autenticada seja acessível sem sessão válida e que nenhuma server function exponha dados sem checar sessão, para que forced browsing e troca de verbo HTTP não contornem a autenticação.

**Why this priority**: Um único endpoint sem guard anula toda a auth (OWASP cap. 3). Verificação sistemática é barata e crítica.

**Independent Test**: Acessar cada rota sob `_authenticated/` sem cookie; confirmar redirecionamento para `/login?redirect=` preservando o destino. Chamar cada server function de leitura/mutação sem sessão; confirmar `auth:expired`.

**Acceptance Scenarios**:

1. **Given** nenhuma sessão, **When** uma rota sob `_authenticated/` é acessada diretamente (forced browsing), **Then** há redirect para `/login` com o destino preservado e validado (anti open-redirect).
2. **Given** nenhuma sessão, **When** qualquer server function autenticada é chamada (qualquer verbo), **Then** ela retorna `auth:expired` sem vazar dados.
3. **Given** o conjunto de rotas e server functions, **When** auditado, **Then** existe verificação (teste/checklist) que falha se uma nova rota autenticada for criada sem o guard.

---

### User Story 4 - Mutações resistentes a CSRF e respostas que não vazam (Priority: P2)

Como responsável pela segurança, quero que toda mutação valide a origem e que nenhuma resposta vaze token, segredo ou existência de conta, para que CSRF e enumeração/vazamento sejam mitigados.

**Why this priority**: Reforça controles já parciais (`csrf-origin.ts`, tags genéricas) e cobre cap. 2/9/10.

**Independent Test**: Disparar POST de mutação com `Origin`/`Sec-Fetch-Site` cross-site; confirmar rejeição. Inspecionar bundle e DevTools por token. Comparar respostas de login com email inexistente vs. senha errada.

**Acceptance Scenarios**:

1. **Given** uma server function de mutação, **When** chamada com `Origin` ou `Sec-Fetch-Site` cross-site, **Then** é rejeitada antes de qualquer efeito.
2. **Given** o app em execução, **When** se inspeciona JS, `localStorage`, `sessionStorage`, estado e network no browser, **Then** o JWT/refresh, `CORE_API_URL` e segredos **nunca** aparecem (só o cookie opaco).
3. **Given** falha de login, **When** a resposta retorna ao browser, **Then** a tag/mensagem é genérica e idêntica para email inexistente e senha incorreta (status/forma uniformes); o redirect pós-login rejeita destinos externos (`//`, `http://…`).

---

### User Story 5 - Defesa contra automação no BFF (rate-limit) (Priority: P3) — ⏸️ DEFERRED

> **Deferred (decisão do Tech Lead, 2026-05-30)**: NÃO implementada nesta entrega. O lugar correto do rate-limit/lockout é o core-api — ver **BE-REC-001** em [`backend-recommendations.md`](./backend-recommendations.md). Mantida aqui como registro de escopo; FR-015 fica como `SHOULD` não-implementado.

Como responsável pela segurança, quero um limite de tentativas no BFF para login/refresh, para reduzir brute force/spraying mesmo enquanto o backend não tem rate-limit específico de auth.

**Why this priority**: Mitigação parcial e oportunista (o limite correto é no backend — registrado como recomendação). P3 por depender de decisão de produto sobre store/limites.

**Independent Test**: Repetir logins falhos além do limite a partir da mesma origem; confirmar respostas de throttling sem revelar validade de conta.

**Acceptance Scenarios**:

1. **Given** múltiplas tentativas de login falhas acima do limite na janela, **When** uma nova tentativa chega, **Then** o BFF responde com throttling genérico (sem distinguir conta válida/inválida) e sem travar permanentemente uma conta-alvo (evita lockout-as-DoS).

---

### Edge Cases

- "Lembrar dispositivo" desmarcado: cookie de sessão **sem** `Max-Age` (sessão de navegador).
- Refresh concorrente com mesmo token (single-flight já existente): não deve disparar reuse-detection indevida.
- Sessão expira no meio de uma ação: cai em `auth:expired` → signOut → `/login?redirect=`.
- Header `X-Forwarded-For`/`X-Forwarded-Host` forjado: rate-limit e qualquer geração de URL não devem confiar cegamente nesses headers.
- CSP quebrando estilos/scripts legítimos: política deve permitir os assets reais do app sem `unsafe-inline` em script.

## Requirements *(mandatory)*

### Functional Requirements (v2 — implementar)

- **FR-001**: O v2 MUST emitir em todas as respostas: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou CSP `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`.
- **FR-002**: O v2 MUST aplicar `Strict-Transport-Security` em produção/HTTPS e MUST garantir redirect de HTTP→HTTPS no ambiente servido.
- **FR-003**: O v2 MUST aplicar uma `Content-Security-Policy` restritiva (sem `unsafe-inline` para `script-src`; `default-src` restrito), pelo menos na `/login`.
- **FR-004**: O BFF MUST emitir um novo `sessionId` (crypto-random opaco) no login bem-sucedido e descartar qualquer sessão/ID anterior (anti session fixation).
- **FR-005**: O logout MUST apagar a sessão do `SessionStore` server-side e limpar o cookie; reuso do cookie antigo MUST resultar em `auth:expired`.
- **FR-006**: O cookie de sessão MUST incluir `HttpOnly`, `Secure`, `SameSite=Strict`, prefixo `__Host-`, `Path=/`; `Max-Age` MUST estar presente **somente** com "lembrar dispositivo".
- **FR-007**: O `SessionStore` MUST expirar sessões (campo de expiração) e remover automaticamente entradas expiradas no acesso.
- **FR-008**: Toda rota sob `_authenticated/` MUST exigir sessão válida; sem sessão MUST redirecionar a `/login` com destino preservado e validado contra open-redirect.
- **FR-009**: Toda server function autenticada MUST validar a sessão independentemente do verbo HTTP, retornando `auth:expired` quando ausente, sem vazar dados.
- **FR-010**: O projeto MUST ter uma verificação automatizada (teste/checklist) que falhe se uma rota autenticada existir sem guard.
- **FR-011**: Toda server function de **mutação** MUST validar `Origin`/`Sec-Fetch-Site` (reaproveitar `csrf-origin.ts`).
- **FR-012**: O v2 MUST garantir que JWT, refresh token, `CORE_API_URL` e segredos nunca apareçam no browser (JS, storage, estado, network) — apenas o cookie opaco.
- **FR-013**: Mensagens/tags de falha de autenticação MUST ser genéricas e uniformes (status e forma) entre "conta inexistente" e "senha incorreta".
- **FR-014**: Redirects pós-login MUST rejeitar destinos externos/protocol-relative (`//host`, `http(s)://…`), caindo em rota interna segura.
- **FR-015** (⏸️ DEFERRED — ver US5/BE-REC-001): O BFF SHOULD aplicar rate-limit/throttling em login e refresh por origem, com resposta genérica e sem permitir lockout permanente de conta-alvo (lockout-as-DoS). **Não implementado nesta entrega** — correção definitiva é no core-api.

### Recomendações ao backend core-api (registrar — fora do escopo de implementação)

> Repassar ao time de backend. Confirmado via `core-api-consultant` contra o submódulo `core-api` (branch `dev`).

- **BE-REC-001 (alta)**: Rate-limit/lockout **específico de login e refresh** — hoje só há teto global de 200/min/IP in-memory (`shared/http/app.ts`, `config.ts`), sem lockout por conta. É o maior gap.
- **BE-REC-002 (alta)**: **Dummy-hash no login para usuário inexistente** — `authenticate-user.ts` retorna antes do argon2 quando o usuário não existe, criando timing-leak (enumeração por tempo), apesar da mensagem genérica.
- **BE-REC-003 (alta)**: **Fluxo de reset/recuperação de senha** — inexistente (sem endpoint/token/TTL/one-time/anti host-header-injection). Necessário para fechar OWASP cap. 6.
- **BE-REC-004 (média)**: **Expor rotas HTTP** para `changePassword` e `revokeAllSessions` — use cases existem (com revogação de sessões pós-troca de senha) mas sem rota.
- **BE-REC-005 (baixa)**: **Blocklist de senhas vazadas** na policy — hoje só valida comprimento [8,128] (`password-policy.ts`).

### Runbook de teste manual (entregar)

- **RB-001**: Documento mapeando cada item testável a OWASP WSTG/ASVS, com passos manuais (curl/DevTools/Burp/ZAP), resultado esperado e referência ao FR/BE-REC correspondente. MUST cobrir: cap. 2 (enumeration/timing), cap. 3 (bypass/guard/verbo), cap. 5 (sessão/cookie/fixation/logout/expiração/entropia), cap. 6 (reset — via BE-REC), cap. 7 (rate-limit/lockout), cap. 9–11 (token leak/CSRF/Sec-Fetch-Site/CORS/CSP/clickjacking/open-redirect/HSTS).
- **RB-002**: Cada caso do runbook MUST registrar status (pass/fail/N-A-backend) para virar evidência de verificação.

### Key Entities

- **Sessão**: `sessionId` opaco (crypto-random), referência ao usuário, expiração (idle/absoluto); vive no `SessionStore` server-side; espelhada no cookie `__Host-session` apenas pelo id.
- **Cabeçalhos de segurança**: conjunto de headers HTTP aplicados de forma transversal às respostas do v2.
- **Caso de runbook**: id, categoria OWASP, passos, resultado esperado, FR/BE-REC vinculado, status.

## Success Criteria *(mandatory)*

- **SC-001**: 100% das respostas do v2 carregam os cabeçalhos de segurança obrigatórios (FR-001/002/003), verificável por inspeção.
- **SC-002**: Em 0 cenários o JWT/refresh/segredo/URL do backend aparece no browser (inspeção de bundle + DevTools).
- **SC-003**: Após login, o identificador de sessão é diferente do pré-login em 100% das tentativas (anti-fixation).
- **SC-004**: Após logout, 0% dos reusos do cookie antigo obtêm acesso.
- **SC-005**: 100% das rotas autenticadas e server functions rejeitam acesso sem sessão (forced browsing e qualquer verbo).
- **SC-006**: Login com conta inexistente e com senha incorreta produzem resposta indistinguível (mesma tag, status e forma) em 100% dos testes.
- **SC-007**: Redirect pós-login rejeita 100% dos destinos externos/protocol-relative testados.
- **SC-008**: O runbook cobre 100% das categorias em escopo e cada caso tem resultado registrado.

## Assumptions

- Login é email/senha direto no core-api (JWT ES256); **não há OIDC/Authentik nem MFA** neste stack — caps. 8 e 4 da lista de referência ficam fora.
- O ambiente de produção termina TLS antes do v2 (proxy/Caddy) — HSTS e redirect HTTP→HTTPS podem ser aplicados no v2 e/ou no proxy; a spec exige o comportamento, não o local exato.
- O `SessionStore` atual é in-memory com interface trocável; rate-limit no BFF (FR-015) pode usar store equivalente, ciente de que reinício zera contadores (limitação aceitável para mitigação parcial).
- Itens que dependem do backend (timing, rate-limit de auth, reset de senha) são **verificados** e **recomendados** (BE-REC-*), não implementados nesta feature.
- A correção definitiva de rate-limit/lockout e timing é no core-api; o controle no BFF é defesa-em-profundidade parcial.
