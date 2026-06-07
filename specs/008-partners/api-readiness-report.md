# Relatório de Prontidão da API (core-api): Gestão de Parceiros

**Feature**: `specs/008-partners/` · **Emissor**: Arquitetura Frontend v2 · **Destinatário**: Time core-api
**Data**: 2026-06-06 (Revisão 3 — relido contra `origin/dev`) · **Base**: `origin/dev` do core-api, HEAD `560ea44` (merge da PR #20 `003-partners-aggregator-export`), módulo `partners`

> Como o browser nunca fala com o core-api direto (Princ. I), toda capacidade depende de um endpoint atrás
> da server function. **Revisão 3 (2026-06-06)**: relido contra `origin/dev` após o merge da **PR #20**
> (`003-partners-aggregator-export`). Três novidades em relação à Revisão 2: **(1)** agregador
> **`GET /api/v1/partners`** (lista unificada dos 4 tipos, paginada, com AND das 4 permissões de leitura);
> **(2)** **export CSV** ganhou paridade em **collaborators, financiers e acts** (antes só suppliers); e
> **(3)** o tipo **ACT deixou de ser placeholder** — agora é **CRUD completo + export** e alimenta o agregador.
> Contracts **não foi tocado** pela PR #20 (é a spec 007). O restante da superfície segue integrando de
> verdade — nada em mock.
>
> _Revisão 2 (histórica): os 5 gaps foram implementados, RBAC (FR-020) resolvido (`/me` expõe `permissions[]`),
> e as 2 pendências de produto (filtros programa/idade, financiador PF) decididas (descartar / PJ-only)._

## 1. Resumo Executivo

O módulo `partners` está montado sob **`/api/v1`** (não `/api/v2`). A PR #20 acrescentou um **agregador**
`GET /api/v1/partners` (lista unificada dos 4 tipos — supplier/financier/collaborator/act — paginada,
busca por `name`/`document`, filtro `type` opcional; envelope `{ items, meta }`; RBAC = **AND** de
`supplier:read`+`financier:read`+`collaborator:read`+`act:read`), **paridade de export CSV** em
collaborators/financiers/acts (suppliers já tinha), e **promoveu o ACT** de placeholder para **CRUD
completo + export** (já registrado no server e consumido pelo agregador). Soma-se aos 5 gaps já fechados na
Rev. 2 (import de colaboradores, export de fornecedores, catálogo de categorias, e **parceria territorial**
— estados/municípios com `par_states`/`par_municipalities`, `isPartner`, toggles idempotentes `POST/DELETE`
que **retornam o DTO**). **RBAC resolvido**: `GET /api/v2/auth/me` entrega `permissions[]` para o `can()`
(FR-020). Pendências de produto **decididas**: filtros `programa`/`idade` descartados (FR-012; idade
derivável de `dateOfBirth` no client) e **financiador PJ-only** (sem variante PF). Atenção de integração:
o import espera **CSV cru `text/csv`** (não multipart) — a server function do BFF converte o upload do
browser em texto. Contrato ao vivo: `GET /docs/json` (OpenAPI).

## 2. Matriz de Prontidão (atualizada)

| Sub-domínio / Capacidade                  | Endpoint (`/api/v1`)                                                                        | Existe?              | RBAC                                              | Veredito          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------- | ----------------- |
| **Agregador — lista unificada** 🆕         | `GET /partners` (page,limit,search,type) → `{ items, meta }`                                | ✅                   | **AND** `supplier:read`+`financier:read`+`collaborator:read`+`act:read` | 🟢                |
| Colaboradores — CRUD + desativar/reativar | `GET/POST/PUT /collaborators`, `/:id`, `/:id/{complete-registration,deactivate,reactivate}` | ✅                   | `collaborator:read/write` (+`edit-sensitive` CPF) | 🟢                |
| Colaboradores — **import lote**           | `POST /collaborators/import` (`text/csv` raw, ~2 MiB)                                       | ✅                   | `collaborator:write`                              | 🟢                |
| Colaboradores — **export** 🆕              | `GET /collaborators/export` (text/csv)                                                      | ✅                   | `collaborator:read`                               | 🟢                |
| Colaboradores — filtros programa/idade    | —                                                                                           | ❌ won't-do (FR-012) | —                                                 | ⚪ fora de escopo |
| Fornecedores — CRUD                       | `GET/POST/PUT /suppliers`, `/:id`, deactivate/reactivate                                    | ✅                   | `supplier:read/write`                             | 🟢                |
| Fornecedores — **export**                 | `GET /suppliers/export` (text/csv)                                                          | ✅                   | `supplier:read`                                   | 🟢                |
| Fornecedores — **catálogo categorias**    | `GET /suppliers/service-categories` (39)                                                    | ✅                   | `supplier:read`                                   | 🟢                |
| Financiadores — CRUD                      | `GET/POST/PUT /financiers`, `/:id`, deactivate/reactivate                                   | ✅                   | `financier:read/write`                            | 🟢                |
| Financiadores — **export** 🆕             | `GET /financiers/export` (text/csv)                                                         | ✅                   | `financier:read`                                  | 🟢                |
| Financiador — variante PF                 | —                                                                                           | ❌ PJ-only           | —                                                 | ⚪ fora de escopo |
| **Estados parceiros**                     | `GET /partner-states` · `POST/DELETE /partner-states/:uf`                                   | ✅                   | `geography:read/write`                            | 🟢                |
| **Municípios parceiros**                  | `GET /partner-municipalities?uf=XX` · `POST/DELETE /partner-municipalities/:ibgeCode`       | ✅                   | `geography:read/write`                            | 🟢                |
| **ACT** (4º tipo de parceiro)             | `GET/POST/PUT /acts`, `/:id`, `/:id/{deactivate,reactivate}`, `GET /acts/export`            | ✅                   | `act:read/write`                                  | 🟢 CRUD completo  |
| **RBAC — permissões na UI**               | `GET /api/v2/auth/me` → `{ userId, permissions[] }`                                         | ✅                   | (sessão)                                          | 🟢                |

## 3. Detalhe por Sub-domínio

### Agregador `/partners` — 🟢 PRONTO (novo, PR #20)

- **Endpoint**: `GET /api/v1/partners` (`adapters/http/partners-plugin.ts`; schemas `partners-schemas.ts`;
  composição read-side pura em `partner-aggregate-query.ts`). Lista **unificada** dos 4 tipos de parceiro.
- **Query** (`partnersAggregateQuerySchema`): `page` (≥1, default 1), `limit` (1..100, default 20),
  `search?` (casa em `name` **OU** `document`, case-insensitive), `type?` (`supplier|financier|collaborator|act`;
  valor inválido → **400** Zod).
- **Resposta** `{ items, meta }`:
  - `items[]` = `{ type: 'supplier'|'financier'|'collaborator'|'act', id, name, document, active }`
    (`partnerListItemSchema`).
  - `meta` = `{ itemCount, totalItems, itemsPerPage, totalPages, currentPage }` — ⚠️ **shape de paginação do
    partners**, diferente do `{ page, limit, total, totalPages }` usado em contracts. O Model do client precisa
    mapear os dois mundos.
- **RBAC**: exige o **AND** das 4 permissões de leitura (`supplier:read` + `financier:read` +
  `collaborator:read` + `act:read`), guards encadeados — o primeiro que falhar corta com **403**. ⚠️ Implica
  que o agregador **só aparece** para quem tem as 4 reads; a UI deve esconder/degradar conforme o `can()`.
- **Erros**: reader indisponível → **503** (`{supplier,financier,collaborator,act}-read-unavailable`);
  soma dos 4 readers > 10.000 → **503** `partners-aggregate-too-large` (safety cap — paginação/busca é
  feita in-memory após o fan-out). Envelope canônico `{ error: { code, message, requestId } }`.

### Colaboradores — 🟢 PRONTO

- **Endpoints**: `adapters/http/plugin.ts`. CRUD + complete-registration + deactivate/reactivate + **import** + **export**.
- **Export** 🆕 (PR #20): `GET /collaborators/export` (RBAC `collaborator:read`; mesmos filtros da listagem via `collaboratorListQuerySchema`). Headers: `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="collaborators.csv"`, `x-content-type-options: nosniff`.
- **Import** (`plugin.ts:268-306`): `POST /collaborators/import`, **`Content-Type: text/csv`** (raw string, `addContentTypeParser`, bodyLimit ~2 MiB) — **não multipart**. Colunas: `name, email, cpf, occupationArea, role, startOfContract, employmentRelationship`. Resposta sempre `200 { created, failed: [{ line, error }] }` (import parcial). CSV malformado → `400 collaborator-import-malformed`.
- **Filtros suportados** (`collaboratorListQuerySchema`): `search, active, status, occupationAreas, employmentRelationships, genderIdentities, breeds, educations, disableBy, roles, yearOfContract, page, limit, order`.
- **Fora de escopo (won't-do, FR-012)**: `programa` (não é conceito do BC do colaborador) e `idade` (derivável de `dateOfBirth` no client; chaves desconhecidas são `strip`).

### Fornecedores — 🟢 PRONTO

- **CRUD**: `supplier-plugin.ts`. **Export**: `GET /suppliers/export` (query `search?, active?(0|1), categories?[]`; `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="suppliers.csv"`, `nosniff`, escape anti-fórmula; sem paginação).
- **Catálogo**: `GET /suppliers/service-categories` → `string[]` (39 códigos canônicos; `serviceCategory` virou **union fechada** no domínio, `service-category.ts`, com typos legados preservados `ONGANIZACAO_DE_EVENTOS`, `TRASPORTE`). **Nuance**: na borda HTTP ainda é `z.string()` validado pelo domínio (inválido → `422 invalid-service-category`), não `z.enum`.

### Financiadores — 🟢 PRONTO (PJ-only)

- CRUD completo (`financier-plugin.ts`). Contrato exige `corporateName`, `legalRepresentative`, `cnpj(14)`. **Sem variante PF**.
- **Export** 🆕 (PR #20): `GET /financiers/export` (RBAC `financier:read`; filtros `page,limit,order,search,active`). Headers: `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="financiers.csv"`, `x-content-type-options: nosniff`.

### Estados parceiros — 🟢 PRONTO (novo)

- Tabela `par_states` (`schemas/mysql.ts:229-250`: PK `uf varchar(2)`, `active`, `deactivatedAt`, soft-delete). Plugin `partner-geography-plugin.ts` (registrado em `server.ts:122-126`).
- `GET /partner-states` → `[{ uf, isPartner }]` (27 UFs). `POST /partner-states/:uf` ativa (idempotente). `DELETE /partner-states/:uf` desativa. **O toggle retorna o DTO** `{ uf, isPartner }` (200) confirmando o estado — usar para atualização otimista, sem refetch obrigatório. UF fora do catálogo → `400 invalid-state` (envelope `{ error: { code, message, requestId } }`).

### Municípios parceiros — 🟢 PRONTO (novo)

- Tabela `par_municipalities` (`schemas/mysql.ts:256-279`: PK **`ibge_code varchar(7)`**, `uf`, soft-delete).
- `GET /partner-municipalities?uf=XX` → `[{ ibgeCode, uf, name, isPartner }]` (query `uf` **obrigatória**). `POST/DELETE /partner-municipalities/:ibgeCode` (idempotente); **o toggle retorna o DTO** `{ ibgeCode, uf, name, isPartner }` (200, `name` resolvido do catálogo). Código fora do catálogo → `400 invalid-ibge-code`.
- ⚠️ **Identidade por `ibgeCode`** (não por nome) — o Model do client precisa carregar `ibgeCode`.

### ACT — 🟢 PRONTO (4º tipo de parceiro; promovido de placeholder na PR #20)

- ⚠️ **Mudança vs. Revisão 2**: o ACT **deixou de ser placeholder**. Em `origin/dev` é um **CRUD completo
  + export**, registrado no `server.ts` e **consumido pelo agregador** (`deps.listActRecords()` retorna dados
  reais). Veredito subiu de 🟡 para 🟢.
- **Endpoints** (`adapters/http/act-plugin.ts`, RBAC `act:read/write`): `GET /acts` (lista, filtros
  `page,limit,order,search,active`), `GET /acts/:id`, `POST /acts` (201+Location), `PUT /acts/:id`,
  `POST /acts/:id/{deactivate,reactivate}`, **`GET /acts/export`** (text/csv; `filename="acts.csv"`; nosniff).
- Campos = os 7 do núcleo do pré-cadastro do colaborador (`name, email, cpf, occupationArea, role,
  startOfContract, employmentRelationship`) + status duplo + soft-delete. O front pode clonar a UI do
  Colaborador (núcleo) apontando para `/api/v1/acts`, **sem mock**.
- ⚠️ **Ainda não há**: import em lote, complete-registration de 27 campos e filtros avançados (fora do
  escopo até as regras reais de produto). Não acoplar além do núcleo — o shape pode crescer.
- **Pendência de produto**: o significado da sigla **ACT** ainda não foi informado (identificador técnico `act`).

## 4. Estratégia de Integração (atualizada)

| Sub-domínio   | Fase 1 (agora)                              | Observação                                                      |
| ------------- | ------------------------------------------- | --------------------------------------------------------------- |
| **Agregador** | **real** 🆕                                  | `GET /partners`; AND das 4 reads (esconder na UI sem `can()`); paginação/busca `meta` em shape partners |
| Financiadores | **real** (CRUD + export)                    | PJ-only                                                         |
| Fornecedores  | **real** (CRUD + export + catálogo)         | categoria validada no domínio                                   |
| Colaboradores | **real** (CRUD + import + export)           | import: BFF converte multipart→`text/csv`                       |
| **ACT**       | **real** 🆕 (CRUD + export)                  | núcleo do colaborador; sem import/complete-registration ainda  |
| Estados       | **real**                                    | toggle idempotente por UF                                       |
| Municípios    | **real**                                    | toggle idempotente por `ibgeCode`; `uf` obrigatório na listagem |

> O mock deixa de ser necessário em **toda** a superfície de partners (agregador + 4 tipos + território).
> ADR-0001 (mock progressivo) permanece válido como **princípio de design** (ponto de troca no gateway), mas
> a Fase 1 já integra real em tudo que está implementado. Restam apenas: idade derivada no client e
> financiador-PF (não suportado).

## 5. Pendências remanescentes (não-mock)

- **Financiador PF** ✅ **decidido — PJ-only**: confirmado por tripla convergência (API PJ-only nas 3 camadas: CNPJ obrigatório/único, sem CPF; formulário legado PJ; 100% dos registros com CNPJ). O "PJs ou pessoas físicas" do `context.md` era impreciso, nunca real. Front: remover "PJ/PF" da spec; PF só se virar requisito **novo** de produto (épico de backend — documento fiscal polimórfico).
- **Filtros programa/idade** ✅ **decidido — descartados (FR-012)**: backend não os anuncia (chaves desconhecidas são `strip`). Front: derivar idade de `dateOfBirth` (client-side) e remover "programa" da UI de filtros.
- **Detalhe de borda**: import multipart→`text/csv` é responsabilidade da server function do BFF.
- **RBAC na UI (FR-020)** 🟢 **RESOLVIDO** (core-api, ticket `AUTH-ME-PERMISSIONS`): `GET /api/v2/auth/me`
  agora retorna `{ userId, permissions: string[] }` — as permissões efetivas (achatadas de
  `roles→permissions`, dedup) cruzam a borda. Decisão: estender o **`/me`** (não inchar o JWT — token
  enxuto, permissões refletem o estado atual sem reemitir). **Degradação graciosa simétrica**: id
  inválido/usuário inexistente ou inativo/falha de leitura → `permissions: []` (o `/me` nunca quebra),
  casando com o `can() = []` que o front já implementou. **Ação no front**: o `can()` (T011) passa a ler
  `me.permissions` (campo aditivo, retrocompatível) em vez do `[]` fixo — a extensão do `MeSchema`/
  `AuthUser`/`CurrentUser` continua sendo trabalho do front (feature-modelo protegida), mas agora com fonte
  real. ⚠️ O **JWT segue com payload mínimo** (`sub=userId`) por design — as permissões vêm do `/me`, não do token.
