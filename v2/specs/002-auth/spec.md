# Feature Specification: Autenticação (Auth) — Feature-Modelo de Referência

**Feature Branch**: `feat/v2-auth`

**Spec Directory**: `specs/002-auth`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Feature de Autenticação (Auth) do v2 — slice BFF completo (login, logout, me, refresh, sessão + guard), a feature-modelo documentada que devs e agentes de IA usarão como referência."

## Visão Geral

A Auth é o **portão de entrada** do ERP e a **feature de referência** do v2: o primeiro módulo vertical
completo (`modules/auth/{domain,application,adapters,ui,public-api}`), exercitando todas as camadas, o
BFF, sessão e segurança. Tem **dois públicos**:

1. **Usuário final** — entra com email/senha, permanece logado, sai com segurança.
2. **Devs e agentes de IA** — leem este módulo (e sua documentação do *porquê*) para entender como o
   projeto se organiza e replicar o padrão corretamente em outras features.

O princípio de segurança que governa tudo: **o browser nunca vê tokens, refresh tokens, segredos nem a
URL do backend**. O BFF (server functions) detém os tokens; o navegador carrega apenas um identificador
de sessão opaco em cookie `HttpOnly`. *Por quê:* um token no JavaScript do browser é roubável por XSS;
mantê-lo só no servidor remove essa classe inteira de ataque.

## Clarifications

### Session 2026-05-29

- Q: Escopo da Auth v1 além de login/logout/me/refresh/sessão/guard? → A: **Nada a mais**. Registro,
  recuperação de senha e 2FA ficam fora. O **CRUD de usuários** será um **módulo futuro separado —
  "gerência de usuários"** — sob princípio **Zero Trust** (demanda mapeada, não pertence à Auth).
- Q: Onde vive o refresh token? → A: **Opção A** — cookie HttpOnly carrega só o `sessionId` **opaco**;
  access **e** refresh vivem no **SessionStore server-side** (browser nunca vê token). Mantém a
  constituição/ADR-0002. Trade-off aceito conscientemente: sessão server-side é **stateful** (anomalia
  frente ao ideal REST/stateless), adotada por **segurança + menos validação** — logo, **escala
  horizontal exige session store compartilhado** (ex.: Redis em prod; in-memory só em dev).
- Q: Persistência da sessão e "remember me"? → A: **Default = cookie de sessão** (sem `Max-Age`/`Expires`
  → intenção funcional de encerrar ao fechar o navegador). Persistência entre reinícios **só** via ação
  explícita **"lembrar este dispositivo"** (aí cookie recebe `Max-Age`/`Expires`, **nunca** maior que o
  TTL absoluto do refresh). A **autoridade é o backend**, não o fechar do navegador: refresh com
  **expiração absoluta**, **timeout por inatividade**, **rotação** e **revogação no logout**.
- Q: Redirect pós-login (destino padrão + open-redirect)? → A: Sem destino → **`/`** (home autenticada;
  futura dashboard). Com destino → search param **`?redirect=<rota>`** na `/login`, aceitando **apenas
  caminhos internos relativos** (mesma origem, começa com `/` e não `//`); URL externa/absoluta é
  **descartada** → cai no padrão. Padrão **seguro anti open-redirect**, referência do projeto.
- Q: Como o módulo se organiza (arquitetura — decisão estrutural do projeto)? → A: **Separação clara
  client × server** dentro do módulo. **`server/`** = BFF, **DDD** (`domain` puro / `application` use cases
  / `adapters` server functions + client core-api + Zod; usa `external/`; token/sessão server-side — "tudo
  que definimos pro BFF, inalterado"). **`client/`** = FRONT, **MVVM** (`data` = Model[padronização do que
  o BFF já devolveu]+Repository[porta → server-fn] · `usecase` opcional · `view-model`[TanStack+store,
  `{estado,ações}`] · `ui`[`*.page.tsx` template burro + `*.controller.ts` form + `*.component.tsx`]).
  **Fronteira client↔server = a server function.** **Event Bus** (`shared/bus`, eventos no passado) e
  **Controller** (estado transiente de form) são **padrões oficiais**. Materializa em **constituição
  v1.2.0 + novo ADR** (refina ADR-0001) + ajuste no `eslint.config.js`.
- Q: Granularidade/textos das mensagens de erro? → A: **Strings de UI são TAGS** resolvidas por um
  **catálogo centralizado** (l10n/i18n-ready) — o código referencia **chaves**, nunca literais; troca de
  texto é num arquivo só. Default **genérico** (credencial inválida → mensagem única, anti-enumeração).
  Os **textos e as regras de página/view são da P.O. @lekadecastro** (o Tech Lead cuida do resto) —
  ⚠️ **lembrete:** revisar os textos finais com a P.O. Alinhado à constituição (§ "strings de UI via i18n").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar no sistema (Login) (Priority: P1)

Como usuário do ERP, quero entrar com meu email e senha e ser reconhecido pelo sistema, para acessar as
áreas protegidas do meu trabalho.

**Why this priority**: sem login não há sessão; é o pré-requisito de tudo. É o coração do MVP.

**Independent Test**: na tela de login, submeter credenciais válidas (`admin@bemcomum.dev` /
`DevPassw0rd!2024`) → o usuário é autenticado e levado à área logada; um cookie de sessão `HttpOnly` é
criado; inspecionando o navegador, nenhum token aparece. Credenciais inválidas → mensagem clara, sem login.

**Acceptance Scenarios**:

1. **Given** a tela de login, **When** o usuário submete email e senha válidos, **Then** uma sessão é
   criada, um cookie `HttpOnly`/`SameSite=Strict`/`Secure` com identificador opaco é setado, e o usuário
   é redirecionado para a área autenticada (ou para a rota que tentava acessar antes).
2. **Given** a tela de login, **When** o usuário submete credenciais inválidas, **Then** vê uma mensagem
   de erro compreensível ("credenciais inválidas") e permanece deslogado, sem vazar detalhe técnico.
3. **Given** uma conta desabilitada, **When** o usuário tenta entrar, **Then** vê mensagem apropriada
   (acesso não permitido) e não é autenticado.
4. **Given** qualquer momento do fluxo, **When** o tráfego/estado do browser é inspecionado, **Then**
   nenhum token de acesso, refresh token ou URL interna do backend é observável.

---

### User Story 2 - Acessar áreas protegidas (Guard de rota) (Priority: P1)

Como usuário logado, quero acessar páginas protegidas livremente; e, se minha sessão não existir, quero
ser levado ao login e, após entrar, voltar para onde eu queria ir.

**Why this priority**: o valor da autenticação é proteger o conteúdo; sem guard, login não significa nada.

**Independent Test**: acessar uma rota protegida sem sessão → redireciona ao login preservando o destino;
após login, retorna ao destino original. Com sessão válida → acessa normalmente.

**Acceptance Scenarios**:

1. **Given** um visitante sem sessão, **When** ele acessa uma rota protegida, **Then** é redirecionado ao
   login, e o destino pretendido é preservado para retorno pós-login.
2. **Given** um usuário com sessão válida, **When** ele acessa uma rota protegida, **Then** o conteúdo é
   exibido sem fricção.
3. **Given** um usuário cuja sessão expirou/foi invalidada, **When** uma ação encontra resposta de
   "não autorizado" do backend, **Then** a sessão é limpa e o usuário é levado ao login automaticamente.

---

### User Story 3 - Permanecer logado (renovação silenciosa) (Priority: P2)

Como usuário, quero continuar trabalhando sem ser deslogado a cada poucos minutos, mesmo que o token de
acesso tenha vida curta.

**Why this priority**: tokens de acesso curtos são uma boa prática de segurança, mas não podem custar UX;
a renovação silenciosa concilia os dois. É P2 porque o login (P1) já entrega valor sem ela.

**Independent Test**: com uma sessão ativa, após o token de acesso expirar, realizar uma ação que exige
autenticação → o sistema renova o acesso nos bastidores (sem pedir login de novo) e a ação conclui. Se a
renovação não for possível (refresh inválido/expirado), o usuário é levado ao login.

**Acceptance Scenarios**:

1. **Given** uma sessão com token de acesso expirado mas refresh válido, **When** o usuário faz uma ação
   autenticada, **Then** o acesso é renovado silenciosamente e a ação conclui sem novo login.
2. **Given** uma sessão cujo refresh token está inválido/expirado/revogado, **When** a renovação é
   tentada, **Then** a sessão é limpa e o usuário é redirecionado ao login.

---

### User Story 4 - Sair com segurança (Logout) (Priority: P2)

Como usuário, quero sair do sistema e ter certeza de que minha sessão foi encerrada de verdade — inclusive
do lado do servidor —, especialmente em computador compartilhado.

**Why this priority**: encerra o ciclo de sessão e é requisito de segurança/privacidade; P2 porque depende
de já existir uma sessão (P1).

**Acceptance Scenarios**:

1. **Given** um usuário logado, **When** ele faz logout, **Then** o refresh token é revogado no backend, a
   sessão server-side é apagada e o cookie é removido — uma tentativa subsequente de acessar área protegida
   exige novo login.

---

### User Story 5 - Saber quem está logado (Usuário atual) (Priority: P2)

Como usuário logado, quero que a interface mostre que estou autenticado (e quem sou), para confiar no
estado da sessão e acessar ações do meu perfil.

**Why this priority**: habilita o estado autenticado na UI (nome/avatar, menus); P2 por ser sustentação do
P1/P2, não o caminho crítico inicial.

**Acceptance Scenarios**:

1. **Given** um usuário com sessão válida, **When** a interface carrega, **Then** ela reflete o estado
   "autenticado" e exibe a identidade do usuário, obtida de forma segura (sem expor tokens).
2. **Given** um visitante sem sessão, **When** a interface carrega, **Then** ela reflete o estado
   "não autenticado".

---

### Edge Cases

- **Credenciais inválidas / conta desabilitada**: mensagens distintas e claras; nunca vazar detalhe interno.
- **Backend indisponível no login**: mensagem de indisponibilidade, sem travar a UI; nada de stack trace.
- **Refresh em corrida (múltiplas requisições simultâneas com token expirado)**: a renovação não deve
  duplicar/rotacionar o refresh de forma inconsistente — uma única renovação coordenada.
- **Sessão expirada server-side**: tratada como "não autenticado" → login.
- **Logout com backend fora do ar**: a sessão/cookie local devem ser limpos mesmo se a revogação remota
  falhar (não deixar o usuário "preso logado" no cliente).
- **Cookie ausente/adulterado**: tratado como sem sessão (sem erro 500 ao usuário).
- **Acesso direto a rota protegida por URL**: guard intercepta antes de renderizar conteúdo.

## Requirements *(mandatory)*

### Functional Requirements

**Login & sessão (US1)**
- **FR-001**: O sistema MUST permitir login com email e senha, autenticando contra o backend e criando uma
  sessão server-side ao sucesso.
- **FR-002**: O sistema MUST entregar ao navegador apenas um **cookie com `sessionId` opaco** (`HttpOnly`,
  `SameSite=Strict`, `Secure`), sem nenhum token/segredo no corpo, JS ou storage do browser. Por padrão é
  um **cookie de sessão** (sem `Max-Age`/`Expires` → encerra ao fechar o navegador). Persistência entre
  reinícios MUST exigir ação explícita do usuário ("lembrar este dispositivo"), e nunca exceder o TTL
  absoluto do refresh token.
- **FR-003**: O sistema MUST exibir erros de login compreensíveis, sem vazar detalhe técnico/stack. As
  mensagens MUST vir de um **catálogo centralizado de strings (tags/chaves, l10n-ready)** — **nenhum
  literal de UI hardcoded** no código. Default **genérico** para falha de credencial (e-mail ou senha →
  mensagem única, **anti-enumeração**). Os **textos finais e a granularidade são decisão da P.O.
  @lekadecastro** (pendente de revisão); o código só referencia as chaves.

**Guard & autorização de acesso (US2)**
- **FR-004**: O sistema MUST proteger rotas autenticadas — sem sessão válida, redireciona ao login.
- **FR-005**: O sistema MUST preservar o destino pretendido (via `?redirect=<rota>` na `/login`) e retornar
  a ele após login; sem destino, vai para **`/`**. MUST aceitar **apenas caminhos internos relativos**
  (mesma origem, começa com `/` e não `//`) — URL externa/absoluta é descartada (proteção anti open-redirect).
- **FR-006**: O sistema MUST, ao receber "não autorizado" do backend numa operação, limpar a sessão e
  levar o usuário ao login automaticamente.

**Renovação silenciosa (US3)**
- **FR-007**: O sistema MUST renovar o acesso nos bastidores quando o token de acesso expirar e houver
  refresh válido, sem exigir novo login.
- **FR-008**: O sistema MUST, quando a renovação falhar (refresh inválido/expirado/revogado), limpar a
  sessão e redirecionar ao login.
- **FR-009**: O sistema SHOULD coordenar renovações concorrentes para não rotacionar o refresh de forma
  inconsistente (uma renovação por vez).

**Logout (US4)**
- **FR-010**: O sistema MUST, no logout, revogar o refresh token no backend, apagar a sessão server-side e
  remover o cookie.
- **FR-011**: O sistema MUST limpar a sessão/cookie locais mesmo se a revogação remota falhar.

**Usuário atual (US5)**
- **FR-012**: O sistema MUST expor à interface a identidade do usuário logado de forma segura, para
  renderizar o estado autenticado; e indicar "não autenticado" quando não houver sessão.

**Segurança & conformidade (transversal)**
- **FR-013**: O navegador NUNCA MUST receber access token, refresh token, segredos ou a URL interna do
  backend — verificável por inspeção do tráfego/bundle.
- **FR-014**: O sistema MUST mitigar CSRF (cookie `SameSite=Strict` + validação de origem nas mutações).
- **FR-015**: A interface MUST seguir MVVM (views burras; a ViewModel orquestra estado de login/sessão) e
  os invariantes da constituição v1.1.0 + ADRs (Result, sem any/class-exceto-QueryError/throw fora da borda).
- **FR-018**: A **autoridade da sessão é o backend** (não o fechar do navegador): o sistema MUST tratar
  refresh **expirado, revogado, rotacionado ou inativo** como "sem sessão" (→ login), e MUST honrar a
  **rotação** do refresh e sua **revogação no logout**. Timeout por **inatividade** e **absoluto** são
  enforçados pelo backend; o BFF os respeita.
- **FR-019**: Os tokens MUST viver num **SessionStore server-side** (cookie carrega só o `sessionId`). O
  store MUST ser **externalizável/compartilhado** para suportar escala horizontal (ex.: in-memory em dev,
  store compartilhado tipo Redis em prod) — trade-off consciente de sessão *stateful* por segurança.

**Feature-modelo / documentação (meta-requisito)**
- **FR-016**: O módulo `auth` MUST incluir documentação do **porquê** (README "anatomia da feature" +
  comentários inline didáticos), servindo de referência para devs/agentes replicarem o padrão.
- **FR-017**: As decisões arquiteturais relevantes da Auth (sessão, cookie, refresh, fronteiras) MUST ser
  registradas como **ADRs** em `handbook/adr/`.

### Key Entities *(include if data involved)*

- **Credenciais de login**: email + senha fornecidos pelo usuário (transitam só do browser ao BFF, sob TLS).
- **Sessão**: registro server-side associando um identificador opaco aos tokens (access/refresh), à
  identidade do usuário e a um instante de expiração. Vive fora do alcance do browser.
- **Cookie de sessão**: portador do identificador opaco no navegador (`HttpOnly`/`SameSite=Strict`/`Secure`).
- **Usuário (identidade)**: dados mínimos do usuário autenticado expostos à UI (ex.: id, email/nome) — sem tokens.
- **Resultado de autenticação (erros)**: união semântica de falhas (credenciais inválidas, conta
  desabilitada, sessão expirada, indisponibilidade), que a UI traduz em mensagens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com credenciais válidas completa o login e chega à área autenticada em poucos
  segundos, no primeiro fluxo, sem instrução adicional.
- **SC-002**: Em 100% das telas/estados de Auth, a inspeção do navegador (tráfego, storage, bundle) **não**
  revela access token, refresh token, segredo ou URL do backend.
- **SC-003**: Após o token de acesso expirar, a próxima ação autenticada conclui **sem** novo login
  (renovação silenciosa), de forma verificável.
- **SC-004**: Acesso a rota protegida sem sessão sempre redireciona ao login e, após autenticar, retorna ao
  destino pretendido — 100% dos casos testados.
- **SC-005**: Logout encerra a sessão de forma que uma tentativa subsequente de área protegida exige novo
  login; o refresh é revogado no backend.
- **SC-006**: Mensagens de erro são compreensíveis e distintas (inválido vs desabilitado vs indisponível),
  sem stack/detalhe técnico.
- **SC-007**: `pnpm lint`/`typecheck`/`test`/`build` verdes; nenhuma violação da constituição/ADRs.
- **SC-008** (feature-modelo): um dev/agente novo consegue, lendo o `modules/auth/README.md` e o código,
  explicar o papel de cada camada e o fluxo de uma requisição autenticada — e replicar o padrão numa nova
  feature sem ferir as fronteiras de lint.

## Assumptions

- **Stack/arquitetura herdada** (constituição v1.1.0 + ADRs): módulo vertical `modules/auth/{domain,
  application,adapters,ui,public-api}`; `Result`; cadeia de erro `HttpError→AppError→QueryError`; MVVM;
  cliente HTTP e sessão em `external/`. Não são decisões desta spec — são restrições.
- **Contrato do backend**: assume-se `POST /api/v2/auth/login {email,password} → {accessToken,refreshToken,
  userId}` (JWT ES256), além de endpoints de logout/refresh/me. Os **shapes exatos e o envelope de erro
  serão confirmados com o agente `core-api-consultant` no `/speckit-plan`** (o envelope é
  `{error:{code,message,requestId}}`, sem `issues[]`, conforme spec 001).
- **Rota de login**: `/login` (pública); a fundação já redireciona auth:expired para o login.
- **Armazenamento de sessão**: server-side, **externalizável/compartilhado** para escala horizontal —
  in-memory em dev, store compartilhado (tipo Redis) em prod. Token nunca no browser (cookie = `sessionId`
  opaco). Trade-off consciente de sessão *stateful* por segurança/menos validação (ver Clarifications).
- **Tempo de vida**: TTL do access token ditado pelo backend (JWT, curto); a continuidade vem do refresh.
  Default = **cookie de sessão** (encerra ao fechar o navegador); **persistência entre reinícios é opt-in**
  via "lembrar este dispositivo" (Max-Age ≤ TTL absoluto do refresh). Autoridade real = backend (expiração
  absoluta + inatividade + rotação + revogação). Ver Clarifications.
- **Registro de usuário / recuperação de senha / 2FA**: **fora de escopo** (a P.O. @lekadecastro prioriza
  o fluxo de entrada; o usuário de dev já é semeado pelo backend).
- **Gerência de usuários (CRUD)**: demanda **mapeada** porém **fora desta feature** — será um **módulo
  próprio futuro** (`modules/users` ou similar) sob princípio **Zero Trust**. A Auth cuida só de
  autenticação/sessão; autorização granular e administração de contas pertencem a esse módulo.
- **Credenciais de dev**: `admin@bemcomum.dev` / `DevPassw0rd!2024` (semeado pelo core-api).

## Dependencies

- **Fundação (spec 001)**: `shared/` (Result, cadeia de erro, QueryError), `external/` (result-fetch,
  map-to-server-response, env.config), QueryClient (`auth:expired → signOut`). Auth constrói sobre isso.
- **Constituição v1.1.0** e **ADRs** `handbook/adr/0001`–`0003`.
- **Backend `core-api`** (submódulo) — contratos de auth via `core-api-consultant`.
- **Branch**: `feat/v2-auth` (a partir de `rebase-v2`) — Auth terá PR próprio.
