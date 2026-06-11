# Data Model — 024 Municípios parceiros adicionados (cross-state)

> Frontend-only. Sem novos agregados/eventos no core-api. Reusa tipos existentes da geografia.

## Entidades / Tipos

### PartnerMunicipality (já existe — `client/data/model/geography.model.ts`)
```ts
export type PartnerMunicipality = Readonly<{
  ibgeCode: string   // código IBGE (7 dígitos)
  uf: string         // sigla da UF (ex.: 'AL')
  name: string       // nome do município
  isPartner: boolean // no cross-state /added é sempre true
}>
```
- **Reuso sem alteração.** No mapeamento do `/added`, `isPartner` é fixado em `true`.

### ColumnItem (já existe — `geography.binding.ts`)
```ts
export type ColumnItem = Readonly<{ key: string; label: string; added: boolean }>
```
- Para o painel "Adicionados": `key = ibgeCode`, `label = name` (ou `name (UF)` — ver Regras), `added = true`.

### GeoPanel (já existe — `geography.binding.ts`)
```ts
export type GeoPanel =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; items: readonly ColumnItem[] }>
```
- `municipalitiesAddedPending: boolean` **sai**; entra `municipalitiesAdded: GeoPanel`.

## Response do core-api (`GET /partner-municipalities/added`) — borda Zod
```ts
// schema de response (adapter core-api da geografia)
const AddedMunicipalityDtoSchema = z.object({
  ibgeCode: z.string().trim(),
  uf: z.string().trim(),
  name: z.string().trim(),
})
const AddedMunicipalitiesPagedSchema = z.object({
  items: z.array(AddedMunicipalityDtoSchema),
  meta: z.object({
    currentPage: z.int(),
    itemsPerPage: z.int(),
    itemCount: z.int().nonnegative(),
    totalItems: z.int().nonnegative(),
    totalPages: z.int().nonnegative(),
  }),
})
```

## Regras / Transformações
- **Mapeamento**: `AddedMunicipalityDto` → `PartnerMunicipality` com `isPartner: true`.
- **Acumulação de páginas** (server fn): iterar `page=1..totalPages` (`limit=100`), unir `items`. Guard de
  páginas (máx. ~50) para robustez.
- **Ordenação**: por `uf` e depois `name` (estável, `localeCompare`).
- **Label da coluna**: exibir o nome do município; como é cross-state, incluir a UF para desambiguar
  (ex.: `Arapiraca (AL)`). A busca (`municipalitiesAddedSearch`) casa contra esse label (nome e/ou UF).
- **Vazio**: `totalItems = 0` → `GeoPanel { status:'ready', items: [] }` → o `TerritoryColumn` mostra
  `emptyLabel`.
- **Erro**: falha da query/Result → `GeoPanel { status:'error', errorTag }` (tag de partners), sem afetar
  Estados nem a Lista Geral.

## Query keys
- Nova: `addedMunicipalitiesQueryKey = ['geography','municipalities','added'] as const`.
- Invalidação após toggle de município (Lista Geral): invalidar `municipalitiesQueryKey(uf)` **+**
  `addedMunicipalitiesQueryKey`.

## Sem mudança
- `geography.view-model.ts` (helpers puros já cobrem ordenação/contagem; adicionar só se útil ao mapeador).
- `territory-column.component.tsx` / `.css.ts` (burro, agnóstico).
- Lista Geral por UF (`listMunicipalities(uf)` + toggle) — comportamento inalterado.
- core-api (nenhuma mudança).
