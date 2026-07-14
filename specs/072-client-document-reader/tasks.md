# Tasks: Leitor de documento client-side por gabarito

**Feature**: `specs/072-client-document-reader/` · **Plan**: `./plan.md`

## Fase 0 — Setup

- [x] T000 `pnpm add fast-xml-parser` (pnpm — hook bloqueia npm/yarn). `pdfjs-dist` já instalado (#071).

## Fase 1 — Núcleo puro (US1/US2) — node:test primeiro

- [x] T001 `reader/document-reading.model.ts` — tipo `DocumentReading` + `DocumentReadingPatch` (EN idioms).
- [x] T002 `reader/xml/xml-utils.ts` — wrapper `XMLParser` + `pick/deep/num/str/dataISO/competenceBR` com
      `unknown` + type guards (sem `any`).
- [x] T003 `reader/xml/nfse-national.reader.ts` (+ teste) — NFS-e nacional (DPS/infNFSe).
- [x] T004 `reader/xml/nfse-abrasf.reader.ts` (+ teste) — ABRASF/ginfes; detector `isAbrasf`.
- [x] T005 `reader/xml/nfse-sao-paulo.reader.ts` (+ teste) — NFS-e SP; detector `isSaoPaulo`.
- [x] T006 `reader/xml/nfe-produto.reader.ts` (+ teste) — NF-e modelo 55; detector `isNfeProduto`.
- [x] T007 `reader/xml/read-xml.ts` (+ teste) — roteador na ordem NF-e → SP → ABRASF → nacional.
- [x] T008 `reader/pdf/gabarito-engine.ts` (+ teste) — `groupLines`, `convert`, estratégias, `extractWithGabarito`.
- [x] T009 `reader/pdf/gabaritos/*.gabarito.ts` + `index.ts` — DANFE, FILU (SP), DANFSe v2, DANFSe v1.
- [x] T010 `reader/pdf/read-pdf-lines.ts` (+ teste) — `lines`→`DocumentReading` por gabarito.

## Fase 2 — Binding client-only (US2)

- [x] T011 `reader/document-reader.binding.ts` — `useDocumentReader()`: File→XML(text) ou PDF(bytes→pdf.js
      getTextContent→itens→`groupLines`)→`DocumentReading`. Cancelável (sem leitura stale). Worker same-origin.

## Fase 3 — Mapa + precedência (US1/US3)

- [x] T012 `document-reading.view.ts` (+ teste) — `mapReadingToPatch(reading)` → `{patch, ocrKeys}` (valores em
      reais mascarados; retenção/reforma só > 0; tipo NFS-e/NF-e→DANFE) + `matchPartnerByTaxId(partners, taxId)`.
- [x] T013 `document-form.view.ts` — `applyReadingPatch(fields, patch)` PURO (overlay atômico, sem gating).
- [x] T014 `document-form.controller.ts` — ação `applyReading` + overlay do patch na hidratação (client vence),
      via 2 efeitos (hydrate-once com overlay; apply-on-change).
- [x] T015 (+ teste DOM) precedência: reading vence rascunho backend em ambas as ordens de chegada.

## Fase 4 — Wiring da página (US1/US2/US3)

- [x] T016 `page/lancar-documento.page.tsx` — `handleSelectFile` também dispara `reader.read(file)`; casa
      fornecedor via `matchPartnerByTaxId`; passa o patch ao controller; une `ocrKeys` do leitor ao destaque âmbar.

## Fase 5 — Gate

- [x] T017 `pnpm typecheck` 0 · `pnpm lint` 0 erros · `pnpm test` (node) · `pnpm test:dom` · `pnpm build`.
- [x] T018 ADR-0021 escrito + índice atualizado.
