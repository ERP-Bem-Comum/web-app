---
description: 'Task list — território (UF + município) no Colaborador'
---

# Tasks: Território (UF + município) no Colaborador

**Input**: specs/031-collaborator-territory/ (spec, plan)

## Phase 1: Contrato (io + schema + io-schema + model)

- [x] T001 `collaborator.types.ts`: `Territory = Readonly<{ uf: string | null; municipality: string | null }>`.
- [x] T002 `collaborator.io.ts`: `CreateCollaboratorInput += territory: Territory | null`; `CollaboratorDetail += territory: Territory | null`; `UpdateCollaboratorInput = Omit<CreateCollaboratorInput,'territory'> & { id: string }` (PUT omite).
- [x] T003 `collaborator.schema.ts`: `TerritoryDtoSchema` no detail (`territory: …nullable().catch(null)`).
- [x] T004 `collaborator.io-schemas.ts`: território no `CreateCollaboratorInputSchema`; manter `UpdateCollaboratorInputSchema` SEM território (omit); ajustar guards `AssertEqual`.

## Phase 2: Adapter (BFF)

- [x] T005 `core-api-collaborators.ts`: `detailToModel` lê `territory`; o body do create envia `territory` (campos vazios → null); o body do update NÃO envia território.

## Phase 3: Client model + UI

- [x] T006 `collaborator.model.ts`: `Territory` + `CollaboratorDetail += territory`; `CreateInput += territory`; `CollaboratorFormSchema += territory` (uf/municipality opcionais); lista `BR_UF` (27 siglas+nome).
- [x] T007 `collaborator-form.controller.ts`: estado `uf`/`municipality` (string ''), monta `territory` no submit (vazios → null).
- [x] T008 `collaborator-form.component.tsx`: seletor de UF (BR_UF) + Input de município (texto livre), na seção apropriada; i18n.
- [x] T009 Detalhe do Colaborador: exibe UF + município (read-only — PUT omite território).
- [x] T010 i18n: `partners.collaborators.form.{territory,uf,municipality}` (+ select placeholder).

## Phase 4: Testes + gates

- [x] T011 (RED→GREEN) Teste do `CollaboratorFormSchema`: território nulo/parcial/completo; aditivo.
- [x] T012 `pnpm typecheck` + `pnpm lint` (0 erros); ajustar fixtures do colaborador aditivamente.
- [x] T013 `pnpm test` + `pnpm test:dom` verdes (zero regressão).
- [ ] T014 Validação em tela — PENDENTE (rebuild dedicado; esta branch é off develop). Atualizar Status da spec.

## Dependencies

- Phase 1 antes da 2/3. T007 (controller) antes do T008. T011 (RED) antes da impl correspondente.

## Notes

- Município é texto livre (NÃO usar catálogo de municípios da geografia).
- PUT omite território (assimetria do contrato) → Update sem território; detalhe read-only.
- 1 feature por PR; off develop.
