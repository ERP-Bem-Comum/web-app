# Contrato de API esperado pelo Front (v1)

> Escopo: **tudo que NÃO é `auth`, `financeiro` nem `contratos`.**
> Fonte: `src/services/*.ts` + tipos em `src/types`, `src/validators`, `src/enums`.
> Estes módulos **não têm OpenAPI** (só auth/contratos/financeiro têm em `handbook/`) —
> o front é a única fonte de verdade.
>
> **Recorte do "financeiro" excluído** (route group `(financeiro)`): contas a pagar
> (`/payables`), contas a receber (`/receivables`), cartão (`/cards`, `/card-movimentations`),
> contas bancárias (`/accounts`), conciliação (`/bank-reconciliation`), CNAB (`/payables/export`),
> saldo Bradesco (`/apiBradesco/*`). **Contratos** = `/contracts/*`, `/files/contracts/*`. **Auth** = `/auth/*`.

---

## 0. Convenções transversais (valem para TODOS os endpoints abaixo)

### 0.1 Base URL e autenticação
- Base URL: `NEXT_PUBLIC_API_URL` (default dev: `http://localhost:4010`).
- Auth padrão: header `Authorization: Bearer <jwt>` (token vem da sessão do usuário).
- Endpoints **`/options`** podem usar Bearer **ou** Basic Auth (cliente `apiOptions`), com fallback
  para mock local se o backend responder erro.
- Endpoints **`/shared`** (compartilhamento externo) usam **Basic Auth**:
  `Authorization: Basic base64(shareUsername:sharePassword)` — credenciais vêm de cookies
  (`shareUsername`, `sharePassword`) preenchidos após `POST /share-budget-plans/check-credentials`.

### 0.2 Envelope de resposta — IMPORTANTE
O front faz `return response.data` (axios). Ou seja **o corpo HTTP é o payload direto**, sem wrapper.
O objeto `{ status, data, error, meta }` (`Response<T>` em `src/types/global.ts`) só aparece como
**objeto de erro montado no `.catch` do front** — o backend **não** precisa devolvê-lo no sucesso.

- **Recurso único** → o objeto direto. Ex.: `GET /programs/:id` → `IProgram`.
- **Listagem paginada** → **`{ items: T[], meta: IPaginationMeta }`** (confirmado: 47 usos de `.items`
  no front contra 5 de `.itens`, e estes 5 são estrutura interna de relatórios, não o envelope).
- **Erro** → `{ message: string }` com o status HTTP adequado (400/401/403/500). Em 401 com
  `{ message: "Unauthorized" }` o front faz logout automático.

```ts
type IPaginationMeta = {
  itemCount: number      // itens na página atual
  totalItems: number     // total na base
  itemsPerPage: number   // = limit
  totalPages: number
  currentPage: number    // 1-indexed
}
```

### 0.3 Query de listagem (base comum — `PaginateParams`)
```ts
{
  page: number            // 1-indexed
  limit: number
  search?: string | null
  active?: number | null  // 0 = inativo, 1 = ativo
  order?: 'ASC' | 'DESC'
}
```

### 0.4 Options (dropdowns)
Endpoints `GET /<recurso>/options` retornam **array** de:
```ts
type Options = { id: number | string; parentId?: number; name: string }
```

### 0.5 Upload e download
- Uploads (`programs`, `users`, `files`) usam **`multipart/form-data`** (nunca JSON).
- Exports **CSV/PDF** retornam **blob binário** (`responseType: 'blob'`); nome no
  `Content-Disposition: attachment; filename="..."`. As query de export = as da listagem correspondente.

### 0.6 Tipos de pagamento reusados (fornecedor/contrato)
```ts
type PixInfo     = { key_type: string | null; key: string | null } // key_type: CPF|CNPJ|EMAIL|PHONE
type BancaryInfo = { bank: string | null; agency: string | null; accountNumber: string | null; dv: string | null }
```

---

## 1. Gestão de Parceiros

### 1.1 Colaboradores — `/collaborators`
Entidade:
```ts
type Collaborator = {
  id: number
  name: string
  email: string
  cpf: string
  occupationArea: string
  role: string
  startOfContract: string        // ISO date
  employmentRelationship: 'PJ' | 'CLT' | 'Autônomo' | 'Estagiário' | 'Outros'
  rg?: string
  completeAddress?: string
  dateOfBirth?: string
  telephone?: string
  emergencyContactName?: string
  emergencyContactTelephone?: string
  genderIdentity?: GenderIdentity
  race?: string
  allergies?: string
  foodCategory?: string
  education?: string
  experienceInThePublicSector?: boolean
  biography?: string
  active?: boolean
  status?: 'CADASTRO_COMPLETO' | 'CADASTRO_INCOMPLETO' | 'OUTROS'
  contracts?: Contract[]
}
// GenderIdentity: PREFIRO_NAO_RESPONDER | HOMEM_CIS | HOMEM_TRANS | MULHER_CIS | MULHER_TRANS | TRAVESTI | NAO_BINARIO | OUTRO
```

| Método | Rota | Notas |
|---|---|---|
| GET | `/collaborators` | Listagem. Query: base + filtros multivalor (ver abaixo) |
| GET | `/collaborators/:id` | Colaborador completo |
| POST | `/collaborators` | Body de criação (abaixo) |
| PUT | `/collaborators/:id` | Mesmo body de criação |
| PATCH | `/collaborators/:id/toggle-active` | Body: `{ disableBy: string \| null }` |
| GET | `/collaborators/:id/check-first-three-numbers-cpf/:cpf` | Valida CPF; → `{ valid: boolean }` |
| POST | `/collaborators/:id/complete-registration` | Completa cadastro (mesmo body) |
| GET | `/collaborators/nameOrCPF` | Query `{ nameOrCPF: string; payableOrReceivableId?: number }` → 1 colaborador |
| GET | `/collaborators/options` | Options |
| GET | `/collaborators/csv` | Blob CSV (query = listagem) |
| GET | `/collaborators/timeline/csv` | Blob CSV |

Query de listagem (além da base): `age?`, `yearOfContract?`, `genderIdentities?: string[]`,
`breeds?: string[]`, `educations?: string[]`, `status?: string[]`, `occupationAreas?: string[]`,
`employmentRelationships?: string[]`, `roles: string[]`, `disableBy: string[]`.

Body criação/edição:
```ts
{
  name: string                              // obrigatório
  email: string                             // obrigatório
  cpf: string                               // obrigatório
  occupationArea: string | null
  role: string | null
  startOfContract: string | null            // ISO
  employmentRelationship: string | null
}
```

### 1.2 Financiadores — `/financiers`
```ts
type Financier = {
  id: number; name: string; corporateName: string; cnpj: string
  telephone: string; legalRepresentative: string; address: string
  active: boolean; contracts: ContractForAccounts[]
}
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/financiers` | Listagem. Query: `page, limit, search?` |
| GET | `/financiers/:id` | |
| POST | `/financiers` | Body: `{ name, corporateName, cnpj, telephone, legalRepresentative, address }` (todos obrigatórios) |
| PUT | `/financiers/:id` | Mesmo body |
| PATCH | `/financiers/:id/toggle-active` | |
| GET | `/financiers/nameOrCNPJ` | Query `{ nameOrCNPJ: string }` → 1 financiador |
| GET | `/financiers/options` | Options |
| GET | `/financiers/csv` | Blob CSV |

### 1.3 Fornecedores — `/suppliers`
```ts
type Supplier = {
  id: number; name: string; email: string; telephone?: string
  cnpj: string; corporateName: string; fantasyName: string
  serviceCategory: string; serviceEvaluation: number; commentEvaluation: string
  active: boolean
  bancaryInfo?: BancaryInfo
  pixInfo?: PixInfo
  contracts?: ContractForAccounts[]
}
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/suppliers` | Listagem. Query: base + `categories?: string[]` |
| GET | `/suppliers/:id` | |
| POST | `/suppliers` | Body dados cadastrais (abaixo) |
| PUT | `/suppliers/:id` | **Dois shapes**: (A) dados cadastrais OU (B) dados de pagamento (abaixo) |
| PATCH | `/suppliers/:id/toggle-active` | |
| GET | `/suppliers/nameOrCNPJ` | Query `{ nameOrCNPJ: string; payableOrReceivableId?: number }` |
| GET | `/suppliers/options` | Options |
| GET | `/suppliers/csv` | Blob CSV |

```ts
// POST / PUT(A) — cadastro
{ name, email, cnpj, corporateName, fantasyName, serviceCategory,
  serviceEvaluation?: number | null, commentEvaluation?: string | null }
// PUT(B) — info de pagamento (OU bancário OU pix; não ambos vazios)
{ bancaryInfo?: BancaryInfo; pixInfo?: PixInfo; updatedBy?: number }
```

### 1.4 Estados — `/partner-states`
```ts
type PartnerState = { id: number; name: string; abbreviation: string } // abbreviation: "SP","RJ"...
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/partner-states` | Lista (array simples, sem paginação) |
| GET | `/partner-states/:id` | |
| POST | `/partner-states` | Body: `{ abbreviation: string; name?: string }` |
| DELETE | `/partner-states/:id` | |
| GET | `/partner-states/options` | Options |
| GET | `/partner-states/all/shared` | Versão compartilhada (Basic Auth) |

### 1.5 Municípios — `/partner-municipalities`
```ts
type PartnerMunicipality = { id: number; name: string; uf: string; cod: string } // cod = IBGE
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/partner-municipalities` | Listagem. Query: base + `uf?: string` |
| GET | `/partner-municipalities/:id` | |
| POST | `/partner-municipalities` | Body: `{ name, uf, cod }` |
| DELETE | `/partner-municipalities/:id` | |
| GET | `/partner-municipalities/options` | Options |
| GET | `/partner-municipalities/all/shared` | Versão compartilhada |

---

## 2. Gestão de Programa — `/programs`
```ts
type IProgram = {
  id: number; name: string; abbreviation: string
  director: string; description: string; logo: string; active: boolean
}
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/programs` | Listagem. Query: `page, limit, search?, active?` |
| GET | `/programs/:id` | |
| POST | `/programs` | **multipart/form-data**: `{ name?, abbreviation, director, description, file? }` |
| PUT | `/programs/:id` | multipart (mesmo body) |
| PATCH | `/programs/:id/toggle-active` | |
| GET | `/programs/options` | Options |

---

## 3. Gestão de Usuário — `/users`
```ts
type User = {
  id: number; name: string; email: string; cpf: string
  telephone: string; imageUrl: string; token: string
  active?: boolean; massApprovalPermission?: boolean; collaboratorId?: number
}
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/users` | Listagem. Query: `page, limit, search?, active?` |
| GET | `/users/:id` | |
| POST | `/users` | **multipart**: `{ name?, email?, cpf?, telephone?, file?, massApprovalPermission? }` |
| PUT | `/users/:id` | multipart (mesmo body) |
| PATCH | `/users/:id/toggle-active` | |
| PATCH | `/users/change-password` | Body: `{ password: string; currentPassword: string }` |

> Verificar no service `user.ts` se a rota base é `/users` ou `/user` antes de fixar.

---

## 4. Plano Orçamentário

### 4.1 Budget Plans — `/budget-plans`
Status: `BudgetPlanStatus = 'APROVADO' | 'EM_CALIBRACAO' | 'RASCUNHO'`.

| Método | Rota | Notas |
|---|---|---|
| GET | `/budget-plans` | Listagem. Query: base + `year?, programId?, status?`. Itens trazem `children[]` (hierarquia de versões/cenários) |
| GET | `/budget-plans/:id` | → `{ budgetPlan }` com `costCenters[]`, `budgets[]`, `parent?`, `children[]` |
| POST | `/budget-plans` | Body: `{ year: number; programId: number \| null; yearForImport?: number \| null }` |
| PUT | `/budget-plans/:id` | Mesmo body |
| PATCH | `/budget-plans/:id/toggle-active` | |
| PATCH | `/budget-plans/:id/approve` | → status `APROVADO` |
| POST | `/budget-plans/:id/start-calibration` | → status `EM_CALIBRACAO` |
| POST | `/budget-plans/scenery` | Body: `{ name: string; budgetPlanId: number }` (novo cenário) |
| DELETE | `/budget-plans/:id` | |
| GET | `/budget-plans/options` | Options |
| GET | `/budget-plans/:id/insights` | → `{ data: Insight[]; medInCentsTheLastFiveYears }` |
| GET | `/budget-plans/csv` | Blob (query = listagem) |
| GET | `/budget-plans/:id/generate-csv` | Blob de 1 plano |
| GET | `/budget-plans/consolidated-result` | Query: `year` (obrig.), `programId?`, `status?` |
| GET | `/budget-plans/consolidated-result/csv` | Blob |

Item da listagem (resumido):
```ts
{
  id: number; year: number; version: number; scenarioName?: string
  status: BudgetPlanStatus; totalInCents: number
  program: { name: string }
  countPartnerMunicipalities: number; countPartnerStates: number
  updatedAt: string; updatedBy: { name: string }
  children: <mesma estrutura>[]
}
```
Insight:
```ts
{ id: number; year: number; totalInCents: number; differenceValueInPercentage: number
  countPartnerMunicipalities: number; countPartnerStates: number
  medInCentsForPartners: number; type: string }
```
Consolidated result:
```ts
{ data: { costCenters: { id; name; valueInCents
    categories: { id; name; valueInCents
      months: { month: 1..12; valueInCents }[] }[] }[] } }
```

### 4.2 Budgets — `/budgets`
```ts
type Budget = {
  id: number; name: string; email: string; cnpj: string
  corporateName: string; fantasyName: string; serviceCategory: string
  serviceEvaluation: number; commentEvaluation: string; active: boolean
}
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/budgets` | Listagem. Query: `page` + `budgetPlanId?, partnerStateId?, partnerMunicipalityId?, isForMonth?` |
| GET | `/budgets/:id` | |
| POST | `/budgets` | Body: `{ budgetPlanId: number \| null; partnerStateId?; partnerMunicipalityId? }` |
| PUT | `/budgets/:id` | Mesmo body |
| PATCH | `/budgets/:id/toggle-active` | |
| DELETE | `/budgets/:id` | |
| POST | `/budgets/results` | Salva valores (abaixo) |
| GET | `/budgets/csv` | Blob |

```ts
// POST /budgets/results
{ budgetId: number | null
  budgetResults: { id: number | null; costCenterSubCategoryId: number | null
                   month: number | null; valueInCents: number | null }[] }
```

### 4.3 Memória de cálculo — `/budget-results`
4 tipos de lançamento (definido por `releaseType` da subcategoria):
`IPCA | CAED | DESPESAS_PESSOAIS | DESPESAS_LOGISTICAS`.

| Método | Rota | Body raiz |
|---|---|---|
| POST | `/budget-results/ipca` | `{ budgetId, costCenterSubCategoryId, months: IpcaMonth[] }` |
| POST | `/budget-results/caed` | `{ budgetId, costCenterSubCategoryId, months: CaedMonth[] }` |
| POST | `/budget-results/personal-expenses` | `{ budgetId, costCenterSubCategoryId, months: PersonalMonth[] }` |
| POST | `/budget-results/logistics-expenses` | `{ budgetId, costCenterSubCategoryId, months: LogisticsMonth[] }` |
| DELETE | `/budget-results/:id` | |
| GET | `/budget-results/all-last-year/:budgetId/:subCategoryId` | histórico ano anterior |
| GET | `/budget-results/logistics-expenses/:budgetId/:categoryId` | |

```ts
type IpcaMonth = { month: 1..12; baseValueInCents: number; ipca: number; justification: string | null }
type CaedMonth = { month: number; baseValueInCents: number; numberOfEnrollments: number }
type PersonalMonth = { month: number; education: string; employmentRelationship: 'CLT'|'PJ'
  numberOfFinancialDirectors: number; salaryInCents: number; salaryAdjustment: number
  inssEmployer: number; inss: number; fgtsCharges: number; pisCharges: number
  transportationVouchersInCents: number; foodVoucherInCents: number; healthInsuranceInCents: number
  lifeInsuranceInCents: number; holidaysAndChargesInCents: number; allowanceInCents: number
  thirteenthInCents: number; fgtsInCents: number }
type LogisticsMonth = { month: number; accommodationInCents: number; foodInCents: number
  transportInCents: number; carAndFuelInCents: number; airfareInCents: number; numberOfPeople: number
  dailyAccommodation: number; dailyFood: number; dailyTransport: number; dailyCarAndFuel: number
  totalTrips: number }
```

### 4.4 Centros de custo — `/cost-centers` (+ categorias + subcategorias)
```ts
type CostCenter = { id; name; budgetPlanId; type: string; active?: boolean; categories: Category[] }
type Category   = { id; name; costCenterId; active: boolean; subCategories: SubCategory[] }
type SubCategory = { id; name; costCenterCategoryId
  type: 'REDE' | 'INSTITUCIONAL'
  releaseType: 'IPCA' | 'CAED' | 'DESPESAS_PESSOAIS' | 'DESPESAS_LOGISTICAS' }
```
| Método | Rota | Notas |
|---|---|---|
| GET | `/cost-centers/all-by-budget-plan/:id` | Árvore completa do plano |
| GET | `/cost-centers/all-active-by-budget-plan/:id` | Só ativos |
| GET | `/cost-centers/options` | Options |
| POST | `cost-centers` | Body: `{ name, type, budgetPlanId }` |
| PUT | `cost-centers/:id` | Body: `{ name, type, budgetPlanId, active? }` |
| PATCH | `/cost-centers/:id/toggle-active` | |
| DELETE | `/cost-centers/:id` | |
| GET | `/cost-centers/categories/options` | Options |
| POST | `cost-centers/categories` | Body: `{ name, costCenterId }` |
| PUT | `cost-centers/categories/:id` | Body: `{ name, costCenterId, active? }` |
| PATCH | `/cost-centers/categories/:id/toggle-active` | |
| DELETE | `/cost-centers/categories/:id` | |
| GET | `/cost-centers/categories/sub/options` | Options |
| POST | `/cost-centers/categories/sub` | Body: `{ name, type, releaseType, costCenterCategoryId }` |
| PUT | `/cost-centers/categories/sub/:id` | Mesmo body |
| PATCH | `/cost-centers/categories/sub/:id/toggle-active` | |
| DELETE | `/cost-centers/categories/sub/:id` | |

> ⚠️ POST/PUT de cost-centers (raiz e categorias) são chamados **sem `/` inicial** no front
> (`cost-centers`, `cost-centers/categories`, `cost-centers/categories/${id}`). Trate como relativo à base.

### 4.5 Compartilhamento de plano — `/share-budget-plans`
| Método | Rota | Body |
|---|---|---|
| POST | `/share-budget-plans` | `{ budgetPlanId: number; emails: string[] }` |
| POST | `/share-budget-plans/consolidated-result` | `{ budgetPlanIds: number[]; emails: string[] }` |
| POST | `/share-budget-plans/check-credentials` | `{ budgetPlanId: number; password: string }` (sem auth; valida senha do link) |

### 4.6 Endpoints `/shared` (acesso externo, Basic Auth)
Espelham os internos para o visitante externo:
`GET /budget-plans/:id/shared`, `GET /budget-plans/:id/insights/shared`,
`GET /budget-plans/consolidated-result/shared`, `GET /budget-plans/:id/generate-csv/shared` (query `id`,`email`),
`GET /budget-plans/consolidated-result/csv/shared` (query `email`),
`GET /cost-centers/all-by-budget-plan/:id/shared`, `GET /budgets/all/shared`,
`GET /partner-states/all/shared`, `GET /partner-municipalities/all/shared`.

---

## 5. Relatórios — `/reports`

> Filtros são **achatados** (`flattenParams`) antes do envio: `dueBetween:{start,end}` vira
> `dueBetween.start` / `dueBetween.end` (datas em ISO); `null`/`undefined` são removidos; arrays mantidos.

Filtro base (flattened como query):
```ts
// paginationParams
page, limit, search?, active?, order?
// reportsParams
budgetPlanId?, dueBetween.start?, dueBetween.end?, accountId?, costCenterId?,
categoryId?, subCategoryId?, status?, entityId?, programId?, reportType?  // reportType: 'RECEIVABLE'|'PAYABLE'
// status (MergedStatusForReportFilter):
// 'EM APROVAÇÃO' | 'REJEITADO' | 'PAGO' | 'PENDENTE' | 'APROVADO' | 'RECEBIDO' | 'ATRASADO' | 'CONCLUIDO'
```

| Método | Rota | Resposta (resumo) |
|---|---|---|
| GET | `/reports/cashflow` | `{ Receivables: Row[], Payables: Row[] }` — Row: `{Category_id,Category_name,SubCategory_id,SubCategory_name,REALIZED,EXPECTED}` |
| GET | `/reports/cashflow/chart` | `Row[]` + `Installments_dueDate` |
| GET | `/reports/position/payables` · `/reports/position/receivables` | árvore `itens[]` com `costCenter[].category[]` e totais `totalPendente/totalPago/totalAtrasado` |
| GET | `/reports/noContract` | `[{ id, name, total, budgetPlan: [{id,name,total}] }]` |
| GET | `/reports/analysis/payables` · `/reports/analysis/receivables` | `{ totalValueOfPeriod, data: [{id,name,total,itens:[{monthYear,total}],CostCenter:[...]}] }` |
| GET | `/reports/analysis/chart` | `[{ id, name, total }]` (sem query) |
| GET | `/reports/realized` | Query: `programId?, budgetPlanId?, partnerStateId?, partnerMunicipalityId?, year` → árvore expected/realized/provisioned por costCenter→category→subCategory→months |
| GET | `/reports/generalReport` | linhas planas (colunas configuráveis via `columns[]`) |
| GET | `/reports/team` | colaboradores (mesma query de `/collaborators`) → `{ items, meta }` |

Exports (todos blob): `/reports/cashflow/csv`, `/reports/pdf/cashflow`, `/reports/position/csv`,
`/reports/pdf/position`, `/reports/noContract/csv`, `/reports/pdf/nocontracts`, `/reports/analysis/csv`,
`/reports/pdf/analysis`, `/reports/realized/csv`, `/reports/pdf/realized`, `/reports/general/csv`,
`/reports/pdf/general`. (CSV/PDF de position/analysis levam `tipo`/`type`: `'p'|'r'`; realized leva `formatValues: boolean`.)

`realized` (shape):
```ts
{ totalExpected; totalRealized; totalProvisioned
  costCenters: { id; name; budgetPlanId; totalExpected; totalRealized; totalProvisioned
    categories: { id; name; totalExpected; totalRealized; totalProvisioned
      months: { month; expected; realized; provisioned }[]
      subCategories: { id; name; totalExpected; totalRealized; totalProvisioned
        months: { month; expected; realized; provisioned }[] }[] }[] }[] }
```

Colunas do relatório geral (`DISPONIBLE_COLUMNS`): `NUMERO_CONTRATO, TIPO, CODE, VENCIMENTO, PARCELA,
APONTAMENTO, FORNECEDOR, FINANCIADOR, COLABORADOR, CENTRO_CUSTO, CATEGORIA, SUB_CATEGORIA, PIX, BANCARY`.

---

## 6. Estatísticas (Dashboard) — `GET /statistics/dashboard`
Sem query. Resposta:
```ts
{
  totalExpenses: number; expensesVariation: string; expensesVariationSignal: '+' | '-'
  totalRevenue: number; revenueVariation: string; revenueVariationSignal: '+' | '-'
  nameTopFinancier: string; totalTopFinanciers: string; topFinanciersVariation: string; topFinanciersVariationSignal: '+' | '-'
  nameTopCostCenter: string; totalTopCostCentersExpenses: number; topCostCentersVariation: string; topCostCentersVariationExpensesSignal: '+' | '-'
  barChartCostCenterPayment: { name: string; percentage: number }[]
  noContractSuppliers: { id; name; total; budgetPlan: { id; name; total }[] }[]
  lastPayments: { name: string; dueDate: string; backAccount: string; value: number }[]
  chartRealized: { month: string; expected: number; realized: number }[]
}
```

---

## 7. Arquivos — `/files` (transversal)
| Método | Rota | Notas |
|---|---|---|
| GET | `/files` | Query `{ fileUrl: string }` → blob (download) |
| POST | `/files/:path` | multipart. `path ∈ {payable, receivable, contracts}`. Body: `{ files: File[], payableId?, receivableId?, contractId?, userId? }` |
| PUT | `/files/:path` | multipart (mesmo body) |

> `/files/payable` e `/files/receivable` pertencem ao financeiro; `/files/contracts*` aos contratos.
> Incluído aqui só porque o **service genérico** é compartilhado.

---

## 8. Resumo de enums de domínio (fora de financeiro/contratos)
```ts
BudgetPlanStatus      = 'APROVADO' | 'EM_CALIBRACAO' | 'RASCUNHO'
CostCenterSubType     = 'REDE' | 'INSTITUCIONAL'
ReleaseType           = 'IPCA' | 'CAED' | 'DESPESAS_PESSOAIS' | 'DESPESAS_LOGISTICAS'
EmploymentRelationship= 'PJ' | 'CLT' | 'Autônomo' | 'Estagiário' | 'Outros'
CollaboratorStatus    = 'CADASTRO_COMPLETO' | 'CADASTRO_INCOMPLETO' | 'OUTROS'
GenderIdentity        = 'PREFIRO_NAO_RESPONDER' | 'HOMEM_CIS' | 'HOMEM_TRANS' | 'MULHER_CIS' | 'MULHER_TRANS' | 'TRAVESTI' | 'NAO_BINARIO' | 'OUTRO'
AnalysisType          = 'Pagamento' | 'Recebimento'
ActionTypes (history) = 'INSERT' | 'UPDATE' | 'DELETE' | 'SIGN' | 'WITHDRAWAL' | 'SETTLE'
ReportStatus (merged) = 'EM APROVAÇÃO' | 'REJEITADO' | 'PAGO' | 'PENDENTE' | 'APROVADO' | 'RECEBIDO' | 'ATRASADO' | 'CONCLUIDO'
```

---

## 9. Pontos a confirmar no código antes de fixar
- **Rota base de usuários** (`/users` vs `/user`) — conferir `src/services/user.ts`.
- **Shape exato de retorno de POST/PUT** (alguns services só consomem `message`); para create,
  o ideal é devolver o recurso criado com `id`.
- **`/reports/team`**: status do colaborador e `employmentRelationship` aparecem com rótulos legíveis
  (`'Autônomo'`, `'Estagiário'`) — confirmar se backend persiste assim ou normaliza.
- **`cost-centers` sem barra inicial**: o front concatena `cost-centers` direto à base; garantir que
  o backend aceite tanto com quanto sem `/` (ou padronizar no front depois).
