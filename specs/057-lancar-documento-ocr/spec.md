# Spec — Lançar Documento: OCR real (ingestão via `/documents/ingest`) · #057

- **Feature:** `057-lancar-documento-ocr`
- **Escala:** M (1 frente; toca `financial` client + server; fluxo sensível `document-create` — mudanças ADITIVAS)
- **Rastreio:** core-api#62 ("Fatia 7 — ingestão via OCR") · `HANDBOOK-financeiro-incluir-documento.md`
- **ADR/§:** §II erros-como-valores · §III server-fn única fronteira · §IX Zod na borda + token server-side · §XI MVVM · ADR-0009/0010/0011

## Contexto

O scaffolding de OCR (upload UI, gateway, binding, server-fn stub) já existia devolvendo `ocr-unavailable`
(chrome honesto enquanto o backend não existia). A `dev` do core-api passou a expor o endpoint real (#62).
Esta feature liga a costura à borda real e muda o **fluxo**: em vez de patch-in-place no form, a ingestão
**cria um rascunho pré-preenchido** e a tela reabre esse rascunho em modo edição para revisão/confirmação.

## Contrato real (core-api dev, #62)

- **`POST /financial/documents/ingest`** — corpo `application/octet-stream` = bytes do arquivo (≤20 MiB);
  querystring `fileName` (sanitizado) + `mimeType` (allowlist: `application/pdf`, `text/xml`, `application/xml`);
  perm `fiscal-document:write`. Segurança no backend: magic-bytes + allowlist.
- **Resposta 201:** `{ documentId: string, resolvedVia: 'xml' | 'native-text' | null }` — **CRIA UM RASCUNHO**
  persistido pré-preenchido; os campos extraídos ficam no rascunho (não voltam inline).

## Requisitos

- **FR-001 — Upload binário pela fronteira (§III/§IX):** o gateway (browser) lê o `File` → base64 e envia no
  input da server-fn (`{ fileName, mimeType, dataBase64 }`); o server decodifica base64 → `Uint8Array`, valida
  (Zod + borda: base64 não-vazia, ≤20 MiB, `mimeType` na allowlist, `fileName` sanitizado) e faz o POST
  octet-stream ao core-api via o helper existente `octetStreamFetch`. Nenhum byte cru cruza como JSON além do base64.
- **FR-002 — Aceite por MIME OU extensão (lição [[pdf-attach-mime-bug]]):** o gateway aceita `.pdf`/`.xml` por
  **MIME OU extensão**, nunca só por `File.type`; tipo desconhecido/fora da allowlist → erro claro **antes** de subir.
- **FR-003 — Fluxo ingest → editar o rascunho:** no sucesso, em vez do patch-in-place, a tela **navega para o
  modo edição** daquele `documentId` (`/financeiro/contas-a-pagar/lancar?id=<documentId>`), reusando o trigger
  de edição já existente (search param `id` → prop `documentId` → `useDocumentEditing`). O humano revisa os campos
  já extraídos e conclui. **O binding do OCR nunca cria documento** — só ingere (1 rascunho) e navega; a conclusão
  é a ação normal do operador na tela do rascunho (sem 2º documento originado do OCR).
- **FR-004 — Erros como valores (§II/§V):** `OcrError` = união de string mapeada 1:1 client↔server:
  `invalid-mime` · `file-too-large` · `invalid-file` (base64/magic recusado) · `unauthorized` · `server`.
  A UI exibe a mensagem PT correspondente; nunca olha status HTTP.
- **FR-005 — Feedback honesto:** idle → running ("Lendo o documento…") → done ("Rascunho criado — revise") →
  navega; erro real (mime/tamanho/arquivo/servidor) mostra a mensagem específica na drop-zone.
- **FR-006 — Aceite de formatos na UI:** a drop-zone passa a aceitar **PDF ou XML · até 20 MB** (imagens saem —
  não estão na allowlist do backend).
- **FR-007 — Web view do documento (leitura):** no espaço do OCR, o arquivo subido é PRÉ-VISUALIZADO para o
  operador ler e conferir — PDF em `<iframe blob:>` (a CSP já libera `frame-src blob:`), XML em texto puro. O
  `File` vive no estado da page e sobrevive à navegação criar→editar (MESMA rota) — sem re-buscar bytes do
  backend. Essencial no PDF, cuja extração ainda é parcial (o operador lê e preenche à mão). Reload direto do
  `?id` perde o arquivo → cai em "sem pré-visualização". Binding `document-preview.binding.ts` (objectURL PDF
  com revoke; `File.text()` XML guardado por arquivo — sem setState síncrono em effect).
- **FR-008 — Destaque dos campos lidos (borda âmbar + tag "OCR"):** os campos que o OCR preencheu ganham barra
  âmbar à esquerda + tag "OCR" no rótulo (mock). Derivação PURA `ocrReadFields(fields, isOcrSession)` a partir do
  rascunho hidratado INICIAL (a marca reflete a extração, não os edits do operador). EXCLUI competência (auto da
  emissão) e Reforma Tributária (CBS/IBS); retenção só marca se > 0. Fora de sessão de OCR, nada é destacado.

## Fora de escopo / handoffs

- **Promoção/finalização do rascunho:** a conclusão do rascunho (Rascunho → Aberto) segue o fluxo existente da
  tela (modo `draft`). Se o backend precisar de um endpoint de _finalize/promote_ para não duplicar ao concluir
  um rascunho, isso é decisão/handoff do core-api — **não introduzida nem alterada** por esta feature.
- **Auto-seleção do fornecedor por CNPJ extraído:** o rascunho vem com `supplier_ref` NULL (a ingestão não resolve
  o CNPJ do prestador → parceiro). Decisão do P.O.: o operador seleciona o fornecedor MANUALMENTE por ora; a
  resolução automática é **handoff de backend** (a ingestão deve casar CNPJ → `supplier_ref`).
- OCR de imagem (PNG/JPG) — fora da allowlist do backend (#62).
- **Extração de PDF parcial:** o leitor nativo do core-api ainda falha em vários PDFs digitais (handoff #386);
  enquanto isso o web view (FR-007) deixa o operador ler e preencher, e o destaque (FR-008) acende só o que veio.

## Gate / DoD

- `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` verdes.
- Lint no baseline (0 erros / ≤115 warnings). Sem `!` non-null; sem `x as HTMLElement` sobre `T|undefined`.
- Cobertura nova: node:test da validação de borda + gateway/server-fn (base64 round-trip, allowlist, mapeamento
  de erro); vitest DOM (aceita `.pdf` e `.xml`, sucesso navega, erro mostra mensagem).
- `document-create` (create + edit) intacto: `pnpm test:dom` do módulo + node verdes.
