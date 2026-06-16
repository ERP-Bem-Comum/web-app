# Data Model (front) — Contas a Pagar (Fase 1)

Tipos de I/O do **front** (espelham `core-api/specs/FIN-DOCUMENTO-INGESTAO` e o contrato real da Fatia 1). Money trafega como **string de centavos** na borda; no model do client é normalizado conforme o uso. Enums = união de literais (§VI). Tudo `Readonly` (§VII).

## Enums (uniões de literais)

```ts
type DocumentType = 'NFS-e' | 'DANFE' | 'RPA' | 'Fatura' | 'Boleto' | 'Recibo' | 'Imposto'
type PaymentMethod = 'TED' | 'TransferenciaBancaria' | 'PIX' | 'Boleto'
  | 'CartaoCorporativo' | 'Cambio' | 'GuiaRecolhimento' | 'Outro'
// Alvo (7); vivos na Fatia 1 = Rascunho|Aberto|Aprovado
type DocumentStatus = 'Rascunho' | 'Aberto' | 'Aprovado'
  | 'Transmitido' | 'Recusado' | 'Pago' | 'Conciliado'
type RetentionType = 'ISS' | 'IRRF' | 'INSS' | 'CSRF'      // gera filho + abate líquido
type RegisteredTaxType = 'ICMS' | 'IPI' | 'PIS' | 'COFINS' | 'CBS' | 'IBS_Municipal' | 'IBS_Estadual' // só registro
type PayableKind = 'Parent' | 'Child'
```

> **Geração de títulos** (regra do domínio, não decisão do front): NFS-e → 1 pai + até 4 filhos (ISS, IRRF, INSS, CSRF); RPA → 1 pai + 3 (IRRF, INSS, CSRF); demais → só pai. **CSRF agrega PIS+COFINS+CSLL**. O front **não cria títulos** — recebe-os em `payables[]`.

## Entradas (input das server fns — Zod na borda)

```ts
// Retenção / imposto (itens do form)
type RetentionInput = Readonly<{ type: RetentionType; baseCents: string; rateBps: number; valueCents: string }>
type RegisteredTaxInput = Readonly<{ type: RegisteredTaxType; baseCents: string; rateBps: number; valueCents: string }>

// Lançar Documento (POST /documents, asDraft:false)
type CreateDocumentInput = Readonly<{
  type: DocumentType
  documentNumber: string
  series?: string
  supplierRef: string                 // uuid
  contractRef?: string; budgetPlanRef?: string; categoryRef?: string; programRef?: string
  paymentMethod: PaymentMethod
  grossValueCents: string
  sourceDiscountsCents?: string; discountsCents?: string; penaltyCents?: string; interestCents?: string
  retentions: readonly RetentionInput[]
  registeredTaxes: readonly RegisteredTaxInput[]
  dueDate: string                     // YYYY-MM-DD (obrigatória p/ Open)
  description?: string
}>

type AdjustDocumentInput = Readonly<{ id: string; version: number; /* ≥1 de: */ grossValueCents?: string; sourceDiscountsCents?: string; discountsCents?: string; penaltyCents?: string; interestCents?: string; retentions?: readonly RetentionInput[]; dueDate?: string; description?: string | null }>
type ApproveInput = Readonly<{ id: string; version: number }>   // serve approve e undo-approval
type CancelInput = Readonly<{ id: string }>
type ListDocumentsInput = Readonly<{ status?: DocumentStatus; supplierRef?: string; type?: string; dueFrom?: string; dueTo?: string; page: number; pageSize: number }>
```

## Saídas (model que a UI consome — mappers API→model)

```ts
type Payable = Readonly<{ id: string; kind: PayableKind; retentionType: RetentionType | null; valueCents: string; status: DocumentStatus }>

type DocumentDetail = Readonly<{
  id: string
  status: DocumentStatus
  type: DocumentType | null
  documentNumber: string | null
  supplierRef: string | null
  paymentMethod: PaymentMethod | null
  grossValueCents: string | null
  netValueCents: string | null        // null em Rascunho
  dueDate: string | null              // YYYY-MM-DD
  description: string | null
  payables: readonly Payable[]        // vazio em Rascunho
}>

// Item da lista (DTO fino da Fatia 1 — será enriquecido por FIN-LIST-DTO)
type DocumentSummary = Readonly<{
  id: string; status: DocumentStatus; documentNumber: string | null
  type: DocumentType | null; supplierRef: string | null
  netValueCents: string | null; dueDate: string | null
}>
type DocumentListResponse = Readonly<{ items: readonly DocumentSummary[]; page: number; pageSize: number; total: number }>
```

## Erro do módulo (string-union → tag i18n)

```ts
type FinancialError =
  | 'not-found'            // document-not-found (404)
  | 'invalid-transition'  // invalid-state-transition (409)
  | 'net-value-invalid'   // net-value-not-positive (422)
  | 'retention-not-allowed' // retention-not-allowed-for-type (422)
  | 'document-incomplete' // document-incomplete (422)
  | 'validation'          // 400/422 genérico
  | 'unauthorized' | 'forbidden' | 'conflict' | 'connectivity' | 'server'
```

## Derivação pura — valor líquido (preview na UI)

```
Líquido = Bruto − DescontosNaFonte − Σ(Retenções) − Descontos + Multa + Juros   (deve ser > 0)
```
Impostos registrados **não** entram. Calculado em `document-form.view.ts` (puro) só para **preview**; o backend é a autoridade.

## Regra de agregação CSRF (form → input)

O **form coleta 6 retenções** (ISS, IRRF, INSS, **PIS, COFINS, CSLL**), mas o backend só aceita `RetentionType ∈ {ISS, IRRF, INSS, CSRF}`. Na borda (model→input), o front **agrega PIS + COFINS + CSLL num único `CSRF`**:

```
csrfValueCents = pisCents + cofinsCents + csllCents          // 65 + 300 + 100 → 465
retentions = [ ISS?, IRRF?, INSS?, (csrf>0 ? {type:'CSRF', valueCents: csrf, ...} : —) ]
```

O preview "Títulos Previstos" reflete isso: pai (líquido) + filhos ISS/IRRF/INSS/**CSRF**. (R8 do `domain.md`.)

## Categorização — herdada do contrato (read-only)

`categoria`, `programa`, `planoOrcamentario` e `centroCusto` **não são entrada livre**: vêm do **contrato vinculado** (`contractRef`) ao documento. No v1 são **exibidos read-only** (derivados do contrato). Dependências: o contrato expor esses metadados (`CTR-NUMBER-PROGRAM`) e o create derivá-los do `contractRef` (`FIN-CREATE-DTO`). Enquanto não houver, a seção fica gated.

## Lacunas do create na Fatia 1 (ticket `FIN-CREATE-DTO`)

O `createDocumentBodySchema` **não aceita** `competencia`, `dataEmissao` nem `contaDebitoId` (presentes no `data-model` documentado). No v1, esses campos são **omitidos/gated**.

## Regras de validação (na UI / borda)

- Retenções só habilitadas para **NFS-e** e **RPA** (gating na view; backend recusa o resto → `retention-not-allowed`).
- `dueDate` obrigatória (Open) → ausência = `document-incomplete`.
- Líquido > 0 → senão `net-value-invalid`.
- `documentNumber`, `supplierRef`, `paymentMethod`, `grossValueCents`, `type` obrigatórios.
