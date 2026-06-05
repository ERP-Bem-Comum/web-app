# Recomendações de Segurança para o `core-api` (Autenticação)

**Para**: time de backend (core-api)
**De**: frontend v2 / BFF — feature 003 (Auth Security Hardening)
**Data**: 2026-05-30
**Origem**: auditoria de hardening da autenticação contra OWASP WSTG/ASVS. As lacunas abaixo **não** podem ser corrigidas no frontend/BFF — dependem do backend. Cada item foi verificado direto no submódulo `core-api` (branch `dev`).

---

## Como ler este documento

Cada recomendação segue a mesma estrutura, para facilitar o repasse:

- **O problema** — o que está acontecendo hoje, em linguagem simples.
- **Por que importa** — o risco concreto (com a referência OWASP).
- **Evidência no código** — onde isso está, para o time confirmar.
- **Sugestão** — o caminho de correção (sem impor implementação).
- **Prioridade** — 🔴 alta / 🟡 média / 🟢 baixa.

> ⚠️ **Importante sobre o que NÃO é problema.** Durante a auditoria confirmamos que **vários controles do backend já estão corretos e robustos** — eles estão listados no final, na seção "O que já está bom". O backend está, no geral, bem feito; este documento é sobre as **5 lacunas restantes**.

---

## Contexto rápido da arquitetura

Para situar quem for ler do lado do backend:

- O **frontend v2** não fala com o `core-api` diretamente pelo navegador. Existe um **BFF** (Backend-for-Frontend, dentro do próprio app v2) que é quem chama o `core-api`.
- O navegador só recebe um **cookie de sessão opaco** (`__Host-session`) — **nunca** vê o JWT nem o refresh token. Esses ficam guardados no servidor (BFF).
- Login é **e-mail/senha** direto no `core-api` (`POST /api/v2/auth/login`), que devolve `accessToken` (JWT ES256), `refreshToken` e `userId`.
- **Não há OIDC/OAuth2/Authentik nem MFA** neste stack — então recomendações sobre esses temas não se aplicam.

Ou seja: tudo que envolve **força bruta de senha, política de senha, hashing, reset de senha e tempo de resposta do login** é responsabilidade do `core-api`. O BFF pode ajudar com defesa-em-profundidade, mas a correção correta mora no backend.

---

## BE-REC-001 — Rate-limit / lockout específico de login e refresh 🔴

### O problema
Hoje o `core-api` tem **um único rate-limit global**, igual para todas as rotas: **200 requisições por minuto por IP**, guardado **em memória**. Não existe um limite mais apertado para o `/login` nem para o `/refresh`, e **não existe "account lockout"** (bloqueio temporário após N tentativas erradas numa mesma conta).

Na prática, isso significa que um atacante pode tentar **até 200 senhas por minuto** contra uma conta — e, distribuindo entre IPs, ainda mais.

### Por que importa
- **Brute force** (OWASP WSTG-ATHN-03): testar muitas senhas contra um usuário válido.
- **Password spraying**: testar uma senha comum (ex.: `Verao@2026`) contra muitos usuários — esse ataque **driblaria** um lockout por conta justamente porque erra pouco em cada conta; por isso o ideal é ter **ambos**: limite por IP/origem **e** contador por conta.
- 200/min é alto demais para um endpoint de senha. Endpoints de autenticação costumam ter limites na casa de poucas tentativas por minuto.

### Evidência no código
- `core-api/src/shared/http/app.ts` — `@fastify/rate-limit` registrado **uma vez**, global.
- `core-api/src/shared/http/config.ts` — `DEFAULT_RATE_LIMIT_MAX = 200`, `DEFAULT_RATE_LIMIT_WINDOW = '1 minute'`.
- Busca por `lockout | attempts | brute | failedLogin | locked` em `src/modules/auth/` → **nenhum resultado**.
- O agregado `User` (`domain/identity/user/`) não tem campo de tentativas falhas nem de bloqueio temporário.
- O store do rate-limit é **in-memory** (há comentário dizendo que "produção sobrepõe com Redis", mas essa sobreposição **não está implementada** aqui).

### Sugestão
1. Aplicar um rate-limit **dedicado e mais restritivo** em `/login` e `/refresh` (ex.: poucas tentativas por minuto por IP/origem), separado do teto global.
2. Adicionar um **contador de tentativas falhas por conta** com bloqueio temporário progressivo (ex.: atraso crescente ou janela de cooldown), tomando cuidado para **não permitir "lockout como DoS"** (um atacante travar de propósito a conta de uma vítima) — preferir cooldown temporário a bloqueio permanente.
3. Em produção, usar um store compartilhado (ex.: Redis) para o rate-limit funcionar com múltiplas instâncias e sobreviver a reinícios.

> **Mitigação parcial no BFF (já planejada na 003, FR-015):** o BFF pode throttlear login/refresh por origem, mas é defesa-em-profundidade limitada (store próprio, zera ao reiniciar). **A correção real é aqui no backend.**

---

## BE-REC-002 — Login não roda hash quando o usuário não existe (timing attack) 🔴

### O problema
Quando alguém tenta logar com um **e-mail que não existe**, o backend responde **rápido** (retorna o erro antes de verificar qualquer senha). Quando o e-mail **existe** mas a senha está errada, o backend roda o algoritmo de hash (argon2id, que é propositalmente lento) e responde **mais devagar**.

Essa **diferença de tempo de resposta** permite a um atacante descobrir **quais e-mails são contas reais** no sistema — mesmo que a *mensagem* de erro seja idêntica nos dois casos.

### Por que importa
- **User enumeration por timing** (OWASP WSTG-ATHN — enumeração de contas). Saber quais e-mails existem é o primeiro passo para spraying/brute force direcionado e phishing.
- O detalhe perverso: a mensagem genérica (que vocês **acertaram** — veja "O que já está bom") dá uma falsa sensação de segurança, mas o **relógio** entrega a informação.

### Evidência no código
- `core-api/src/modules/auth/application/use-cases/authenticate-user.ts` — a sequência é: busca o usuário por e-mail → **se não achar, retorna `invalid-credentials` imediatamente, antes do argon2** → só roda `passwordHasher.verify` quando o usuário existe.
- O hasher em si é forte e constant-time (`adapters/crypto/password-hasher.argon2.ts`, argon2id com parâmetros OWASP). O vazamento está no **fluxo** do caso de uso, não no hasher.

### Sugestão
Executar uma verificação de hash **"dummy"** (contra um hash fixo descartável) no ramo em que o usuário **não existe**, para que o tempo de resposta seja **equivalente** ao do ramo "usuário existe, senha errada". É um padrão clássico de mitigação de timing em login.

> **O BFF não consegue corrigir isto de forma confiável** — normalizar latência no BFF é frágil e mascara o sintoma. A correção correta é o dummy-hash no `core-api`.

---

## BE-REC-003 — Não existe fluxo de reset/recuperação de senha 🔴

### O problema
**Não há** endpoint de "esqueci minha senha" / recuperação. Não existe token de reset, nem expiração, nem proteção contra os ataques típicos desse fluxo.

### Por que importa
Além de ser uma funcionalidade que os usuários vão precisar, o fluxo de reset é um dos **mais atacados** da autenticação (OWASP WSTG — cap. de recuperação de senha). Se/quando for construído, ele precisa nascer seguro, evitando os erros clássicos:

- **Token previsível ou sem validade** — link de reset que pode ser adivinhado ou que nunca expira.
- **Token reutilizável** — funciona mais de uma vez (deve ser **one-time** e invalidar após o uso).
- **Host Header Injection** — o atacante manipula o cabeçalho `Host`/`X-Forwarded-Host` para que o link de reset enviado por e-mail aponte para o **domínio dele**, capturando o token da vítima.
- **Enumeração no reset** — responder "enviamos um e-mail" só quando a conta existe (deve responder igual para conta existente ou não).
- **Reset sem invalidar sessões ativas** — após trocar a senha, sessões antigas deveriam cair.
- **IDOR** — trocar o `userId` na requisição e resetar a senha de outra pessoa.

### Evidência no código
- Busca por `reset | forgot | recover` em `src/modules/auth/` → **nenhum resultado**.
- As únicas rotas de auth são: `register`, `login`, `refresh`, `logout`, `me`.

### Sugestão
Projetar o fluxo de reset **já com**: token aleatório de alta entropia, **TTL curto**, **one-time** (invalida após uso), URL de reset montada a partir de **origem confiável configurada no servidor** (nunca do header `Host` da requisição), resposta **genérica** (anti-enumeração), e **revogação de todas as sessões** após a troca. A boa notícia: a peça de "revogar todas as sessões" já existe (veja BE-REC-004).

---

## BE-REC-004 — `changePassword` e `revokeAllSessions` existem mas não têm rota HTTP 🟡

### O problema
O backend **já implementou** dois casos de uso importantes — **trocar senha** (autenticado) e **revogar todas as sessões** (logout de todos os dispositivos) — mas eles **não estão expostos como endpoints HTTP**. Ou seja, a lógica existe e está boa, só não há como chamá-la de fora.

### Por que importa
- **Troca de senha autenticada** é um requisito básico de conta e pré-requisito para o fluxo de reset (BE-REC-003).
- **Revogar todas as sessões** é o controle que faz "trocar a senha derrubar os outros logins" funcionar de ponta a ponta — importante quando o usuário suspeita de conta comprometida (OWASP ASVS V3 — gestão de sessão).

### Evidência no código
- `core-api/src/modules/auth/application/use-cases/change-password.ts` — existe e, inclusive, **já chama `revokeAllForUser`** após a troca (revoga todas as sessões — ótimo).
- `core-api/src/modules/auth/application/use-cases/revoke-session.ts` — contém `revokeAllSessions` (todos os dispositivos), mas só `revokeSession` (este dispositivo) está ligado a uma rota.
- Nenhuma rota em `adapters/http/plugin.ts` aponta para esses dois casos de uso.

### Sugestão
Expor duas rotas HTTP autenticadas: uma para **trocar a senha** (recebe senha atual + nova) e outra para **encerrar todas as sessões**. A lógica já está pronta — é "só" conectar à camada HTTP (com validação de input e as proteções de rota já usadas nas demais).

---

## BE-REC-005 — Política de senha valida só o comprimento 🟢

### O problema
A política de senha exige apenas **comprimento entre 8 e 128 caracteres**. Não há checagem contra **senhas vazadas/comuns** (listas de senhas que já apareceram em vazamentos públicos).

### Por que importa
- **Senhas fracas/comuns** (OWASP WSTG-ATHN-07): mesmo com 8+ caracteres, `12345678` ou `password1` passam. As recomendações modernas (NIST 800-63B) priorizam **comprimento + blocklist de senhas vazadas** em vez de regras de composição (maiúscula/símbolo/etc.).
- Prioridade baixa porque a decisão de "comprimento > complexidade" **já segue o NIST** (é uma escolha correta); o que falta é a camada de blocklist.

### Evidência no código
- `core-api/src/modules/auth/domain/credential/password-policy.ts` — `MIN_LENGTH = 8`, `MAX_LENGTH = 128`; sem regra de composição (decisão deliberada, citando NIST) e **sem** checagem de senha vazada.
- Aplicada corretamente tanto no registro quanto na troca de senha.

### Sugestão
Adicionar uma verificação contra uma **blocklist de senhas vazadas/comuns** no momento de cadastrar ou trocar senha (ex.: lista local das senhas mais comuns, ou checagem via *k-anonymity* contra um serviço de "have I been pwned"). Manter a regra de comprimento como está.

---

## O que já está bom (não mexer — só para o time saber) ✅

Para dar o crédito devido e evitar "corrigir o que não está quebrado", estes controles foram auditados e estão **corretos e robustos**:

1. **Mensagem de erro de login genérica (anti-enumeração).** E-mail inexistente, e-mail malformado, senha fora da política e senha incorreta retornam **todos** o mesmo `invalid-credentials` (401). A única diferenciação (`user-disabled`, 403) só acontece **depois** de a senha correta ter sido verificada — então não vaza existência de conta. Há até teste de regressão para isso. *(O único furo aqui é o de **tempo**, tratado em BE-REC-002.)*
   - `application/use-cases/authenticate-user.ts`, `tests/modules/auth/adapters/http/routes.test.ts`.

2. **Rotação obrigatória de refresh token + reuse-detection.** Cada refresh é **one-time**: ao usar, gera um par novo. Se um refresh já rotacionado for reapresentado (sinal de roubo/replay), o backend **revoga a cadeia inteira** do usuário e retorna `refresh-token-rotated`. (É por isso que o BFF faz "single-flight" no refresh.)
   - `application/use-cases/refresh-access-token.ts`.

3. **Revogação de todas as sessões após troca de senha.** O `changePassword` já chama `revokeAllForUser` (alinhado a OWASP ASVS V3.3).
   - `application/use-cases/change-password.ts`.

4. **JWT com algoritmo travado.** Assinatura e verificação fixadas em **ES256** (allow-list), o que **bloqueia** ataques de confusão de algoritmo (`alg: none`, troca RS↔HS). Valida `iss` e exige `sub`. Sem roles/e-mail no token.
   - `adapters/crypto/token-issuer.es256.ts`.

5. **Hashing de senha forte.** argon2id com parâmetros recomendados pela OWASP (memória 19456 KiB, 2 iterações, etc.) e comparação constant-time.
   - `adapters/crypto/password-hasher.argon2.ts`.

6. **Logout idempotente e sem vazamento.** Revoga o refresh apresentado; token inexistente → responde OK sem revelar nada.
   - `application/use-cases/revoke-session.ts`.

---

## Resumo executivo (tabela)

| ID | Recomendação | Prioridade | Existe hoje? |
|----|--------------|:----------:|--------------|
| BE-REC-001 | Rate-limit/lockout específico de login e refresh | 🔴 Alta | Só rate-limit global 200/min/IP, in-memory; sem lockout |
| BE-REC-002 | Dummy-hash no login para usuário inexistente (timing) | 🔴 Alta | Não — retorna antes do argon2 |
| BE-REC-003 | Fluxo de reset/recuperação de senha (seguro) | 🔴 Alta | Não existe |
| BE-REC-004 | Expor rotas HTTP de `changePassword` e `revokeAllSessions` | 🟡 Média | Use cases prontos, sem rota |
| BE-REC-005 | Blocklist de senhas vazadas na política | 🟢 Baixa | Só valida comprimento [8,128] |

---

## Como confirmar o estado atual (para o time de backend)

Para validar os contratos ao vivo: rodar `pnpm run serve` no `core-api` e abrir `/docs/json` (OpenAPI 3.1.1) — lista todas as rotas reais. As 5 rotas de auth confirmadas são `register`, `login`, `refresh`, `logout` e `me`, todas sob `/api/v2/auth`.

> Dúvidas sobre qualquer item: a auditoria completa (frontend + backend) está em `specs/003-auth-security-hardening/spec.md`. Os trechos de código citados acima são os pontos de partida para confirmar cada achado.
