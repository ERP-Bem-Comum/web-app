# Data Model — 025 Integração Parceiros × Contratos

> Frontend-only. Reusa tipos existentes; aditivo. Sem core-api.

## US1 — Pré-preenchimento do contratado

### Detalhe do parceiro (entrada, por tipo) — já existe no partners
- Fornecedor (`SupplierDetail`): `{ email, bankAccount?: {bank,agency,accountNumber,checkDigit}, pixKey?: {keyType,key} }`
- ACT (`ActDetail`): `{ email, bankAccount?, pixKey? }`
- Financiador (`FinancierDetail`): `{ telephone }`
- Colaborador (`CollaboratorDetail`): `{ email }`

### Campos do contrato (alvo do pré-preenchimento) — já existem no controller
```ts
// ContractFormState (contract-form.controller.ts) — sem alteração de tipo
email: string          // editável
telephone: string      // editável
bancaryInfo: { bank: string; agency: string; accountNumber: string; dv: string }  // SOMENTE-LEITURA (disabled)
pixInfo: { keyType: string; key: string }                                          // SOMENTE-LEITURA (disabled)
```

### Mapeador PURO (novo)
```ts
type Kind = 'Fornecedor' | 'Financiador' | 'Colaborador' | 'Acordo'
type ContractPrefill = Readonly<{
  bancaryInfo?: Readonly<{ bank: string; agency: string; accountNumber: string; dv: string }>
  pixInfo?: Readonly<{ keyType: string; key: string }>
  email?: string
  telephone?: string
}>
// partnerDetailToContractFields(kind, detail) → ContractPrefill (só os campos que o tipo possui)
```
- Fornecedor/ACT → `bancaryInfo?` (se bankAccount), `pixInfo?` (se pixKey), `email?`.
- Financiador → `telephone?`.
- Colaborador → `email?`.
- Campos ausentes ficam `undefined` (não preenche).

## US2 — Contratado ACT

### Tipos reusados/estendidos (client)
```ts
// Contractor (snapshot do contratado) — já existe (name/document/email?/telephone?/bank?/pix?)
// Contract (domain/types.ts): tem supplier?/financier?/collaborator? + supplierId/financierId/collaboratorId/actId
//   ADICIONAR: act?: Contractor | null
// ContractRow extends Contract → herda act? (ok)
// ContractSchema (model, zod): tem actId; ADICIONAR act?: PartnerSnapshotSchema.optional()
```
- `contractType`: `'Fornecedor' | 'Financiador' | 'Colaborador' | 'ACT'` (já existe; discriminador).
- Mapeamentos a estender: `mapModelToContractRow` (+act/actId), `buildContractDocData` (+act).
- `getContractorFromRow`: `case 'ACT' → row.act` (corrige bug que retornava supplier).
- `contract-info`: `partner = supplier ?? financier ?? collaborator ?? act`; `typeLabel` trata 'ACT'.

## US3 — Telefone (máscara)
- Sem novo tipo. Display formatado, valor persistido = **dígitos** (via `Input mask="phone"` → `unmask`).

## US4 — returnTo (rota)
```ts
// search schema das rotas de criação de parceiro
const CreatePartnerSearch = z.object({ returnTo: z.string().trim().optional() })
```
- Navegação: `/parceiros/fornecedores/criar?returnTo=/contratos/criar`.
- Retorno no sucesso: `safeRedirect(search.returnTo, '<lista do tipo>')`.

## US5 — Chave PIX derivada (helper genérico p/ os 4 forms)
```ts
// PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random-key'
// derivePixKey(keyType, src: { document?: string; email?: string; telephone?: string }) → string
//   cpf|cnpj → document ; email → email ; phone → telephone ; random-key → '' ; ausente/vazio → ''
```
- Aplicada no onChange do select de tipo de chave. ATIVO: supplier-form `{document: cnpj, email}` e
  act-form `{document: cnpj, email}`. Colaborador `{document: cpf, email}` e Financiador
  `{document: cnpj, telephone}` quando o backend liberar (gated; não nesta fatia).

## Sem mudança
- core-api; agregador de busca de parceiros; detalhe do contrato (exibição já cobre); CSS (reuso);
  banco/PIX de colaborador/financiador (gated); telefone como chave PIX em supplier/ACT (não coletam).
