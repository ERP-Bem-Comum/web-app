# Feature Specification: Preview de PDF por canvas (pdf.js) no Lançar Documento

**Feature Branch**: `071-pdf-canvas-preview`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Renderizar o PDF do web view do Lançar Documento por pdf.js em canvas (só o conteúdo do documento), substituindo o `<iframe>` do visualizador nativo, que ignora `#toolbar=0&navpanes=0` e mostra a barra + o painel de miniaturas."

> **Variante `-fe` (frontend / web-app).** Descreve o **quê**; o **como** (organism reutilizável, binding pdf.js, CSP) fica no `plan.md`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ler o PDF sem o chrome do visualizador (Priority: P1)

O operador financeiro sobe um PDF (NFS-e/DANFSe/DANFE) na coluna de OCR do Lançar Documento para
conferir os dados que o backend extraiu. Hoje o PDF abre num `<iframe>` do visualizador nativo do
Chromium, que — apesar do `#toolbar=0&navpanes=0` — mostra a barra de ferramentas e o painel de
MINIATURAS (a "faixa preta" lateral). Quando a coluna do OCR fica larga (#224), esse chrome come o
espaço de leitura. O operador quer ver **só o conteúdo** do documento, empilhado e rolável.

**Why this priority**: é a dor validada em tela pela P.O. — o chrome do viewer nativo prejudica a
conferência do documento, tarefa central do fluxo de lançamento (a extração ainda é parcial).

**Independent Test**: subir um PDF em `/financeiro/lancar-documento`; a prévia mostra as páginas do
documento (canvas) sem barra de ferramentas nem miniaturas, com rolagem vertical entre páginas.

**Acceptance Scenarios**:

1. **Given** um PDF selecionado, **When** a prévia carrega, **Then** vejo o conteúdo das páginas
   empilhadas num container rolável — sem toolbar e sem painel de miniaturas.
2. **Given** o PDF renderizado a 100%, **When** clico em `+`/`−`, **Then** as páginas re-renderizam
   na nova escala (50%–200%), nítidas em telas retina.
3. **Given** a prévia está renderizando, **When** ainda não terminou, **Then** vejo um estado
   "carregando…" honesto.
4. **Given** o pdf.js falha ao abrir o arquivo, **When** o erro ocorre, **Then** vejo uma nota de erro
   honesta e um caminho para baixar/abrir o arquivo — a tela NÃO quebra.

### Edge Cases

- **Troca de arquivo / re-zoom rápido**: o render em voo é cancelado e o documento anterior é
  destruído — sem vazamento nem "Canvas already in use".
- **SSR**: o pdf.js roda só no client (o `blob:`/`File` é client-only); no servidor a área mostra um
  placeholder e nada quebra o build.
- **XML**: segue em `<pre>` (texto) — inalterado.
- **Sem arquivo**: a drop-zone de ingestão segue inalterada.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE renderizar cada página do PDF num `<canvas>` empilhado num container
  rolável, exibindo apenas o conteúdo do documento (sem toolbar/miniaturas do visualizador nativo).
- **FR-002**: O usuário DEVE poder ajustar o zoom (− % +, 50%–200%) e a prévia DEVE re-renderizar os
  canvases na nova escala.
- **FR-003**: A renderização DEVE ser nítida em telas retina (escala do backing store por
  `devicePixelRatio`; tamanho CSS lógico).
- **FR-004**: O sistema DEVE cancelar o render em voo e destruir o documento pdf.js ao trocar de
  arquivo, mudar o zoom ou desmontar (sem vazamento).
- **FR-005**: O sistema DEVE exibir um estado "carregando…" durante o render e uma nota de erro honesta
  em falha do pdf.js, mantendo o arquivo acessível (link de download do blob) e sem quebrar a tela.
- **FR-006**: O componente de prévia DEVE ser reutilizável (agnóstico de domínio) e receber o
  rótulo de acessibilidade por prop (container `role="img"`/`aria-label`).
- **FR-007**: O sistema DEVE carregar o worker do pdf.js de origem **same-origin** (bundle Vite),
  sem `blob:`/CDN, respeitando a CSP estrita vigente (sem relaxá-la).
- **FR-008**: Os fluxos vizinhos DEVEM permanecer intactos: branch XML (`<pre>`), drop-zone,
  header/badge, controles de zoom (UI) e a coluna redimensionável (#224).

### Key Entities

- **Prévia de PDF**: fonte = `blob:` URL do arquivo local (client-only); saída = páginas rasterizadas
  em canvas. Sem persistência (efêmero, por sessão de tela).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: com um PDF aberto e a coluna do OCR larga, a área de leitura NÃO exibe barra de
  ferramentas nem faixa de miniaturas — só o conteúdo.
- **SC-002**: alternar o zoom entre 50% e 200% mantém o texto legível/nítido (retina) e não vaza
  memória (troca de arquivo/zoom repetida não acumula documentos pdf.js).
- **SC-003**: nenhuma mudança na CSP é necessária (worker same-origin) — verificado com o
  security-frontend-expert.

## Impacto Arquitetural (web-app / BFF)

- **Módulo(s) vertical(is) afetado(s)**: [x] `shared/ui` (novo organism reutilizável) · estende
  `financial` (wiring no Lançar Documento). Opcional: `contracts` (modal de anexo) — avaliado no plano.
- **Server functions novas/alteradas?**: nenhuma — feature puramente client (o PDF já é blob local).
- **Integração core-api**: nenhuma.
- **Novos agregados / Value Objects?**: nenhum.
- **Eventos no client (Event Bus)?**: nenhum.
- **Design System**: [x] novo organism (`shared/ui/organisms/pdf-preview`) — só-tokens.
- **Possíveis violações da constituição (I–XII)?**: a renderização é imperativa (acoplamento a
  plataforma: canvas + pdf.js) → isolada em `*.binding.ts`; lógica pura (escala/dpr/clamp) em `*.view.ts`;
  view burra. Nova dependência (`pdfjs-dist`) → justificada no plano (§VIII); sem ADR de stack.

## Assumptions

- DANFSe/DANFE são PDFs de texto/vetor → não exigem `wasm-unsafe-eval` (decodificadores JPEG2000/JBIG2).
- O worker emitido pelo Vite via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` é
  servido same-origin (`/assets/…`) → coberto por `default-src 'self'`.

## Out of Scope

- Seleção/ cópia de texto, busca, anotações, rotação, impressão (só leitura visual).
- Substituir o preview do XML (segue texto).
- Novo endpoint / mudança de contrato no core-api.
