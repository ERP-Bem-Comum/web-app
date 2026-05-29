# Phase 12: Integração com Backend core-api — Specification

**Created:** 2026-05-28
**Ambiguity score:** 0.14 (gate: ≤ 0.20)
**Requirements:** 8 locked

## Goal

O módulo de Contratos do frontend TanStack Start passa a consumir a API REST real do backend core-api (Fastify 5 + MySQL + MinIO) em vez da mock API H3 local, mantendo 100% da UX existente enquanto adapta o domain model, auth JWT ES256 real, e storage S3/MinIO para documentos.

## Background

O frontend ERP-FRONTEND migrou de Next.js para TanStack Start (Phases 1–6) e opera 100% com uma mock API H3 na porta 4010. O backend core-api (repositório ERP-Bem-Comum/core-api, branch dev) está completo com módulos auth (5 endpoints HTTP) e contracts (11 endpoints HTTP), autenticação JWT ES256 + refresh tokens rotacionados, persistência MySQL 8.4 via Drizzle ORM, e storage de documentos via MinIO (S3-compatível).

**Estado atual do frontend:**
- Server Functions em `src/server/contracts.ts` apontam para `http://localhost:4010`
- Auth usa mock JWT estático (`mock-jwt-token-static`) via cookie HttpOnly auto-assinado (alg: none)
- Domain types usam `number` para IDs, `Money` como `number` (reais), enums em português
- Upload de PDF envia base64 data URL dentro do JSON do contrato/aditivo
- Contrato inclui campos de parceiro (supplier/financier/collaborator) e dados bancários/PIX inline
- Schemas Zod validam regras de negócio (teto OS, obrigatoriedade de contratado, datas)

**Gap para o backend real:**
- Backend usa UUID v4 (`string`) para IDs; frontend usa `number`
- Backend usa centavos (`bigint`) para dinheiro; frontend usa reais (`number`)
- Backend não tem endpoints para fornecedores/financieiros/colaboradores (virão do futuro módulo Gestão de Parceiros)
- Backend não tem campos bancários/PIX no contrato (já removido do frontend na Phase 7)
- Backend aceita upload de documentos via `application/octet-stream` (não base64 em JSON)
- Backend requer `contract:read` / `contract:write` permissions (RBAC)
- Backend auth retorna JWT ES256 (15 min) + refresh token opaco (30 dias)

## Stack & Architecture

### Libs Instaladas

| Lib | Camada | Uso |
|-----|--------|-----|
| `neverthrow` | Domain + Application | `Result<T,E>`, `ok()`, `err()`, `ResultAsync` em use-cases e regras de negócio puros |
| `fp-ts` | Adapters / Borda | `TaskEither`, `Option`, `Reader`, `pipe` para composição complexa de IO, async, efeitos |
| `newtype-ts` | Domain + Adapters | Branded types com `iso`, `prism` — usado com `fp-ts` na borda e com smart constructors no domain |
| `zod` | Borda (validação) | Input validation (server fn) + response schema validation (backend DTOs) |
| `xstate` | UI (views) | State machines para fluxos complexos de UI (wizards, modais multi-step) |
| `ofetch` | Adapters (HTTP) | HTTP client com retry, interceptors, auto-parse JSON — base do `resultFetch` refatorado |
| `iron-session` | Server (auth) | Cookie criptografado (seal/unseal) para sessão HttpOnly opaca |
| `jose` | Server (auth) | JWT sign/verify ES256 — mesma lib do backend |
| `unstorage` | Server (auth) | `SessionStore` port — memory em dev, Redis em prod |
| `@t3-oss/env-core` | Config | Env validation com Zod + autocomplete TypeScript |
| `eslint-plugin-boundaries` | Dev | Import restrictions entre camadas (`domain` → `adapters` proibido) |
| `vitest` | Testes | Test runner — já instalado |

### Divisão Arquitetural: neverthrow vs fp-ts

```
┌────────────────────────────────────────────────────────────┐
│  Domain + Application (use-cases)                          │
│  ─────────────────────────────────                         │
│  neverthrow: Result<T,E>, ok(), err(), ResultAsync         │
│  Puro, legível, sem efeitos colaterais                     │
├────────────────────────────────────────────────────────────┤
│  Fronteira: Port (interface)                               │
│  ────────────────────────────                              │
│  Promise<Result<T,E>> ou ResultAsync<T,E>                  │
│  neverthrow — contrato entre app e adapter                 │
├────────────────────────────────────────────────────────────┤
│  Adapters / Infrastructure / Borda                         │
│  ───────────────────────────────────                       │
│  fp-ts: TaskEither<E,T>, Option, Reader, pipe              │
│  Composição complexa, async, IO, efeitos                   │
│  Converte para neverthrow ao retornar pela port            │
└────────────────────────────────────────────────────────────┘
```

### Ponte neverthrow ↔ fp-ts na fronteira

Adapters usam `fp-ts` internamente para composição, mas **convertem para `neverthrow` ao cruzar a port**:

```ts
// Adapter interno (fp-ts)
const taskEither = pipe(
  TE.tryCatch(() => http.post('/contracts', contract), mapHttpError),
  TE.chain(parseContractResponse)
)

// Fronteira: converte TaskEither → ResultAsync (neverthrow)
return ResultAsync.fromPromise(
  taskEither().then(result =>
    E.isLeft(result)
      ? Promise.reject(result.left)
      : Promise.resolve(result.right)
  ),
  e => e as ContractError
)
```

Helper reutilizável: `lib/fp-ts-neverthrow-bridge.ts`

## Requirements

1. **Subir ambiente backend local**
   - Current: Backend core-api clonado mas não rodando localmente; frontend aponta para mock H3 na porta 4010
   - Target: Docker Compose sobe MySQL 8.4 + MinIO na network `core-api`; backend `pnpm run serve` roda na porta 3000 com driver `memory` ou `mysql`; bucket `contracts-documents` criado e acessível
   - Acceptance: `curl http://localhost:3000/health` retorna `{"status":"ok"}`; `curl http://localhost:3000/docs/json` retorna OpenAPI 3.1.1 válido; MinIO console acessível em `localhost:9001`

2. **Auth real JWT ES256 + refresh tokens**
   - Current: Auth usa `mock-jwt-token-static`; cookie de sessão auto-assinado com `alg: none`; refresh token inexistente
   - Target: Login chama `POST /api/v2/auth/login` do backend real e recebe `{ accessToken, refreshToken, userId }`; sessão frontend armazena accessToken + refreshToken em cookie HttpOnly seguro; authMiddleware injeta `Authorization: Bearer <accessToken>` nas Server Functions; refresh automático silencioso quando accessToken expira (401); logout chama `POST /api/v2/auth/logout` e revoga refresh token no backend
   - Acceptance: Usuário consegue fazer login com credenciais reais do backend; após 15 min de inatividade, o próximo request dispara refresh transparente e continua funcionando; logout limpa cookie e invalida sessão no backend; `GET /api/v2/auth/me` retorna dados do usuário logado

3. **Mapeamento de IDs: number → UUID string**
   - Current: `ContractId` é branded `number`; todos os IDs de contrato, aditivo, documento, parceiro são `number`
   - Target: `ContractId` passa a ser branded `string` (UUID v4); todas as Server Functions aceitam e propagam `string` nos path params e bodies; rotas do TanStack Router (`detalhes.$id.tsx`, `editar.$id.tsx`, etc.) tratam `id` como `string`
   - Acceptance: Typecheck passa sem erros em `src/features/contracts/` e `src/server/`; nenhum `parseInt` ou `Number(id)` usado para IDs de contrato; listagem e detalhe funcionam com UUIDs reais do backend

4. **Mapeamento de valores monetários: reais → centavos**
   - Current: `totalValue: number` armazena reais (ex: 1500.50); frontend formata com `fmtBRL`
   - Target: Server Functions convertem `totalValue` (reais) para `originalValueCents` / `impactValueCents` (centavos, inteiro) ao enviar para backend; responses do backend com campos `*_cents` são convertidos para `totalValue` (reais) ao retornar para o frontend; tipo `Money` continua sendo `number` (reais) no frontend domain
   - Acceptance: Criar contrato com valor R$ 1.500,50 persiste como 150050 cents no backend; detalhe do contrato exibe R$ 1.500,50 corretamente; aditivo de acréscimo de R$ 500,00 soma corretamente ao valor atual

5. **Mapeamento de endpoints e domain model**
   - Current: Server Functions apontam para `/contracts`, `/contracts/aditive`, `/contracts/history/:id`; mock aceita base64 data URL como `signedContractUrl`
   - Target: Server Functions mapeadas para endpoints reais do backend:
     - `GET /api/v2/contracts` → lista
     - `GET /api/v2/contracts/:id` → detalhe
     - `POST /api/v2/contracts` → criar (mode: Pending | Active)
     - `POST /api/v2/contracts/:id/activate` → ativar contrato Pending
     - `POST /api/v2/contracts/:id/amendments` → criar aditivo
     - `POST /api/v2/contracts/:id/amendments/:amendmentId/homologate` → homologar aditivo
     - `GET /api/v2/contracts/:id/history` → timeline
     - `POST /api/v2/contracts/:id/documents` → upload documento contrato
     - `POST /api/v2/contracts/:id/amendments/:amendmentId/documents` → upload documento aditivo
     - `POST /api/v2/contracts/:id/documents/:documentId/supersede` → substituir documento
   - Acceptance: Cada operação CRUD do módulo Contratos no frontend resulta em request HTTP correspondente ao backend real com status 2xx; erro 404 mapeia para "Não encontrado"; erro 403 mapeia para "Sem permissão"; erro 409/422 mapeia para mensagem de regra de negócio

6. **Upload/download de documentos via S3/MinIO**
   - Current: PDF convertido para base64 data URL e enviado como string JSON no body; preview usa `<embed src={dataUrl}>`
   - Target: Upload de PDF usa `Content-Type: application/octet-stream` com metadados (`categoria`, `fileName`, `mimeType`, `signedElectronically`) na query string; backend retorna documento com `bucket` + `storageKey`; download/preview usa `GET` ao MinIO/S3 (ou signed URL do backend se disponível); supersede de documento suportado
   - Acceptance: Usuário seleciona PDF no formulário de contrato/aditivo → arquivo aparece no MinIO bucket `contracts-documents` → preview do PDF funciona no browser → substituir documento mantém versionamento

7. **Distrato como aditivo com efeito de término**
   - Current: `AditivoType.DISTRATO` existe no frontend; mock API aplica `contractStatus = 'Distrato'` ao homologar
   - Target: Aditivo tipo `distrato` no frontend é enviado ao backend como `kind: 'Misc'` + descrição indicando distrato; após homologação, frontend também chama `POST /api/v2/contracts/:id/activate` (ou endpoint equivalente de término quando existir) para transicionar contrato para `Terminated`; status derivado no frontend mostra "Distrato" quando contrato backend está `Terminated` e existe aditivo Misc com descrição de distrato
   - Acceptance: Criar aditivo distrato em contrato vigente → após homologação, contrato aparece como "Distrato" na listagem; timeline mostra evento de término; contrato não aceita novos aditivos

8. **Campos de parceiros e dados bancários mantidos (stub/futura integração)**
   - Current: Contrato exibe e edita supplier/financier/collaborator com nome, CNPJ, dados bancários, PIX — dados vêm do mock API
   - Target: Campos de parceiro e dados bancários/PIX permanecem na UI e nos tipos do frontend mas não são enviados ao backend (o backend não os aceita); quando backend retornar contrato sem parceiro, frontend preenche com `null` ou stub; futura integração com módulo "Gestão de Parceiros" preencherá esses dados
   - Acceptance: Tela de detalhes ainda mostra seção "Contratado" (mesmo que vazia ou com dados locais); formulário de criação mantém select de fornecedor/financieiro/colaborador (dados podem vir de mock local ou futura API); typecheck passa sem remover campos do `Contract` type

## Boundaries

**In scope:**
- Subir backend core-api localmente (Docker Compose MySQL + MinIO)
- Auth real: login, logout, refresh token, me, cookie HttpOnly seguro
- Mapeamento de IDs para UUID e valores monetários para centavos no BFF
- Todas as Server Functions de contratos apontando para `/api/v2/*` do backend real
- Upload/download de PDF via octet-stream + MinIO
- Distrato mapeado como Misc + término de contrato
- Manter campos de parceiros/bancários na UI para futura integração
- Adaptação de status enums (backend `Pending|Active|Expired|Terminated` → frontend `Pendente|Vigente|Encerrado|Distrato`)
- Tratamento de erros HTTP 400/401/403/404/409/422/502/503 com mensagens amigáveis

**Out of scope:**
- Módulo Gestão de Parceiros (fornecedores/financieiros/colaboradores) — será Phase futura; campos ficam como stub
- Módulo Financial (contas a pagar) — backend tem CLI mas sem HTTP surface
- Módulo Notifications — sem HTTP surface
- Migração de dados do mock para o backend real — banco começa vazio
- Alterações no backend core-api — frontend se adapta ao contrato existente
- Feature flags ou toggle entre mock e real — migração é definitiva (mock pode ser mantido como fallback dev opcional)
- Deploy em produção — apenas ambiente local de desenvolvimento
- Testes E2E do backend — assumimos que backend já passa em seus próprios testes

## Constraints

- Backend core-api roda na porta 3000 (configurável via `PORT`); frontend TanStack Start na porta 3000 também — necessário ajustar porta do frontend para evitar conflito (ex: 3001 ou 5173)
- JWT ES256 exige chaves ECDSA; em dev o backend gera par ephemeral no boot (tokens não sobrevivem restart)
- MinIO expõe API S3 na porta 9000 e console na 9001
- Upload máximo 20 MiB por arquivo (limite do backend)
- MySQL 8.4 requer Docker Compose com secrets files em `./secrets/`
- Cookie HttpOnly deve usar `Secure` em produção, mas `SameSite=Lax` pode ser necessário em dev sem HTTPS
- O módulo Contratos é o único que deve ser SSR no frontend (outros podem ser CSR)

## Acceptance Criteria

- [ ] `docker compose up -d` sobe MySQL + MinIO sem erro; `pnpm run serve` no backend retorna health ok
- [ ] Login com credenciais reais do backend cria sessão válida; cookie HttpOnly contém accessToken + refreshToken
- [ ] Após 15 min, request automático de refresh token acontece silenciosamente e renova sessão
- [ ] Listagem de contratos (`/contratos`) exibe contratos reais do backend com UUIDs
- [ ] Criar contrato persiste no backend MySQL; contrato aparece na listagem após refresh
- [ ] Criar aditivo de valor/prazo/escopo/distrato persiste no backend e reflete no contrato pai
- [ ] Homologar aditivo atualiza `currentValue` / `currentPeriod` do contrato no backend
- [ ] Upload de PDF no formulário salva arquivo no MinIO; preview funciona via URL pública ou signed URL
- [ ] Contrato com status `Terminated` no backend aparece como "Distrato" no frontend quando há aditivo Misc de distrato
- [ ] Campos de parceiro e dados bancários permanecem visíveis na UI (mesmo que vazios ou com dados locais)
- [ ] Logout limpa cookie e revoga refresh token no backend
- [ ] Erros 401 redirecionam para login; erros 403 mostram "Sem permissão"; erros 409/422 mostram mensagem do backend
- [ ] Typecheck (`yarn typecheck`) passa sem erros no módulo contracts
- [ ] Build (`yarn build`) passa sem erros

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Integração clara: mock → real      |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Parceiros stub; distrato mapeado   |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Portas, JWT, MinIO, upload limit   |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 13 critérios pass/falha definidos  |
| **Ambiguity**      | 0.14  | ≤0.20| ✓      |                                    |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary                                          | Decision locked                                                              |
|-------|----------------|-----------------------------------------------------------|------------------------------------------------------------------------------|
| 1     | Researcher     | O que existe hoje no frontend vs backend?                 | Frontend usa mock H3 na 4010; backend Fastify real pronto em dev             |
| 1     | Researcher     | Quais os gaps de domain model?                            | IDs number→UUID; valores reais→centavos; base64→octet-stream; auth mock→real |
| 2     | Simplifier     | Qual o mínimo para integração funcionar?                  | Auth real + CRUD contratos + upload PDF funcionando end-to-end               |
| 3     | Boundary Keeper| O que NÃO entra nesta phase?                              | Gestão de Parceiros, Financial, Notifications, deploy prod, migração de dados|
| 3     | Boundary Keeper| Como tratar parceiros/bancários que backend não tem?      | Manter no frontend como stub; futura Phase de integração com Gestão Parceiros|
| 4     | Failure Analyst| O que quebra se mapearmos errado?                         | Type mismatch (UUID vs number); valor monetário incorreto; upload falhando   |
| 4     | Failure Analyst| Como mapear distrato se backend não tem?                  | Misc + descrição + término de contrato; status derivado no frontend          |

---

*Phase: 12-integra-o-com-backend-core-api*
*Spec created: 2026-05-28*
*Next step: /gsd-discuss-phase 12 — implementation decisions (how to build what's specified above)*
