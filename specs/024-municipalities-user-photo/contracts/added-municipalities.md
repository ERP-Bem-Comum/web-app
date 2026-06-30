# Contract — Municípios parceiros adicionados (cross-state)

> Fronteiras envolvidas: **server function (BFF)** ← → **core-api** (`GET /partner-municipalities/added`).
> A UI consome só a server fn (via repository); o browser nunca fala com o core-api direto.

## 1. core-api (já existe, #32) — `GET /api/v1/partner-municipalities/added`

- **Auth**: requer sessão; permissão `GEOGRAPHY_PERMISSION.read`.
- **Query**: `search?: string` (min 1), `page: int ≥ 1` (default 1), `limit: int 1..100` (default 25).
- **200**:
  ```jsonc
  {
    "items": [ { "ibgeCode": "2700300", "uf": "AL", "name": "Arapiraca" } ],
    "meta": { "currentPage": 1, "itemsPerPage": 25, "itemCount": 1, "totalItems": 1, "totalPages": 1 }
  }
  ```
- **503**: `geography-repo-unavailable`.

## 2. Server function (NOVA) — `listAddedMunicipalitiesFn`

- **Arquivo**: `src/modules/partners/server/adapters/server-fns/geography/list-added-municipalities.query.fn.ts`
- **Input**: nenhum.
- **Comportamento**: resolve token server-side; chama o core-api acumulando páginas
  (`limit=100`, itera até `currentPage ≥ totalPages`, guard de ~50 páginas); valida cada response com Zod
  (`AddedMunicipalitiesPagedSchema`); mapeia para `PartnerMunicipality[]` (`isPartner:true`), ordena
  por UF→nome.
- **Output**: `FnResult<readonly PartnerMunicipality[]>` (mesmo envelope das outras query fns da geografia).
- **Erros**: propaga como `Result.err(tag)` (tag de partners; `geography-repo-unavailable`/`unauthorized`/…)
  — sem throw fora da borda.
- **public-api**: exportar `listAddedMunicipalitiesFn` em `partners/public-api/index.ts`.

## 3. Repository (client) — método novo

- **Arquivo**: `src/modules/partners/client/data/repository/geography.repository.ts`
- `listAddedMunicipalities: () => Promise<Result<readonly PartnerMunicipality[], PartnersError>>`
  — chama `listAddedMunicipalitiesFn` e devolve `Result` (espelha `listStates`).
- Instância: `geography.repository.instance.ts` injeta a nova fn.

## 4. Query (client) — key + options

- **Arquivo**: `src/modules/partners/client/geography/geography.query.ts`
- `addedMunicipalitiesQueryKey = ['geography','municipalities','added'] as const`
- `addedMunicipalitiesQueryOptions` = `{ queryKey, queryFn: () => geographyRepository.listAddedMunicipalities() }`

## 5. Binding — `municipalitiesAdded: GeoPanel`

- **Arquivo**: `geography.binding.ts`
- Remover `municipalitiesAddedPending: boolean`; adicionar `useQuery(addedMunicipalitiesQueryOptions)` e
  derivar `municipalitiesAdded: GeoPanel` (filtrando por `municipalitiesAddedSearch`, igual a `statesAdded`).
- No `onSuccess` do toggle de município: invalidar `municipalitiesQueryKey(uf)` **+** `addedMunicipalitiesQueryKey`.

## 6. Page — render real (sem placeholder)

- **Arquivo**: `geography.page.tsx`
- A coluna "Municípios Adicionados": `state={toColumnState(g.municipalitiesAdded)}` e **remover**
  `placeholder={g.municipalitiesAddedPending ? … }`.

## Não muda
- `territory-column.component.tsx` / `.css.ts`; Lista Geral por UF; core-api.
