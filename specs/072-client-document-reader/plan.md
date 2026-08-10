# Implementation Plan: Leitor de documento client-side por gabarito

**Branch**: `072-client-document-reader` | **Date**: 2026-07-14 | **Spec**: `./spec.md`

**Input**: Feature specification from `/specs/072-client-document-reader/spec.md`

> Variante `-fe`. Feature 100% client-side, aditiva sobre a ingestão do backend do #062.

## Summary

Portamos o blueprint de "leitura por gabarito" da consultoria para dentro do módulo `financial`, respeitando as
regras do repo: **núcleo puro** (parsers XML por leiaute + motor de gabarito de PDF), **binding client-only** para
a extração da camada de texto do PDF (pdf.js sobre os bytes do `File`), e **mapeador puro** do modelo unificado
`DocumentReading` para os campos do formulário. A integração é aditiva: a ingestão do backend e o web view seguem
intactos; onde os dois têm o campo, o valor do leitor client **vence** (mais preciso). Decisão registrada em
**ADR-0021**.

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · Node 22
**Meta-framework**: Vite + `@tanstack/react-start` · `@tanstack/react-router`
**Server-state**: TanStack Query · **Validação**: Zod 4 (borda) · **UI**: React 19
**Design System**: vanilla-extract (reuso do destaque âmbar existente) — ADR-0007
**Testes**: `node:test` (parsers XML + motor de gabarito, puros) + Vitest/jsdom (binding pdf.js + mapa→form)
**Target Platform**: navegador moderno + BFF Node
**Project Type**: web app (front + BFF unificado)
**Performance Goals**: pré-preenchimento perceptivelmente instantâneo (sem esperar o backend)
**Constraints**: sem `any`; erros como valores/`null` na borda; pdf.js lê bytes do File (CSP `connect-src 'self'`
não cobre `blob:`); worker same-origin já configurado (#071)
**Scale/Scope**: 4 parsers XML + 4 gabaritos PDF + 1 motor + 1 binding + 1 mapa + 1 casador de fornecedor

## Constitution Check

| Princípio                            | Aderência       | Nota                                                                            |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓               | nenhuma server fn nova; browser não fala com core-api aqui                      |
| II. Errors Are Values                | ✓               | parsers/motor retornam o modelo ou `null`; nunca `throw` p/ a UI                |
| III. Client×Server Modular           | ✓               | tudo em `financial/client/document-create/reader`; sem cross-módulo novo        |
| IV. Illegal States Unrepresentable   | ✓               | união discriminada de `Estrategia`; `DocumentReading` com campos explícitos     |
| V. Server-State ≠ UI-State           | ✓               | leitura é derivação de arquivo local (UI-state), não server-state               |
| VI. Validation at the Boundary       | ✓               | entrada do leitor é o `File`/`unknown` do XMLParser → guards de tipo            |
| VII. Strict TS 6→7                   | ✓               | sem enum/namespace/any; blueprint reescrito com `unknown` + type guards         |
| VIII. Minimal Dependencies           | ✓ (justificada) | +`fast-xml-parser` (mesma lib do core-api); `pdfjs-dist` reusado — ver ADR-0021 |
| IX. pnpm Only                        | ✓               | `pnpm add fast-xml-parser`                                                      |
| X. Spec-Driven                       | ✓               | esta spec + ADR-0021                                                            |
| XI. Framework-Agnostic Client (MVVM) | ✓               | parsers/motor/mapa PUROS; pdf.js isolado em `*.binding.ts`                      |
| XII. Reactive Flow via Event Bus     | ✓ (N/A)         | sem eventos novos                                                               |

## Project Structure

### Source Code

```text
src/modules/financial/client/document-create/
├── reader/
│   ├── document-reading.model.ts          # tipo unificado DocumentReading + patch (PURO)
│   ├── xml/
│   │   ├── xml-utils.ts                    # XMLParser wrapper + pick/deep/num/str via unknown+guards
│   │   ├── nfse-national.reader.ts         # NFS-e nacional (DANFSe v1.0)  (PURO)
│   │   ├── nfse-abrasf.reader.ts           # ABRASF/ginfes (Fortaleza)     (PURO)
│   │   ├── nfse-sao-paulo.reader.ts        # NFS-e São Paulo               (PURO)
│   │   ├── nfe-produto.reader.ts           # NF-e modelo 55                (PURO)
│   │   └── read-xml.ts                     # roteador por marcador          (PURO)
│   ├── pdf/
│   │   ├── gabarito-engine.ts              # linhas→campos; âncoras; converter (PURO)
│   │   ├── gabaritos/{danfse,danfse-v2,filu-sp,danfe}.gabarito.ts + index.ts (PURO)
│   │   └── read-pdf-lines.ts               # linhas→DocumentReading          (PURO)
│   └── document-reader.binding.ts          # ADAPTER: File→(texto XML | linhas PDF via pdf.js)→DocumentReading
├── document-reading.view.ts                # mapReadingToPatch + matchPartnerByTaxId (PURO)
├── document-form.view.ts                   # (+) applyReadingPatch + OcrFieldKey já existente
├── document-form.controller.ts             # (+) ação applyReading + overlay na hidratação
└── page/lancar-documento.page.tsx          # (+) wiring aditivo do leitor
```

**Structure Decision**: subpasta `reader/` dentro da feature `document-create`. O núcleo é agnóstico de framework
(node:test com imports relativos); só `document-reader.binding.ts` toca React/pdf.js.

## Server Functions & Contratos do BFF

Nenhuma. Feature 100% client-side. A `ingestDocumentFn` (#062) permanece a única fronteira e não é alterada.

## Integração core-api

| Capacidade                                                | Prontidão       | Estratégia Fase 1                                     |
| --------------------------------------------------------- | --------------- | ----------------------------------------------------- |
| Ingestão do rascunho (`POST /financial/documents/ingest`) | 🟢 já consumida | preservada intacta (aditivo)                          |
| Leitura precisa dos campos                                | 🟢 client-side  | leitor por gabarito (esta feature) — vence o rascunho |

## Design System Impact

- **Tokens**: reuso do destaque âmbar + tag "OCR" existente (`ocrReadFields` / `document-form.view.ts`). Sem hex/px.
- **Átomos/Moléculas/Organismos novos**: nenhum.
- **Templates/Pages**: `lancar-documento.page.tsx` ganha wiring; sem mudança visual estrutural.

## Data Model (client × server)

- **server/domain**: inalterado.
- **client**: novo `DocumentReading` (modelo de leitura, PURO — não é server-state, não passa por Zod de rede).
  O mapeador converte para `DocumentReadingPatch` (subconjunto de `DocumentFormFields` já mascarado em reais).

## Plano de Testes (TDD)

- **Puro (`node:test`)**:
  - cada parser XML (nacional, ABRASF, SP, NF-e produto) — mapeamento campo-a-campo com fixtures **sintéticas**.
  - `read-xml` — roteamento por marcador na ordem correta.
  - `gabarito-engine` — agrupamento de linhas, conversores (moeda/data/competência), estratégias
    (direita/abaixo/coluna/regex), detecção de gabarito + pós-processamento.
  - `document-reading.view` — mapa `DocumentReading`→patch + `matchPartnerByTaxId` (normalização de CNPJ).
- **DOM (Vitest/jsdom)**: `document-reader.binding` com pdf.js **mockado** (retorna itens de texto sintéticos) +
  precedência client-vence no controller.
- **LGPD**: todas as fixtures são sintéticas (CNPJ `11.222.333/0001-81`, nomes fictícios). Zero dado real.

## Complexity Tracking

| Violação                   | Por que necessária                                                           | Alternativa simples rejeitada porque                                             |
| -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| +1 dep (`fast-xml-parser`) | parse robusto de XML por leiaute; mesma lib do core-api (paridade de árvore) | parser DIY de XML seria frágil e reinventaria a roda; regex em XML é anti-padrão |
