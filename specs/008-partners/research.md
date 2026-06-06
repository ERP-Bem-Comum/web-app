# Research: Gestão de Parceiros (`partners`)

**Feature**: `specs/008-partners/` · **Fase 0 do plan**

> Decisões técnicas e alternativas. Cada item: decisão · porquê · alternativas rejeitadas.

## R-001 — Espelhar o módulo `contracts` (não só `auth`)

- **Decisão**: usar `src/modules/contracts/` (completo, 83 arquivos, já no padrão flat ADR-0009) como
  referência primária de estrutura/nomeação, e `auth` (feature-modelo documentada) como referência de doutrina.
- **Porquê**: `contracts` já materializa client×server + comportamentos flat + fallback mock (precedente do
  mesmo padrão que precisamos). Reduz divergência.
- **Rejeitado**: inventar estrutura nova (retrabalho, risco de divergir do lint de boundaries).

## R-002 — Estratégia de mock/fallback isolada no gateway

- **Decisão**: cada sub-domínio tem um `gateway` com implementação `real` (chama server fn → core-api) e
  `mock` (in-memory). A escolha é por composição (`*.composition.ts`), default real; mock onde a API é 🔴/parcial.
- **Porquê**: ADR-0001 (entrega progressiva) + SC-005 (troca sem tocar UI/ViewModel). O ponto de troca é
  único e testável.
- **Rejeitado**: feature flags na UI (vaza estado do backend pra apresentação, viola Princ. XI); branch por env no view-model (idem).

## R-003 — Padrão dual-panel (Estados/Municípios) como organismo agnóstico

- **Decisão**: `DualPanel` é um organismo do design system (lista esquerda/direita + transfer +/−, buscas
  independentes), dirigido por um view-model puro (estado da seleção + commands add/remove). Municípios
  estende com seleção de UF (combobox autocomplete) obrigatória.
- **Porquê**: reuso entre Estados e Municípios; mantém view burra (Princ. XI). Persistência imediata =
  command que chama o gateway (mock na Fase 1) e atualiza otimista.
- **Rejeitado**: dois componentes separados copiados (duplicação); CRUD convencional (não bate com a UX).

## R-004 — Import CSV/Excel de colaboradores

- **Decisão (atualizada)**: integra a rota **real** `POST /api/v1/collaborators/import`. O core-api espera
  **CSV cru `text/csv`** (não multipart). A UI faz upload de arquivo (multipart no browser); a **server
  function do BFF converte o arquivo em texto `text/csv`** antes de repassar ao core-api. Resposta sempre
  `200 { created, failed: [{ line, error }] }` (import parcial); malformado → `400`.
- **Porquê**: a rota existe; o BFF é o lugar de adaptar o formato (ACL). Sem mock.
- **Consolidado (consultas nodejs/tanstack-start/react experts + ACDG/security, 2026-06-06)**: **CSV-only**.
  O client lê `File.text()` e envia a **string** validada por Zod (≤2 MiB) à server fn (não `FormData`); o
  `server/domain` faz parser CSV puro (BOM/aspas/quebras) + value-objects branded + **anti-CSV-injection**
  (rejeitar `= + - @ \t` no início de campo); o `server/adapters` repassa `text/csv` ao core-api com timeout.
  Na UI (MVVM): `File` no Controller, `File.text()` no Binding (`mutationFn`), ViewModel puro recebe strings,
  union tagged `idle|file-selected|sending|reported|failed`, a11y (`useId`, `<progress>` indeterminado, `aria-live`).
- **Rejeitado**: lib de `.xlsx` (SheetJS) — colide com supply-chain pnpm + CVEs (prototype pollution/ReDoS),
  Princ. VIII; e `FormData`/multipart (a server fn idiomática recebe string serializável validada por Zod).
- **`.xlsx`**: fora de escopo; se virar requisito de negócio, reabrir como conversão **no BFF** (nunca via shell), com justificativa formal.

## R-005 — Status duplo de colaboradores (situação × ativação)

- **Decisão**: modelar como dois VOs/uniões independentes: `RegistrationStatus` (`Pré`/`Cadastrado`) e
  `ActivationStatus` (`Ativo`/`Inativo`). A UI exibe ambos; transições de situação são unidirecionais.
- **Porquê**: o core-api confirma os dois eixos (`status` + `active`); são semanticamente distintos.
- **Rejeitado**: um único enum combinando os 4 estados (perde a ortogonalidade, gera estados ilegais).

## R-006 — Catálogo de categorias de fornecedor

- **Decisão (atualizada)**: consumir o endpoint **real** `GET /api/v1/suppliers/service-categories`
  (**39** códigos canônicos; union fechada no domínio). O combo de categoria do filtro/form carrega dessa
  lista. `serviceCategory` é validado no domínio (inválido → `422`). **Resolvido** (FR-017).
- **Nota**: na borda HTTP o campo ainda é `z.string()` (não `z.enum`) — o conjunto válido vem do catálogo.

## R-007 — Filtros "programa" e "idade" (colaboradores)

- **Decisão (atualizada)**: o backend **descartou explicitamente** `programa` (fora do BC do colaborador)
  e `idade` (FR-012 do core-api; chaves desconhecidas são `strip`). Front: **remover "programa"** da UI de
  filtros e **derivar idade de `dateOfBirth`** no client (filtro/exibição client-side). Confirmar no clarify (FR-019).
- **Rejeitado**: prometer filtro server-side que o backend não suporta.

## R-008 — Saneamento de encoding na ACL

- **Decisão**: normalizar strings vindas do core-api no `server/adapters` (ex.: corrigir mojibake
  `AvaliaÃ§Ã£o`→"Avaliação") antes de montar o Model. Registrado em ADR-0001.
- **Porquê**: bug é de borda/API, não de UI; a ACL é o lugar (Evans, p.224).
- **Rejeitado**: corrigir na UI (espalha workaround) ou replicar o bug (degrada UX).
