# Contrato: avaliação de fornecedor (§1.6) — BFF ↔ core-api

> Frontend-only. O core-api **não muda** (#32). Consome `/api/v1/suppliers`.

## Escrita (POST/PUT /api/v1/suppliers)
Body ganha 2 campos (domínio → wire):
```jsonc
{
  // ...campos existentes (name, email, cnpj, corporateName, fantasyName, serviceCategory, bankAccount, pixKey)
  "serviceRating": "BOM",        // 'RUIM'|'REGULAR'|'BOM'|'OTIMO' | null
  "ratingComment": "Atende bem"  // string | null
}
```
Regra: ambos opcionais (null). `invalid-service-rating` → 422 (a UI já restringe ao enum; defesa).

## Leitura (GET detalhe/lista)
Response inclui `serviceRating: string|null` e `ratingComment: string|null`. Mapeador front: `string → ServiceRating | null` **tolerante** (valor desconhecido → null).

## Catálogo (não consumido — D1)
`GET /api/v1/suppliers/service-ratings` existe (4 níveis), mas o front usa **enum fixo** `SERVICE_RATINGS` + labels i18n (decisão D1).

## Zod na borda (supplier.io-schemas)
```ts
serviceRating: z.enum(['RUIM','REGULAR','BOM','OTIMO']).nullable().default(null),
ratingComment: z.string().trim().max(500).nullable().default(null),
// drift guard: AssertEqual<z.infer<...>, D.CreateSupplierInput> = true
```

## Erros → tag
`invalid-service-rating` → `partnersErrorTag('validation')` (ou tag específica, decisão do implement) → mensagem amigável.
