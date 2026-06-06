# Relatório de Prontidão da API (core-api): Gestão de Parceiros

**Feature**: `specs/008-partners/` · **Emissor**: Arquitetura Frontend v2 · **Destinatário**: Time core-api
**Data**: 2026-06-06 (revisado após implementação dos gaps) · **Base**: leitura do `../core-api` (módulo `partners`, ADR-0031/0033)

> Como o browser nunca fala com o core-api direto (Princ. I), toda capacidade depende de um endpoint atrás
> da server function. **Revisão 2 (2026-06-06)**: os 5 gaps reportados foram **implementados**, o bloqueio de
> **RBAC (FR-020) foi resolvido** (`/me` expõe `permissions[]`), e foi adicionado um novo tipo de parceiro
> **ACT** (placeholder provisório). As 2 pendências de produto (filtros programa/idade, financiador PF) foram
> **decididas** (descartar / PJ-only). Praticamente toda a superfície integra de verdade — nada mais em mock.

## 1. Resumo Executivo

O módulo `partners` está montado sob **`/api/v1`** (não `/api/v2`). O time **fechou 5 gaps**: import de
colaboradores, export de fornecedores, catálogo de categorias, e **parceria territorial completa** (estados
e municípios com tabela `par_states`/`par_municipalities`, flag `isPartner` e toggles idempotentes
`POST/DELETE` que **retornam o DTO** confirmando o estado). **O frontend deixa de mockar essas 5 superfícies**
e integra real via BFF. Além disso: **RBAC resolvido** — `GET /api/v2/auth/me` agora entrega
`permissions[]` para o `can()` (FR-020); e foi criado o tipo **ACT** (`/api/v1/acts`, placeholder enxuto
espelhando o Colaborador — regras de produto pendentes, ADR-0036). Pendências de produto **decididas**:
filtros `programa`/`idade` descartados (FR-012; idade derivável de `dateOfBirth` no client) e **financiador
PJ-only** (sem variante PF). Atenção de integração: o import espera **CSV cru `text/csv`** (não multipart) —
a server function do BFF converte o upload do browser em texto. Contrato ao vivo: `GET /docs/json` (OpenAPI).

## 2. Matriz de Prontidão (atualizada)

| Sub-domínio / Capacidade                  | Endpoint (`/api/v1`)                                                                        | Existe?              | RBAC                                              | Veredito          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------- | ----------------- |
| Colaboradores — CRUD + desativar/reativar | `GET/POST/PUT /collaborators`, `/:id`, `/:id/{complete-registration,deactivate,reactivate}` | ✅                   | `collaborator:read/write` (+`edit-sensitive` CPF) | 🟢                |
| Colaboradores — **import lote**           | `POST /collaborators/import` (`text/csv` raw, ~2 MiB)                                       | ✅                   | `collaborator:write`                              | 🟢                |
| Colaboradores — filtros programa/idade    | —                                                                                           | ❌ won't-do (FR-012) | —                                                 | ⚪ fora de escopo |
| Fornecedores — CRUD                       | `GET/POST/PUT /suppliers`, `/:id`, deactivate/reactivate                                    | ✅                   | `supplier:read/write`                             | 🟢                |
| Fornecedores — **export**                 | `GET /suppliers/export` (text/csv)                                                          | ✅                   | `supplier:read`                                   | 🟢                |
| Fornecedores — **catálogo categorias**    | `GET /suppliers/service-categories` (39)                                                    | ✅                   | `supplier:read`                                   | 🟢                |
| Financiadores — CRUD                      | `GET/POST/PUT /financiers`, `/:id`, deactivate/reactivate                                   | ✅                   | `financier:read/write`                            | 🟢                |
| Financiador — variante PF                 | —                                                                                           | ❌ PJ-only           | —                                                 | ⚪ fora de escopo |
| **Estados parceiros**                     | `GET /partner-states` · `POST/DELETE /partner-states/:uf`                                   | ✅                   | `geography:read/write`                            | 🟢                |
| **Municípios parceiros**                  | `GET /partner-municipalities?uf=XX` · `POST/DELETE /partner-municipalities/:ibgeCode`       | ✅                   | `geography:read/write`                            | 🟢                |
| **ACT** (novo tipo de parceiro)           | `GET/POST/PUT /acts`, `/:id`, `/:id/{deactivate,reactivate}`                                | ✅                   | `act:read/write`                                  | 🟡 placeholder    |
| **RBAC — permissões na UI**               | `GET /api/v2/auth/me` → `{ userId, permissions[] }`                                         | ✅                   | (sessão)                                          | 🟢                |

## 3. Detalhe por Sub-domínio

### Colaboradores — 🟢 PRONTO

- **Endpoints**: `adapters/http/plugin.ts`. CRUD + complete-registration + deactivate/reactivate + **import**.
- **Import** (`plugin.ts:268-306`): `POST /collaborators/import`, **`Content-Type: text/csv`** (raw string, `addContentTypeParser`, bodyLimit ~2 MiB) — **não multipart**. Colunas: `name, email, cpf, occupationArea, role, startOfContract, employmentRelationship`. Resposta sempre `200 { created, failed: [{ line, error }] }` (import parcial). CSV malformado → `400 collaborator-import-malformed`.
- **Filtros suportados** (`collaboratorListQuerySchema`): `search, active, status, occupationAreas, employmentRelationships, genderIdentities, breeds, educations, disableBy, roles, yearOfContract, page, limit, order`.
- **Fora de escopo (won't-do, FR-012)**: `programa` (não é conceito do BC do colaborador) e `idade` (derivável de `dateOfBirth` no client; chaves desconhecidas são `strip`).

### Fornecedores — 🟢 PRONTO

- **CRUD**: `supplier-plugin.ts`. **Export**: `GET /suppliers/export` (query `search?, active?(0|1), categories?[]`; `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="suppliers.csv"`, `nosniff`, escape anti-fórmula; sem paginação).
- **Catálogo**: `GET /suppliers/service-categories` → `string[]` (39 códigos canônicos; `serviceCategory` virou **union fechada** no domínio, `service-category.ts`, com typos legados preservados `ONGANIZACAO_DE_EVENTOS`, `TRASPORTE`). **Nuance**: na borda HTTP ainda é `z.string()` validado pelo domínio (inválido → `422 invalid-service-category`), não `z.enum`.

### Financiadores — 🟢 PRONTO (PJ-only)

- CRUD completo (`financier-plugin.ts`). Contrato exige `corporateName`, `legalRepresentative`, `cnpj(14)`. **Sem variante PF**.

### Estados parceiros — 🟢 PRONTO (novo)

- Tabela `par_states` (`schemas/mysql.ts:229-250`: PK `uf varchar(2)`, `active`, `deactivatedAt`, soft-delete). Plugin `partner-geography-plugin.ts` (registrado em `server.ts:122-126`).
- `GET /partner-states` → `[{ uf, isPartner }]` (27 UFs). `POST /partner-states/:uf` ativa (idempotente). `DELETE /partner-states/:uf` desativa. **O toggle retorna o DTO** `{ uf, isPartner }` (200) confirmando o estado — usar para atualização otimista, sem refetch obrigatório. UF fora do catálogo → `400 invalid-state` (envelope `{ error: { code, message, requestId } }`).

### Municípios parceiros — 🟢 PRONTO (novo)

- Tabela `par_municipalities` (`schemas/mysql.ts:256-279`: PK **`ibge_code varchar(7)`**, `uf`, soft-delete).
- `GET /partner-municipalities?uf=XX` → `[{ ibgeCode, uf, name, isPartner }]` (query `uf` **obrigatória**). `POST/DELETE /partner-municipalities/:ibgeCode` (idempotente); **o toggle retorna o DTO** `{ ibgeCode, uf, name, isPartner }` (200, `name` resolvido do catálogo). Código fora do catálogo → `400 invalid-ibge-code`.
- ⚠️ **Identidade por `ibgeCode`** (não por nome) — o Model do client precisa carregar `ibgeCode`.

### ACT — 🟡 PLACEHOLDER (novo, provisório — ADR-0036 do core-api)

- Novo tipo de parceiro pedido pelo produto com **regras ainda não definidas**. O core-api criou um
  **placeholder enxuto espelhando o núcleo do Colaborador** (PF): `POST /api/v1/acts` (201+Location),
  `GET /acts`, `GET /acts/:id`, `PUT /acts/:id`, `POST /acts/:id/{deactivate,reactivate}`. Campos = os 7 do
  pré-cadastro do colaborador (`name, email, cpf, occupationArea, role, startOfContract, employmentRelationship`)
  - status duplo + soft-delete. RBAC `act:read/write`.
- ⚠️ **Provisório**: import, complete-registration de 27 campos, filtros avançados e eventos **NÃO** existem
  (fora do escopo até as regras reais). O shape **vai mudar** quando o produto definir o ACT — não acoplar
  além do necessário. O front pode clonar a UI do Colaborador (núcleo) apontando para `/api/v1/acts`, **sem mock**.
- **Pendência de produto**: o significado da sigla **ACT** ainda não foi informado (identificador técnico `act`).

## 4. Estratégia de Integração (atualizada)

| Sub-domínio   | Fase 1 (agora)                      | Observação                                                      |
| ------------- | ----------------------------------- | --------------------------------------------------------------- |
| Financiadores | **real**                            | PJ-only                                                         |
| Fornecedores  | **real** (CRUD + export + catálogo) | categoria validada no domínio                                   |
| Colaboradores | **real** (CRUD + import)            | import: BFF converte multipart→`text/csv`                       |
| Estados       | **real**                            | toggle idempotente por UF                                       |
| Municípios    | **real**                            | toggle idempotente por `ibgeCode`; `uf` obrigatório na listagem |

> O mock deixa de ser necessário para os 5 sub-domínios. ADR-0001 (mock progressivo) permanece válido como
> **princípio de design** (ponto de troca no gateway), mas a Fase 1 já integra real em toda a superfície
> implementada. Restam apenas: idade derivada no client e financiador-PF (não suportado).

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
