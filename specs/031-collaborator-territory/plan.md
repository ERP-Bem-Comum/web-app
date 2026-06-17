# Implementation Plan: Território (UF + município) no Colaborador

**Branch**: `integration/collaborator-territory-031` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

## Summary

Adicionar `territory: { uf, municipality } | null` ao Colaborador: contrato (io + client model), schema borda (detail + create body), io-schema (guard), adapter (detailToModel + create body), form (UF select das 27 + município texto livre) e detalhe (exibe; read-only — PUT omite). UF das 27 siglas via **lista estática local** no domínio do colaborador (evita acoplar a view do colaborador à view-model da geografia / boundary).

## Technical Context

- TanStack Start + React 19 + Zod 4. Sem deps novas. Somente front (BFF + client).
- **UF**: lista estática das 27 siglas (sigla+nome) — defino `BR_UF` em `partners/client/domain` (ou reuso de um ponto neutro). Município = `Input` texto livre.
- **Assimetria PUT**: `UpdateCollaboratorInput = Omit<CreateCollaboratorInput,'territory'> & {id}` — edição não envia território; no detalhe o território é **read-only**.
- Testing: node:test do form-schema (território opcional/parcial) + guard io-schema; gates verdes.

## Constitution Check

PASS. §I (UF estática no domínio do colaborador, sem furar boundary p/ geografia), §V (Zod na borda + guard AssertEqual), §XI (controller fora da view; view burra), §X (tokens-only). Zero-regressão (aditivo).

## Project Structure (arquivos)

```text
src/modules/partners/server/domain/collaborator/collaborator.types.ts  # +Territory type
src/modules/partners/server/domain/collaborator/collaborator.io.ts     # Create +territory; Detail +territory; Update OMITE territory
src/modules/partners/server/adapters/collaborator.io-schemas.ts        # territory no Create (guard); Update sem territory
src/modules/partners/server/adapters/core-api/collaborator.schema.ts   # TerritoryDto no detail (+ create body montado no adapter)
src/modules/partners/server/adapters/core-api/core-api-collaborators.ts# detailToModel lê territory; create body envia territory
src/modules/partners/client/data/model/collaborator.model.ts           # Territory + Detail + form schema +territory; UF list (BR_UF)
src/modules/partners/client/collaborator-create/components/collaborator-form.controller.ts  # estado uf/municipality
src/modules/partners/client/collaborator-create/components/collaborator-form.component.tsx  # UF select + município
src/modules/partners/client/collaborator-detail/... (content)          # exibe território (read-only)
src/shared/i18n/catalog.pt-BR.ts                                        # rótulos território/uf/município
tests/modules/partners/...                                             # form-schema + fixtures (aditivo)
```

## Complexity Tracking

- Assimetria create-aceita / PUT-omite território: tratada com `Omit` no UpdateInput (não é violação; reflete o contrato). Registrado.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **M** — 1 objeto territory em 4 camadas + UF select + município + detalhe + i18n + testes.
- **Plano de testes**: form-schema aceita território nulo/parcial/completo; guard io-schema passa; suítes do colaborador verdes (não-regressão).
