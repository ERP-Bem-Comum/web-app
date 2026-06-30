# Tasks — 024 Municípios parceiros adicionados (cross-state)

**Feature**: ligar o painel "Municípios Parceiros Adicionados" ao `GET /partner-municipalities/added`
(cross-state), espelhando o painel "Estados Parceiros Adicionados". Frontend-only, módulo
`partners`/`geography`, sem tocar core-api, sem regressão.

**Escopo**: 1 user story (US1, P1). US2 (foto) removida — bloqueada no backend (ticket
`USR-ME-PHOTO-DISPLAY.md`).

**Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`;
imutabilidade `Readonly`; só-tokens (`vars.*`); strings UI = i18n; views burras MVVM (`useQuery` só no
binding); boundaries por `public-api`; Zod na borda (response do core-api); naming por postfix; `switch`
exaustivo com guard `never`. Server function = única fronteira client↔server.

**Convenções de teste**: `node:test` → `*.test.ts` (imports `#`, puros); Vitest+jsdom → `*.spec.tsx`.

---

## Phase 1: Setup & Baseline

- [X] T001 Registrar baseline dos gates antes de mexer: rodar `pnpm typecheck`, `pnpm lint`, `pnpm test`
  (node:test) e `pnpm test:dom` (vitest) e anotar os números (erros/warnings/tests) para comparar no
  Polish.
- [X] T002 Ler as outras query fns da geografia para confirmar o PADRÃO antes de codar:
  `src/modules/partners/server/adapters/server-fns/geography/list-partner-states.query.fn.ts` e
  `list-municipalities-by-uf.query.fn.ts` — confirmar (a) onde vivem os schemas Zod de **response** da
  geografia (arquivo `*.schema.ts` no adapter core-api OU inline na fn), (b) o tipo `FnResult<…>` usado,
  (c) como o token é resolvido server-side (`resolveAccessTokenFn`/equivalente) e como o erro vira
  `Result.err(tag)`. Registrar os caminhos exatos para as tasks seguintes.
- [X] T003 Confirmar assinaturas reusadas (sem alterar): `PartnerMunicipality`
  (`src/modules/partners/client/data/model/geography.model.ts`), `GeoPanel`/`ColumnItem`/`toColumnState`
  e `municipalitiesAddedSearch`/`municipalitiesAddedPending` em
  `src/modules/partners/client/geography/geography.binding.ts`, e as props do `TerritoryColumn`
  (`components/territory-column.component.tsx`).

**Checkpoint**: padrão da geografia mapeado; baseline anotado.

---

## Phase 2: Foundational (bloqueia US1)

> Schema de borda + helper PURO testável + query key. Sem isso a server fn e o binding não fecham.

- [X] T004 [P] Definir o schema Zod de **response** do `/added` no arquivo confirmado em T002
  (`AddedMunicipalityDtoSchema = { ibgeCode, uf, name }` e
  `AddedMunicipalitiesPagedSchema = { items: [...], meta: { currentPage, itemsPerPage, itemCount,
  totalItems, totalPages } }`), espelhando os schemas de response dos outros endpoints da geografia.
  Usar `z.int()` (não `z.number().int()`).
- [X] T005 [P] Criar helper PURO de mapeamento+ordenação em
  `src/modules/partners/server/adapters/server-fns/geography/list-added-municipalities.mapper.ts`
  (ou no view-model da geografia, conforme o padrão): `toAddedMunicipalities(items)` →
  `readonly PartnerMunicipality[]` com `isPartner: true` fixo, ordenado por `uf` e depois `name`
  (`localeCompare`, estável). Função pura, sem I/O — testável por `node:test`.
- [X] T006 **[RED]** Escrever o teste do helper em
  `tests/modules/partners/client/data/repository/geography.repository.test.ts` (append) OU em
  `tests/modules/partners/server/adapters/server-fns/geography/list-added-municipalities.mapper.test.ts`
  (novo, imports `#`): `toAddedMunicipalities` mapeia `{items}` → `PartnerMunicipality[]`
  (`isPartner:true`), ordena UF→nome, e (se a acumulação de páginas for pura) une 2 páginas. Deve
  **falhar** antes da impl do mapper (RED) — rodar `pnpm test` e confirmar o vermelho.
- [X] T007 [P] Adicionar a query key + options em
  `src/modules/partners/client/geography/geography.query.ts`:
  `addedMunicipalitiesQueryKey = ['geography','municipalities','added'] as const` e
  `addedMunicipalitiesQueryOptions = { queryKey, queryFn: () => geographyRepository.listAddedMunicipalities() }`
  (espelhar `partnerStatesQueryKey`/options).

**Checkpoint**: schema + helper (verde no T006 após T005) + query key prontos.

---

## Phase 3: US1 — Painel "Municípios Adicionados" (cross-state) (P1)

**Goal**: o painel direito da seção Municípios lista todos os municípios parceiros (qualquer UF), com
busca + contador, e reflete add/remove da Lista Geral.

**Independent Test**: com municípios parceiros em ≥2 UFs, o painel "Adicionados" os lista (nome+UF), a
busca filtra, o contador bate, e add/remove na Lista Geral atualiza o painel — tudo sem recarregar.

- [X] T008 [US1] Criar a server fn
  `src/modules/partners/server/adapters/server-fns/geography/list-added-municipalities.query.fn.ts`:
  input vazio; resolve token server-side; **acumula páginas** do `GET /partner-municipalities/added`
  (`limit=100`, itera `page` até `currentPage ≥ totalPages`, guard de ~50 páginas → para e usa o que
  carregou); valida cada response com `AddedMunicipalitiesPagedSchema` (T004); aplica o helper (T005);
  retorna `FnResult<readonly PartnerMunicipality[]>`; erro como `Result.err(tag)` (sem throw fora da
  borda). Seguir o padrão de `list-partner-states.query.fn.ts`.
- [X] T009 [US1] Tornar o teste do mapeador/acumulação **verde** (impl de T005/T008 concluída): rodar
  `pnpm test` e confirmar o teste de T006 passando. Se a acumulação ficou no helper, cobrir o caso de
  2 páginas aqui.
- [X] T010 [US1] Exportar a server fn em `src/modules/partners/public-api/index.ts`
  (`export { listAddedMunicipalitiesFn } from '…/geography/list-added-municipalities.query.fn.ts'`),
  junto das outras fns de geografia.
- [X] T011 [US1] Adicionar `listAddedMunicipalities()` em
  `src/modules/partners/client/data/repository/geography.repository.ts`:
  `() => Promise<Result<readonly PartnerMunicipality[], PartnersError>>` (espelha `listStates`); e injetar
  `listAddedMunicipalitiesFn` em `geography.repository.instance.ts`.
- [X] T012 [US1] Binding `src/modules/partners/client/geography/geography.binding.ts`:
  - remover o campo `municipalitiesAddedPending: boolean` do tipo `GeographyBinding` e do objeto retornado;
  - adicionar `municipalitiesAdded: GeoPanel`;
  - `const addedMunisQuery = useQuery(addedMunicipalitiesQueryOptions)`;
  - derivar `municipalitiesAdded` espelhando `statesAdded` (lista → `ColumnItem` com
    `label = "{name} ({uf})"`, `added: true`; filtrar por `municipalitiesAddedSearch`; tratar
    idle/loading/error/ready via o mesmo `panelFrom`).
- [X] T013 [US1] Invalidação cruzada no `onSuccess` do toggle de município (mesmo arquivo do binding ou a
  mutation que ele usa): além de `municipalitiesQueryKey(uf)`, invalidar também
  `addedMunicipalitiesQueryKey` — para o painel cross-state refletir add/remove (FR-004/SC-003).
- [X] T014 [US1] Page `src/modules/partners/client/geography/page/geography.page.tsx`: na coluna
  "Municípios Adicionados", trocar `state={{ status:'ready', items: [] }}` por
  `state={toColumnState(g.municipalitiesAdded)}` e **remover** o
  `placeholder={g.municipalitiesAddedPending ? … : undefined}`. Manter o resto da coluna (mode `remove`,
  busca `municipalitiesAddedSearch`, `onAction={g.removeMunicipality}`).
- [X] T015 [US1] i18n: remover o uso da tag `partners.geography.municipalities.added-pending`; confirmar
  com grep que ninguém mais a referencia e remover a entrada órfã de `src/shared/i18n/catalog.pt-BR.ts`
  (se houver outro uso, manter e só registrar).
- [X] T016 **[RED→GREEN]** [US1] Teste de DOM do painel em
  `tests/modules/partners/client/geography/added-municipalities.spec.tsx` (vitest): renderizar a seção/o
  `TerritoryColumn` de "Municípios Adicionados" com dados de ≥2 UFs → lista itens (nome+UF), busca filtra,
  contador correto, estado vazio. `afterEach(cleanup)`. Deferir partes frágeis no jsdom (ex.: portal/modal)
  com justificativa no próprio teste.

**Checkpoint**: US1 completa e verde (node + vitest); painel funcionando sem placeholder.

---

## Phase 4: Polish & Validação

- [X] T017 Rodar `pnpm verify` (typecheck + lint + node:test) e `pnpm test:dom`; comparar com o baseline
  (T001) e **reportar os números** (typecheck/lint/node/dom). Esperado: +1 teste node (mapeador) e
  +1 arquivo vitest, lint 0 erros.
- [X] T018 Revisar boundaries/lint do diff: `ui` sem `useQuery`/`useMutation` (data-hook só no binding);
  `Result` sem throw fora da borda; sem `any`; só-tokens (sem CSS novo — reusa `territory-column.css.ts`);
  i18n (sem literal cru); naming por postfix; `switch` exaustivo `never` no `toColumnState`; boundaries
  por `public-api`.
- [ ] T019 Validar em tela (admin.full@bemcomum.dev) conforme `quickstart.md`: municípios parceiros de
  ≥2 UFs no painel "Adicionados"; busca; contador; consistência com a Lista Geral (add/remove reflete);
  estado vazio; **sem regressão** em Estados e na Lista Geral de municípios. **NÃO commitar** (a usuária
  commita e testa em tela).

---

## Dependencies

- **Phase 1 (T001–T003)** → tudo. Mapeia padrão e baseline.
- **Phase 2 (T004–T007)** bloqueia a US1: schema (T004) + helper (T005) + teste RED (T006) + query key (T007).
- **Phase 3 (T008–T016)**: T008 depende de T004/T005; T009 depende de T008; T010/T011 dependem de T008;
  T012 depende de T007/T011; T013 depende de T012; T014 depende de T012; T015 independente (após T014);
  T016 depende de T012/T014.
- **Phase 4 (T017–T019)** após a US1 fechar.

## Parallel opportunities

- **T004, T005, T007** em paralelo (`[P]`) — arquivos distintos (schema, mapper, query).
- **T010 e T011** podem andar juntos após T008 (public-api vs repository/instance — arquivos distintos).
- T015 (i18n) em paralelo com a escrita do T016 (teste) após T014.

## Implementation strategy (MVP)

US1 é o MVP completo (única story). Ordem: helper+schema+teste RED → server fn (verde) →
repository/public-api/query → binding (`GeoPanel` + invalidação) → page (remove placeholder) → i18n →
vitest → polish. Validar em tela antes de commitar.

## Notas / a confirmar no implement

- Arquivo EXATO dos schemas de response da geografia (T002) — pode ser inline na fn; se for, manter o
  schema do `/added` junto da nova fn (consistência com o padrão local).
- Se a acumulação de páginas couber bem no helper puro, testá-la no helper (T006); senão, manter na fn e
  cobrir só o mapeamento/ordenação no puro (a fn fica fina, só orquestra).
- Confirmar que `partners.geography.municipalities.added-pending` não é usada por outra tela antes de
  remover (T015).
