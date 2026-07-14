# Implementation Plan: Preview de PDF por canvas (pdf.js)

**Branch**: `go-live-front` (trabalho em 071) | **Date**: 2026-07-14 | **Spec**: `./spec.md`

**Input**: `specs/071-pdf-canvas-preview/spec.md`

## Summary

Substituir o `<iframe>` do visualizador nativo (branch `preview.kind === 'pdf'` de
`document-preview.component.tsx`) por um **organism reutilizável** que rasteriza as páginas do PDF em
`<canvas>` empilhados num container rolável — só o conteúdo, sem toolbar/miniaturas. O zoom atual
(− % +, 50%–200%) passa a controlar a escala de render. pdf.js roda só no client (import dinâmico); o
worker é same-origin (bundle Vite) → a CSP estrita NÃO muda.

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · React 19
**Meta-framework**: Vite + `@tanstack/react-start` (SSR) — pdf.js é client-only (dynamic import em effect)
**UI**: canvas 2D + `pdfjs-dist@6.1.200`
**Design System**: vanilla-extract (zero-runtime), só-tokens (`vars.*`) — dimensões dinâmicas via CSS var inline
**Testes**: `node:test` (helpers puros escala/dpr/clamp) + Vitest/jsdom (component + wiring; pdf.js/canvas mockados)
**Target Platform**: navegador moderno; SSR entrega placeholder
**Constraints**: token nunca no browser (N/A aqui); **CSP estrita sem `worker-src`** → worker same-origin obrigatório
**Scale/Scope**: 1 organism novo (4 arquivos) + wiring em 1 component + specs de teste

## Constitution Check

| Princípio                            | Aderência    | Nota                                                                        |
| ------------------------------------ | ------------ | --------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓            | feature 100% client (blob local); nenhuma server fn                         |
| II. Errors Are Values                | ✓            | falha do pdf.js vira ESTADO (`status: 'error'`), não exceção pra UI         |
| III. Client×Server Modular           | ✓            | organism em `shared/ui`; consumido via barrel `#shared/ui`                  |
| IV. Illegal States Unrepresentable   | ✓            | `status` união discriminada (`loading`/`ready`/`error`)                     |
| V. Server-State ≠ UI-State           | ✓            | zoom/status são UI-state local; sem Query                                   |
| VI. Validation at the Boundary       | ✓            | N/A (sem input externo; blob local do próprio arquivo)                      |
| VII. Strict TS 6→7                   | ✓            | união `as const`, sem enum/namespace; `erasableSyntaxOnly` ok               |
| VIII. Minimal Dependencies           | ✓ (com nota) | 1 dep nova — ver "Dependência" abaixo                                       |
| IX. pnpm Only                        | ✓            | `pnpm add pdfjs-dist` (hook bloqueia npm/yarn)                              |
| X. Spec-Driven                       | ✓            | esta feature 071 (spec+plan); sem ADR (adição de dep, não decisão de stack) |
| XI. Framework-Agnostic Client (MVVM) | ✓            | render imperativo em `*.binding.ts`; puro em `*.view.ts`; view burra        |
| XII. Reactive Flow via Event Bus     | ✓            | N/A                                                                         |

## Dependência (`pdfjs-dist`) — justificativa (§VIII, ADR-0003)

- **Por que**: não há via nativa de renderizar **só o conteúdo** de um PDF. O visualizador nativo do
  navegador (via `<iframe>`) ignora `#toolbar=0&navpanes=0` e injeta seu próprio chrome (barra +
  miniaturas). Renderizar nós mesmos exige um parser/rasterizador de PDF — `pdfjs-dist` é o padrão de
  fato (mantido pela Mozilla).
- **Consistência com o backend**: o core-api já padroniza em pdfjs na estratégia de gabarito (#432) —
  mesma família, reduz surpresa entre as pontas.
- **Supply-chain (ADR-0003)**: `pdfjs-dist@6.1.200` é versão madura → passa a quarentena
  `minimumReleaseAge: 1440` sem exceção. Import **dinâmico** (não entra no bundle SSR/inicial;
  code-split sob demanda no client).
- **ADR?**: não. É adição de dependência utilitária (renderização), não troca/expansão de stack —
  não há decisão arquitetural nova a registrar. (A correção do prompt: a quarentena de deps é
  ADR-0003, não ADR-0008.)

## CSP — o worker sob a política estrita (Princ. IX / ADR-0006)

A CSP (`src/shared/http/security-headers.ts`) é: `script-src 'self'`, **sem `worker-src`** (cai em
`default-src 'self'`), `frame-src 'self' blob:`. Estratégia:

- `pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()`.
  O Vite emite o worker como **asset same-origin** (`/assets/pdf.worker-<hash>.mjs`). O `new Worker(url,
{ type: 'module' })` que o pdf.js dispara é same-origin → governado por `worker-src` que **cai em
  `default-src 'self'`** → permitido. **Nenhuma mudança de CSP.**
- **NÃO** usar worker via `blob:`/CDN nem `disableWorker` (o blob-worker seria barrado pela CSP).
- `getDocument({ useWasm: false })` → o pdf.js **v6** removeu o caminho de `eval` (o antigo
  `isEvalSupported` não existe mais no tipo). O WASM é **opt-in via `wasmUrl`** (default `null`); ao NÃO
  setar `wasmUrl` + `useWasm: false`, nenhum decoder WASM é instanciado (dispensa `wasm-unsafe-eval`).
  DANFSe/DANFE são texto/vetor → sem JPEG2000/JBIG2.
- **Verificação**: cruzada com o security-frontend-expert. Conclusão registrada em "Resultado".

## Project Structure

### Source Code

```text
src/shared/ui/organisms/pdf-preview/
├── pdf-preview.view.ts            # PURO (node:test): clamp de zoom, escala de backing por dpr, css←backing
├── use-pdf-canvas.binding.ts      # ADAPTER React: import dinâmico do pdf.js, render por página,
│                                  #   cancelamento (renderTask) + destroy (loadingTask/doc), status
├── pdf-canvas-preview.component.tsx # VIEW BURRA: container role="img" + estados loading/erro (+download)
├── pdf-canvas-preview.css.ts      # só-tokens; dimensões dinâmicas via CSS var inline (como --ocr-zoom)
└── index.ts                       # barrel do organism → reexportado por organisms/index.ts → #shared/ui
```

Wiring: `document-preview.component.tsx` troca o `<iframe>` (branch pdf) por `<PdfCanvasPreview
url={preview.url} zoom={zoom} label=… loadingLabel=… errorLabel=… downloadLabel=… />` importado de
`#shared/ui`. XML, drop-zone, header e zoom-UI intactos.

**Structure Decision**: organism em `shared/ui` (tipo `ds-organism` no boundaries) para reuso
cross-módulo via barrel `#shared/ui` (o `client-ui` importa `shared-ui`). MVVM por sufixo de arquivo.

## Design System Impact

- **Tokens**: usa `vars.*` (surface/space/radius/color/font). Sem hex/px cru; escala do canvas é
  runtime (backing store px) — não é dimensão de design.
- **Organism novo**: `pdf-preview` (view burra, agnóstica de domínio; rótulos por prop → i18n no caller).

## Plano de Testes (TDD)

- **Puro (`node:test`)** — `tests/shared/ui/organisms/pdf-preview/pdf-preview.view.test.ts`:
  `clampPdfZoom` (50–200), `safeDpr` (fallback 1), `backingScale(zoom,dpr)`, `cssPxFromBacking`.
- **DOM (Vitest/jsdom)** — `tests/shared/ui/organisms/pdf-preview/pdf-canvas-preview.spec.tsx`:
  mocka `usePdfCanvas` (jsdom não tem canvas 2d/worker); verifica container `role="img"` + estados
  loading/erro (+ link download no erro).
- **DOM (atualização)** — `tests/modules/financial/client/document-create/document-preview.spec.tsx`:
  as asserções do `<iframe src=…#zoom>` mudam → agora o branch PDF monta o `PdfCanvasPreview`
  (mock do binding) e propaga o zoom; XML (`--ocr-zoom`) e drop-zone seguem intactos.

## Complexity Tracking

Sem violações da constituição a justificar (a dep nova está coberta por §VIII + ADR-0003 acima).

## Resultado (execução — 2026-07-14)

- **CSP não muda** (veredito do security-frontend-expert, cruzado com `pdfjs-dist@6.1.200`): o worker é
  asset same-origin do Vite (`/assets/pdf.worker.min-<hash>.mjs`), governado por `default-src 'self'`
  via fallback `worker-src → child-src → default-src`. Nenhum caminho toca `blob:`/`eval`/WASM com a
  config adotada (`useWasm: false`, sem `wasmUrl`; docs de texto/vetor). Confirmado no bundle:
  `.output/public/assets/pdf.worker.min-*.mjs` referenciado por `new URL(..., import.meta.url)` —
  sem blob/CDN. Duas condições reabrem a análise no futuro: setar `wasmUrl` (exigiria
  `'wasm-unsafe-eval'`) ou trocar por blob-worker/CDN.
- **`pnpm build` verde**: dep + worker same-origin + SSR (import dinâmico não entra no caminho de
  execução do servidor) — build ok, worker emitido em `public/assets`.
- **Gate**: typecheck 0 · lint 0 erros (114 warnings pré-existentes) · node 1398 · dom 513.

## Follow-ups

- **Modal de contratos** (`contracts/.../document-preview-modal.component.tsx`) usa `<iframe>` de PDF
  blob (mesma limitação Safari/WebKit anotada no próprio arquivo — que o canvas RESOLVERIA).
  **Decisão: deixar como follow-up.** Não foi ligado agora para não estourar escopo: o modal já tem
  loading/erro/download próprios e NÃO tem controle de zoom → plugar o organism exigiria reconciliar
  esses estados e definir uma escala (fixa ou com controle). Baixo risco, mas fora do escopo desta
  feature; candidato natural à próxima iteração.
