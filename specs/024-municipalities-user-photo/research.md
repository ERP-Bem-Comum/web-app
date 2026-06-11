# Research — 024 Municípios parceiros adicionados (cross-state)

> Frontend-only, módulo `partners`/`geography`. Espelha o painel "Estados Parceiros Adicionados".
> Backend (#32) já entrega `GET /partner-municipalities/added`. Investigação read-only feita em 2026-06-11.

## Contexto de código (verificado)

### Estado atual do front (`src/modules/partners/client/geography/`)
- `geography.binding.ts` — adapter React (TanStack Query + derivação dos `GeoPanel`). Expõe hoje:
  `statesGeneral`, `statesAdded`, `municipalitiesGeneral` e **`municipalitiesAddedPending: boolean`**
  (hardcoded `true`, linha ~206) — o painel "Adicionados" de municípios é placeholder, sem query.
  - `statesAdded` é derivado filtrando `isPartner` do `listStates()` + busca client-side (`statesAddedSearch`)
    — **este é o molde** a espelhar.
- `geography.query.ts` — query keys: `partnerStatesQueryKey = ['geography','states']`,
  `municipalitiesQueryKey(uf) = ['geography','municipalities', uf]`. **Falta** a do cross-state.
- `geography.view-model.ts` — puros: `sortMunicipalities`, `applyMunicipalityToggle`, `countPartners`.
- `page/geography.page.tsx` — a coluna "Municípios Adicionados" renderiza hoje
  `state={{ status:'ready', items: [] }}` + `placeholder={municipalitiesAddedPending ? t(...) : undefined}`.
- `components/territory-column.component.tsx` — componente **burro** já pronto (modo `remove`, busca,
  estado vazio, loading, placeholder). **Não muda** — só passa a receber um `GeoPanel` real.

### Data layer (`src/modules/partners/.../data` + `server/adapters/server-fns/geography/`)
- `client/data/repository/geography.repository.ts` — métodos `listStates`, `toggleState`,
  `listMunicipalities(uf)`, `toggleMunicipality`. **Falta** `listAddedMunicipalities()`.
- `client/data/model/geography.model.ts` —
  `PartnerMunicipality = { ibgeCode, uf, name, isPartner }` (o `/added` não traz `isPartner`; ver D3).
- server fns existentes: `list-partner-states.query.fn.ts`, `list-municipalities-by-uf.query.fn.ts`,
  `toggle-partner-state.service.fn.ts`, `toggle-partner-municipality.service.fn.ts`.
  **Falta** a server fn do cross-state.
- `server/adapters/geography.io-schemas.ts` — schemas Zod de input. Os schemas de **response** ficam no
  client core-api adapter da geografia (mapeadores). (Confirmar arquivo exato no implement.)
- `public-api/index.ts` — exporta as 4 server fns de geografia + tipos. **Falta** exportar a nova.

### Backend (`core-api@dev`) — contrato confirmado
- `GET /partner-municipalities/added` (`partner-geography-plugin.ts:169`):
  - **querystring**: `search?: string(min1)`, `page: int≥1 = 1`, `limit: int 1..100 = 25`.
  - **response 200** (`addedMunicipalitiesPagedSchema`):
    ```jsonc
    {
      "items": [ { "ibgeCode": "2700300", "uf": "AL", "name": "Arapiraca" } ],
      "meta": { "currentPage": 1, "itemsPerPage": 25, "itemCount": 1,
                "totalItems": 1, "totalPages": 1 }
    }
    ```
  - itens **não** trazem `isPartner` (todos no painel são parceiros por definição).
  - erro: `geography-repo-unavailable → 503`.
  - permissão: `GEOGRAPHY_PERMISSION.read` (mesma do resto da geografia).

## Decisões

### D1 — Espelhar o painel "Estados Adicionados" (não reinventar)
- **Decisão**: reusar o componente `TerritoryColumn` (modo `remove`) e o padrão de derivação do `statesAdded`
  (lista + busca client-side + contador). A nova fonte é uma query própria do cross-state.
- **Rationale**: paridade visual/comportamental imediata; componente já é burro e testado; menor risco.
- **Alternativas**: criar componente novo (rejeitado — duplicação) ; busca server-side (ver D4).

### D2 — Carregar TODOS os parceiros (acumular páginas no server fn)
- **Decisão**: a server fn nova busca o cross-state **completo** acumulando páginas (`limit=100`, itera
  `page` até `currentPage >= totalPages`), e devolve um **array achatado** `readonly PartnerMunicipality[]`
  (sem `meta`). O binding faz busca/contagem **client-side**, igual a Estados.
- **Rationale**: mantém paridade exata com Estados (que carrega as 27 UFs de uma vez e filtra no client);
  o volume de municípios *parceiros* é tipicamente baixo (dezenas). Guard de segurança: limite duro de
  páginas (ex.: 50 → 5.000 itens) para evitar loop infinito por resposta inconsistente; se estourar, parar
  e logar (degrada para o que carregou).
- **Rationale token-cost**: uma server fn → uma chamada lógica; a iteração de páginas roda server-side
  (BFF), sem N round-trips do browser.
- **Alternativas**:
  - `limit=100` numa página só (rejeitado — corta acima de 100 sem aviso).
  - **Busca/paginação server-side na UI** (rejeitado por ora — quebraria a paridade com Estados e exigiria
    novo controle de UI; registrado como **follow-up** se o volume crescer muito — ver spec Assumptions).

### D3 — Mapear o response `/added` (sem `isPartner`) para o model existente
- **Decisão**: o mapeador converte cada item `{ ibgeCode, uf, name }` → `PartnerMunicipality` com
  `isPartner: true` fixo (todos no `/added` são parceiros). Ordenar por **UF, depois nome** (estável).
- **Rationale**: reusa o tipo `PartnerMunicipality` já existente sem alterá-lo; `isPartner: true` mantém o
  `ColumnItem.added = true` (modo `remove` do `TerritoryColumn`).
- **Zod na borda**: schema de response do `/added` (`{ items: [{ibgeCode,uf,name}], meta:{...} }`) validado
  no adapter core-api da geografia (espelhar o schema dos outros endpoints).

### D4 — Query key + invalidação cruzada
- **Decisão**: nova query key `addedMunicipalitiesQueryKey = ['geography','municipalities','added']`.
  Ao **adicionar/remover** município na "Lista Geral" (toggle por UF), o `onSuccess` da mutation passa a
  invalidar **ambas**: `municipalitiesQueryKey(selectedUf)` (já faz) **e** `addedMunicipalitiesQueryKey`
  (novo) — assim o painel cross-state reflete a mudança.
- **Rationale**: consistência (FR-004/SC-003) sem recarregar a página.
- **Alternativa**: update otimista no cache do cross-state (rejeitado por ora — invalidação é mais simples
  e segura; o item adicionado por UF pode não ter o `name` à mão no formato do cross-state).

### D5 — Binding: `municipalitiesAddedPending: boolean` → `municipalitiesAdded: GeoPanel`
- **Decisão**: trocar o campo placeholder por um `GeoPanel` real (idle/loading/error/ready), derivado da
  nova query + `municipalitiesAddedSearch` (que **já existe** no binding). Remover o `…Pending` e o ramo de
  placeholder na page.
- **Rationale**: a UI passa a tratar loading/erro/vazio de forma uniforme (mesmos estados de Estados).
- **Boundary**: data-hook (`useQuery`) só no binding; page/component continuam burros.

### D6 — i18n
- **Decisão**: reusar as tags já existentes do painel (`partners.geography.municipalities.added`,
  `...search`, `...column`, `...empty`, `...action.*`, `...loading`). **Remover** o uso de
  `partners.geography.municipalities.added-pending` (a tag pode ficar no catálogo, sem uso, ou ser
  removida — decidir no implement; preferência: remover para não deixar tag órfã).

## TDD (RED antes da impl)
- **node:test** (`*.test.ts`, imports `#`):
  - mapeador do response `/added`: `{ items:[{ibgeCode,uf,name}], meta }` → `readonly PartnerMunicipality[]`
    com `isPartner:true`, ordenado por UF→nome; acumulação de páginas (mock de 2 páginas → array unido);
    propagação de erro (`err('geography-repo-unavailable')` ou tag de partners) como `Result`.
- **vitest** (`*.spec.tsx`): painel "Municípios Adicionados" — lista itens (UF+nome), filtra pela busca,
  mostra contador e estado vazio. (Reusa a render do `TerritoryColumn`.) Deferir o que for frágil no jsdom
  com justificativa.

## Invariantes v2 (lint cobra)
`Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`; imutabilidade `Readonly`; só-tokens
(`vars.*`) — sem CSS novo (reusa `territory-column.css.ts`); strings de UI = i18n; views burras (MVVM —
`useQuery` só no binding); boundaries por `public-api`; Zod na borda (response do core-api); naming por
postfix; a server function é a única fronteira client↔server.

## Coordenação de branch
024 branchada de 023 (cadeia `develop ← 022 ← 023 ← 024`). Toca só `partners/geography` — sem overlap com
022 (act-*) nem 023 (supplier-*/contracts). Único arquivo possivelmente compartilhado: `catalog.pt-BR.ts`
(i18n) — e mesmo assim a 024 provavelmente **não adiciona** tags novas (reusa as existentes), então sem
conflito esperado.
