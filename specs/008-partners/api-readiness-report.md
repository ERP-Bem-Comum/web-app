# Relatório de Prontidão da API (core-api): Gestão de Parceiros

**Feature**: `specs/008-partners/` · **Emissor**: Arquitetura Frontend v2 · **Destinatário**: Time core-api
**Data**: 2026-06-06 (revisado após implementação dos gaps) · **Base**: leitura do `../core-api` (módulo `partners`, ADR-0031/0033)

> Como o browser nunca fala com o core-api direto (Princ. I), toda capacidade depende de um endpoint atrás
> da server function. **Revisão**: 5 dos 7 gaps reportados na 1ª varredura foram **implementados** pelo time.
> Agora quase tudo integra de verdade; só restam 2 itens fora de escopo (não-mock): filtros programa/idade e
> financiador PF.

## 1. Resumo Executivo

O módulo `partners` está montado sob **`/api/v1`** (não `/api/v2`). O time **fechou 5 gaps**: import de
colaboradores, export de fornecedores, catálogo de categorias, e **parceria territorial completa** (estados
e municípios com tabela `par_states`/`par_municipalities`, flag `isPartner` e toggles idempotentes
`POST/DELETE`). **O frontend deixa de mockar essas 5 superfícies** e integra real via BFF. Restam fora:
filtros `programa`/`idade` de colaborador (descartados por decisão de escopo do backend — FR-012; idade é
derivável de `dateOfBirth` no client) e **financiador pessoa física** (API segue PJ-only). Atenção de
integração: o import espera **CSV cru `text/csv`** (não multipart) — a server function do BFF converte o
upload do browser em texto. Contrato ao vivo: `GET /docs/json` (OpenAPI).

## 2. Matriz de Prontidão (atualizada)

| Sub-domínio / Capacidade | Endpoint (`/api/v1`) | Existe? | RBAC | Veredito |
|---|---|---|---|---|
| Colaboradores — CRUD + desativar/reativar | `GET/POST/PUT /collaborators`, `/:id`, `/:id/{complete-registration,deactivate,reactivate}` | ✅ | `collaborator:read/write` (+`edit-sensitive` CPF) | 🟢 |
| Colaboradores — **import lote** | `POST /collaborators/import` (`text/csv` raw, ~2 MiB) | ✅ | `collaborator:write` | 🟢 |
| Colaboradores — filtros programa/idade | — | ❌ won't-do (FR-012) | — | ⚪ fora de escopo |
| Fornecedores — CRUD | `GET/POST/PUT /suppliers`, `/:id`, deactivate/reactivate | ✅ | `supplier:read/write` | 🟢 |
| Fornecedores — **export** | `GET /suppliers/export` (text/csv) | ✅ | `supplier:read` | 🟢 |
| Fornecedores — **catálogo categorias** | `GET /suppliers/service-categories` (39) | ✅ | `supplier:read` | 🟢 |
| Financiadores — CRUD | `GET/POST/PUT /financiers`, `/:id`, deactivate/reactivate | ✅ | `financier:read/write` | 🟢 |
| Financiador — variante PF | — | ❌ PJ-only | — | ⚪ fora de escopo |
| **Estados parceiros** | `GET /partner-states` · `POST/DELETE /partner-states/:uf` | ✅ | `geography:read/write` | 🟢 |
| **Municípios parceiros** | `GET /partner-municipalities?uf=XX` · `POST/DELETE /partner-municipalities/:ibgeCode` | ✅ | `geography:read/write` | 🟢 |

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
- `GET /partner-states` → `[{ uf, isPartner }]` (27 UFs). `POST /partner-states/:uf` ativa (idempotente, `200`). `DELETE /partner-states/:uf` desativa. UF fora do catálogo → `400 invalid-state`.

### Municípios parceiros — 🟢 PRONTO (novo)

- Tabela `par_municipalities` (`schemas/mysql.ts:256-279`: PK **`ibge_code varchar(7)`**, `uf`, soft-delete).
- `GET /partner-municipalities?uf=XX` → `[{ ibgeCode, uf, name, isPartner }]` (query `uf` **obrigatória**). `POST/DELETE /partner-municipalities/:ibgeCode` (idempotente). Código fora do catálogo → `400 invalid-ibge-code`.
- ⚠️ **Identidade por `ibgeCode`** (não por nome) — o Model do client precisa carregar `ibgeCode`.

## 4. Estratégia de Integração (atualizada)

| Sub-domínio | Fase 1 (agora) | Observação |
|---|---|---|
| Financiadores | **real** | PJ-only |
| Fornecedores | **real** (CRUD + export + catálogo) | categoria validada no domínio |
| Colaboradores | **real** (CRUD + import) | import: BFF converte multipart→`text/csv` |
| Estados | **real** | toggle idempotente por UF |
| Municípios | **real** | toggle idempotente por `ibgeCode`; `uf` obrigatório na listagem |

> O mock deixa de ser necessário para os 5 sub-domínios. ADR-0001 (mock progressivo) permanece válido como
> **princípio de design** (ponto de troca no gateway), mas a Fase 1 já integra real em toda a superfície
> implementada. Restam apenas: idade derivada no client e financiador-PF (não suportado).

## 5. Pendências remanescentes (não-mock)

- **Financiador PF**: API é PJ-only. Decisão de produto: manter PJ-only no front (recomendado) ou aguardar backend? → clarify.
- **Filtros programa/idade**: backend descartou (FR-012). Front: derivar idade de `dateOfBirth` (client-side) e remover "programa" da UI de filtros. → clarify.
- **Detalhe de borda**: import multipart→`text/csv` é responsabilidade da server function do BFF.
